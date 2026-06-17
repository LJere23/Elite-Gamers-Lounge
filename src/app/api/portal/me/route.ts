import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildPerkStatus } from "@/lib/membershipTiers";

const rankThresholds = [
  { rank: "F Rank", minXp: 30 },
  { rank: "E Rank", minXp: 80 },
  { rank: "D Rank", minXp: 150 },
  { rank: "C Rank", minXp: 250 },
  { rank: "B Rank", minXp: 400 },
  { rank: "A Rank", minXp: 600 },
  { rank: "S Rank", minXp: 850 },
];

async function fetchPlayerById(id: string) {
  return prisma.player.findFirst({
    where: { id },
    include: {
      titles: true,
      xpLedger: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

async function buildPlayerResponse(player: Awaited<ReturnType<typeof fetchPlayerById>>) {
  if (!player) return null;

  const nextRank = rankThresholds.find((r) => r.minXp > player.xp);
  const xpToNext = nextRank ? nextRank.minXp - player.xp : 0;

  const allEntries = await prisma.tournamentEntry.findMany({
    where: { playerId: player.id },
    include: { tournament: true },
  });

  const activeTournaments = allEntries
    .filter(
      (entry) =>
        entry.tournament.status !== "completed" &&
        entry.tournament.status !== "cancelled"
    )
    .map((entry) => ({
      ...entry,
      registeredAt: entry.registeredAt.toISOString(),
      tournament: {
        ...entry.tournament,
        startAt: entry.tournament.startAt.toISOString(),
        endAt: entry.tournament.endAt.toISOString(),
        completedAt: entry.tournament.completedAt
          ? entry.tournament.completedAt.toISOString()
          : null,
        createdAt: entry.tournament.createdAt.toISOString(),
      },
    }));

  const perkStatus = buildPerkStatus({
    membershipTier: player.membershipTier,
    membershipExpiresAt: player.membershipExpiresAt,
    currentPeriodEnd: player.currentPeriodEnd,
    hoursUsedThisPeriod: player.hoursUsedThisPeriod,
    hoursUsedToday: player.hoursUsedToday,
    lastSessionDate: player.lastSessionDate,
    perksMonthEnd: player.perksMonthEnd,
    racingRacesUsed: player.racingRacesUsed,
    fridayEntriesUsed: player.fridayEntriesUsed,
    racingLeagueUsed: player.racingLeagueUsed,
    wifiMinutesUsed: player.wifiMinutesUsed,
    showOnLeaderboardWall: player.showOnLeaderboardWall,
  });

  return {
    player: {
      id: player.id,
      name: player.name,
      gamerTag: player.gamerTag,
      email: player.email,
      phone: player.phone ?? null,
      dateOfBirth: player.dateOfBirth ? player.dateOfBirth.toISOString() : null,
      city: player.city,
      age: player.age ?? null,
      membershipTier: player.membershipTier,
      membershipExpiresAt: player.membershipExpiresAt
        ? player.membershipExpiresAt.toISOString()
        : null,
      status: player.status,
      xp: player.xp,
      rank: player.rank,
      visitCount: player.visitCount,
      favoriteGame: player.favoriteGame ?? null,
      joinedAt: player.joinedAt.toISOString(),
      lastVisitAt: player.lastVisitAt ? player.lastVisitAt.toISOString() : null,
      avatarUrl: player.avatarUrl ?? null,
      isFounder: player.isFounder,
      founderNumber: player.founderNumber ?? null,
      titles: player.titles.map((t) => ({
        ...t,
        awardedAt: t.awardedAt.toISOString(),
      })),
      xpLedger: player.xpLedger.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
    },
    xpToNextRank: xpToNext,
    nextRank: nextRank?.rank || "Max Rank",
    activeTournaments,
    perkStatus,
  };
}

export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("portal_player_id")?.value;

    if (!playerId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const player = await fetchPlayerById(playerId);

    if (!player) {
      return NextResponse.json(
        { error: "Player not found. Check your email or gamerTag." },
        { status: 404 }
      );
    }

    const data = await buildPlayerResponse(player);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Portal me GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set("portal_player_id", "", { maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Portal logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
