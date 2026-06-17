import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

type SessionRow = Prisma.SessionGetPayload<Record<string, never>>;
type WifiRow    = Prisma.WifiSessionGetPayload<Record<string, never>>;
type TourneyRow = Prisma.TournamentGetPayload<{
  include: { _count: { select: { tournamentEntries: true } } };
}>;

const tourneyInclude = { _count: { select: { tournamentEntries: true } } } as const;

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "daily")   return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === "weekly")  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  if (period === "monthly") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const since  = periodStart(period);

    const sessionWhere = since ? { createdAt: { gte: since } } : {};
    const wifiWhere    = since ? { startedAt: { gte: since } } : {};

    const now   = new Date();
    const now24 = new Date(now.getTime() -  1 * 24 * 60 * 60 * 1000);
    const now7  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
    const now30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Primary fetch: period-scoped data + static tables
    const [sessions, wifiSessions, players, membershipPlans, completedTournaments] =
      await Promise.all([
        prisma.session.findMany({ where: sessionWhere }),
        prisma.wifiSession.findMany({ where: wifiWhere }),
        prisma.player.findMany(),
        prisma.membershipPlan.findMany(),
        prisma.tournament.findMany({
          where: since
            ? { status: "completed", completedAt: { gte: since } }
            : { status: "completed" },
          include: tourneyInclude,
        }),
      ]);

    // When a period filter is active, fetch all-time data for the revenueByPeriod breakdown
    let allSessions: SessionRow[]   = [];
    let allWifi: WifiRow[]          = [];
    let allTournaments: TourneyRow[] = [];
    if (since) {
      [allSessions, allWifi, allTournaments] = await Promise.all([
        prisma.session.findMany(),
        prisma.wifiSession.findMany(),
        prisma.tournament.findMany({ where: { status: "completed" }, include: tourneyInclude }),
      ]);
    }

    const effectiveAllSessions = since ? allSessions : sessions;
    const effectiveAllWifi     = since ? allWifi     : wifiSessions;
    const effectiveAllTourneys = since ? allTournaments : completedTournaments;

    // Auto-expire stale ACTIVE sessions
    const expired = sessions.filter(
      (s) => s.status === "ACTIVE" && new Date(s.endTime) < now
    );
    if (expired.length > 0) {
      await prisma.$transaction([
        ...expired.map((s) =>
          prisma.session.update({ where: { id: s.id }, data: { status: "ENDED" } })
        ),
        prisma.device.updateMany({
          where: { id: { in: expired.map((s) => s.deviceId).filter(Boolean) as string[] } },
          data:  { status: "available", currentSessionId: null },
        }),
      ]);
      for (const s of sessions) {
        if (expired.find((e) => e.id === s.id)) s.status = "ENDED";
      }
    }

    // Revenue calculations
    const sessionRevenue    = sessions.reduce((a, r) => a + (r.totalPrice || 0), 0);
    const wifiRevenue       = wifiSessions.reduce((a, r) => a + (r.priceUsd  || 0), 0);
    const tournamentRevenue = completedTournaments.reduce(
      (a, t) => a + (t.entryFee || 0) * t._count.tournamentEntries, 0
    );

    const planPriceByName: Record<string, number> = {};
    for (const plan of membershipPlans) planPriceByName[plan.name] = plan.priceUsd;
    const membershipRevenue = players.reduce((a, p) => {
      if (!["Warrior", "Hero", "Legend"].includes(p.membershipTier)) return a;
      return a + (planPriceByName[p.membershipTier] || 0);
    }, 0);

    const totalRevenueUsd = sessionRevenue + wifiRevenue + tournamentRevenue + membershipRevenue;

    // Revenue by period (all 4 streams)
    function periodRevenue(from: Date) {
      const sess  = effectiveAllSessions
        .filter((s) => new Date(s.createdAt) >= from)
        .reduce((a, s) => a + (s.totalPrice || 0), 0);
      const wifi  = effectiveAllWifi
        .filter((w) => new Date(w.startedAt) >= from)
        .reduce((a, w) => a + (w.priceUsd || 0), 0);
      const tourny = effectiveAllTourneys
        .filter((t) => t.completedAt && new Date(t.completedAt) >= from)
        .reduce((a, t) => a + (t.entryFee || 0) * t._count.tournamentEntries, 0);
      return { sessions: sess, wifi, tournaments: tourny, total: sess + wifi + tourny };
    }
    const revenueByPeriod = {
      daily:   periodRevenue(now24),
      weekly:  periodRevenue(now7),
      monthly: periodRevenue(now30),
    };

    // Revenue by station (dollars)
    const stationRevMap: Record<string, { revenue: number; sessions: number; hours: number }> = {};
    for (const s of effectiveAllSessions) {
      if (!s.deviceName) continue;
      if (!stationRevMap[s.deviceName]) stationRevMap[s.deviceName] = { revenue: 0, sessions: 0, hours: 0 };
      stationRevMap[s.deviceName].revenue  += s.totalPrice    || 0;
      stationRevMap[s.deviceName].sessions += 1;
      stationRevMap[s.deviceName].hours    += s.durationHours || 0;
    }
    const revenueByStation = Object.entries(stationRevMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([station, d]) => ({ station, ...d }));

    // Revenue by game (dollars)
    const gameRevMap: Record<string, { revenue: number; sessions: number }> = {};
    for (const s of effectiveAllSessions) {
      if (!s.game) continue;
      if (!gameRevMap[s.game]) gameRevMap[s.game] = { revenue: 0, sessions: 0 };
      gameRevMap[s.game].revenue  += s.totalPrice || 0;
      gameRevMap[s.game].sessions += 1;
    }
    const revenueByGame = Object.entries(gameRevMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([game, d]) => ({ game, ...d }));

    // Top spenders
    const spenderMap: Record<string, { name: string; spend: number; sessions: number }> = {};
    for (const s of effectiveAllSessions) {
      if (!s.playerName) continue;
      if (!spenderMap[s.playerName]) spenderMap[s.playerName] = { name: s.playerName, spend: 0, sessions: 0 };
      spenderMap[s.playerName].spend    += s.totalPrice || 0;
      spenderMap[s.playerName].sessions += 1;
    }
    const topSpenders = Object.values(spenderMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    // Best tournaments by revenue
    const bestTournaments = effectiveAllTourneys
      .map((t) => ({
        id:       t.id,
        name:     t.name,
        game:     t.game,
        entryFee: t.entryFee || 0,
        entries:  t._count.tournamentEntries,
        revenue:  (t.entryFee || 0) * t._count.tournamentEntries,
        prizeUsd: t.prizeUsd || 0,
        profit:   (t.entryFee || 0) * t._count.tournamentEntries - (t.prizeUsd || 0),
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Misc operational metrics
    const activeSessions    = sessions.filter((s) => s.status === "ACTIVE");
    const activeWifiUsers   = wifiSessions.filter((w) => w.status === "active");
    const totalMembers      = players.filter((p) => ["Warrior", "Hero", "Legend"].includes(p.membershipTier)).length;
    const completedSessions = sessions.filter((s) => s.status === "ENDED").length;
    const totalGamingHours  = sessions.reduce((a, r) => a + (r.durationHours || 0), 0);
    const averageSessionRevenue = sessions.length > 0 ? sessionRevenue / sessions.length : 0;
    const totalPlayers          = players.length;
    const newPlayersThisMonth   = players.filter((p) => new Date(p.joinedAt) >= now30).length;

    // Legacy compat fields
    const mostPlayedGames  = revenueByGame.slice(0, 5).map((g) => ({ game: g.game, count: g.sessions }));
    const mostUsedStations = revenueByStation.slice(0, 5).map((s) => ({ station: s.station, count: s.sessions }));
    const busiestGame      = revenueByGame[0]?.game    || "N/A";
    const busiestDevice    = revenueByStation[0]?.station || "N/A";

    // Notifications (expiring sessions)
    const notifications = activeSessions
      .filter((s) => s.remainingMinutes <= 10)
      .map((s) => ({
        id:               s.id,
        message:          `Session for ${s.playerName} on ${s.deviceName} expires in ${s.remainingMinutes} minute(s).`,
        severity:         "warning" as const,
        sessionId:        s.id,
        remainingMinutes: s.remainingMinutes,
      }));

    const activeSessionsList = activeSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map((s) => ({
        ...s,
        startTime: new Date(s.startTime).toISOString(),
        endTime:   new Date(s.endTime).toISOString(),
        createdAt: new Date(s.createdAt).toISOString(),
      }));

    const activeWifiList = activeWifiUsers.map((w) => ({
      ...w,
      startedAt: new Date(w.startedAt).toISOString(),
      expiresAt: new Date(w.expiresAt).toISOString(),
    }));

    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });

    return NextResponse.json({
      period,
      // Revenue totals
      totalRevenueUsd,
      sessionRevenue,
      wifiRevenue,
      tournamentRevenue,
      membershipRevenue,
      revenueByCategory: { sessions: sessionRevenue, wifi: wifiRevenue, tournaments: tournamentRevenue, memberships: membershipRevenue },
      // Business intelligence
      revenueByStation,
      revenueByGame,
      topSpenders,
      bestTournaments,
      // Period breakdowns
      revenueByPeriod,
      // Operational
      activeSessions: activeSessions.length,
      activeWifiUsers: activeWifiUsers.length,
      totalMembers,
      completedSessions,
      totalGamingHours,
      averageSessionRevenue,
      totalPlayers,
      newPlayersThisMonth,
      // Legacy compat
      mostPlayedGames,
      mostUsedStations,
      busiestGame,
      busiestDevice,
      // Live lists
      activeSessionsList,
      activeWifiList,
      notifications,
      announcements: announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[analytics/GET]", error);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}
