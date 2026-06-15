import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getDateRange(period: string): Date | null {
  const now = new Date();
  if (period === "daily") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "weekly") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "monthly") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";

    const sinceDate = getDateRange(period);

    const sessionWhere = sinceDate ? { createdAt: { gte: sinceDate } } : {};
    const wifiWhere = sinceDate ? { startedAt: { gte: sinceDate } } : {};

    const [sessions, wifiSessions, players, announcements] = await Promise.all([
      prisma.session.findMany({ where: sessionWhere }),
      prisma.wifiSession.findMany({ where: wifiWhere }),
      prisma.player.findMany(),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // Update expired ACTIVE sessions — mark as ENDED and release device
    const now = new Date();
    const expiredSessions = sessions.filter(
      (s) => s.status === "ACTIVE" && new Date(s.endTime) < now
    );

    if (expiredSessions.length > 0) {
      await prisma.$transaction(
        expiredSessions.map((s) =>
          prisma.session.update({
            where: { id: s.id },
            data: { status: "ENDED" },
          })
        )
      );

      // Release devices that were occupied by expired sessions
      const deviceIds = expiredSessions.map((s) => s.deviceId).filter(Boolean);
      if (deviceIds.length > 0) {
        await prisma.device.updateMany({
          where: { id: { in: deviceIds as string[] } },
          data: { status: "available", currentSessionId: null },
        });
      }

      // Reflect the updates in the in-memory list
      for (const s of sessions) {
        if (expiredSessions.find((e) => e.id === s.id)) {
          s.status = "ENDED";
        }
      }
    }

    // Revenue helpers
    const now30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const now7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const now24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const sessionRevenue = sessions.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const wifiRevenue = wifiSessions.reduce((sum, w) => sum + (w.priceUsd || 0), 0);

    // Membership revenue: fetch active membership plans and count members per tier
    const membershipPlans = await prisma.membershipPlan.findMany();
    const tierCounts: Record<string, number> = {};
    for (const p of players) {
      if (["Warrior", "Hero", "Legend"].includes(p.membershipTier)) {
        tierCounts[p.membershipTier] = (tierCounts[p.membershipTier] || 0) + 1;
      }
    }
    // Map plan name to price (plan name matches membershipTier by convention)
    const planPriceByName: Record<string, number> = {};
    for (const plan of membershipPlans) {
      planPriceByName[plan.name] = plan.priceUsd;
    }
    const membershipRevenue = Object.entries(tierCounts).reduce(
      (sum, [tier, count]) => sum + (planPriceByName[tier] || 0) * count,
      0
    );

    const totalRevenueUsd = sessionRevenue + wifiRevenue + membershipRevenue;

    // Active counts
    const activeSessions = sessions.filter((s) => s.status === "ACTIVE");
    const activeWifiUsers = wifiSessions.filter((w) => w.status === "active");

    // Members
    const totalMembers = players.filter((p) =>
      ["Warrior", "Hero", "Legend"].includes(p.membershipTier)
    ).length;

    // Most played games
    const gameCount: Record<string, number> = {};
    for (const s of sessions) {
      if (s.game) gameCount[s.game] = (gameCount[s.game] || 0) + 1;
    }
    const mostPlayedGames = Object.entries(gameCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([game, count]) => ({ game, count }));

    // Most used stations (by deviceName)
    const stationCount: Record<string, number> = {};
    for (const s of sessions) {
      if (s.deviceName) stationCount[s.deviceName] = (stationCount[s.deviceName] || 0) + 1;
    }
    const mostUsedStations = Object.entries(stationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([station, count]) => ({ station, count }));

    const completedSessions = sessions.filter((s) => s.status === "ENDED").length;
    const totalGamingHours = sessions.reduce((sum, s) => sum + (s.durationHours || 0), 0);
    const averageSessionRevenue =
      sessions.length > 0 ? sessionRevenue / sessions.length : 0;

    const busiestGame = mostPlayedGames[0]?.game || "N/A";
    const busiestDevice = mostUsedStations[0]?.station || "N/A";

    // Active sessions list sorted by startTime desc
    const activeSessionsList = activeSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map((s) => ({
        ...s,
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString(),
        createdAt: new Date(s.createdAt).toISOString(),
      }));

    // Active wifi list
    const activeWifiList = activeWifiUsers.map((w) => ({
      ...w,
      startedAt: new Date(w.startedAt).toISOString(),
      expiresAt: new Date(w.expiresAt).toISOString(),
    }));

    // Revenue by period (always computed from ALL sessions/wifi, not filtered by period param)
    const [allSessions, allWifiSessions] = await Promise.all([
      sinceDate
        ? prisma.session.findMany()
        : Promise.resolve(sessions),
      sinceDate
        ? prisma.wifiSession.findMany()
        : Promise.resolve(wifiSessions),
    ]);

    const revenueByPeriod = {
      daily: {
        sessions: allSessions
          .filter((s) => new Date(s.createdAt) >= now24)
          .reduce((sum, s) => sum + (s.totalPrice || 0), 0),
        wifi: allWifiSessions
          .filter((w) => new Date(w.startedAt) >= now24)
          .reduce((sum, w) => sum + (w.priceUsd || 0), 0),
      },
      weekly: {
        sessions: allSessions
          .filter((s) => new Date(s.createdAt) >= now7)
          .reduce((sum, s) => sum + (s.totalPrice || 0), 0),
        wifi: allWifiSessions
          .filter((w) => new Date(w.startedAt) >= now7)
          .reduce((sum, w) => sum + (w.priceUsd || 0), 0),
      },
      monthly: {
        sessions: allSessions
          .filter((s) => new Date(s.createdAt) >= now30)
          .reduce((sum, s) => sum + (s.totalPrice || 0), 0),
        wifi: allWifiSessions
          .filter((w) => new Date(w.startedAt) >= now30)
          .reduce((sum, w) => sum + (w.priceUsd || 0), 0),
      },
    };

    const totalPlayers = players.length;
    const newPlayersThisMonth = players.filter(
      (p) => new Date(p.joinedAt) >= now30
    ).length;

    // Notifications: active sessions with <= 10 remaining minutes
    const notifications = activeSessions
      .filter((s) => s.remainingMinutes <= 10)
      .map((s) => ({
        id: s.id,
        message: `Session for ${s.playerName} on ${s.deviceName} expires in ${s.remainingMinutes} minute(s).`,
        severity: "warning",
        sessionId: s.id,
        remainingMinutes: s.remainingMinutes,
      }));

    // Serialize all announcement dates
    const serializedAnnouncements = announcements.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt).toISOString(),
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString() : null,
    }));

    const payload = {
      period,
      totalRevenueUsd,
      sessionRevenue,
      wifiRevenue,
      membershipRevenue,
      revenueByCategory: {
        sessions: sessionRevenue,
        memberships: membershipRevenue,
        wifi: wifiRevenue,
      },
      activeSessions: activeSessions.length,
      activeWifiUsers: activeWifiUsers.length,
      totalMembers,
      completedSessions,
      totalGamingHours,
      averageSessionRevenue,
      busiestGame,
      busiestDevice,
      mostPlayedGames,
      mostUsedStations,
      activeSessionsList,
      activeWifiList,
      revenueByPeriod,
      totalPlayers,
      newPlayersThisMonth,
      notifications,
      announcements: serializedAnnouncements,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[analytics/GET]", error);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
