import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isPlayerCompetitor, getCurrentOdds } from "@/lib/betting";

export async function GET(request: NextRequest) {
  const playerId = request.cookies.get("portal_player_id")?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, cxpBalance: true, gamerTag: true },
  });
  if (!player) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check global oracle toggle
  const settings = await prisma.loungeSettings.findUnique({
    where: { id: "singleton" },
    select: { oraclePoolEnabled: true },
  });
  if (!settings?.oraclePoolEnabled) {
    return NextResponse.json({ pools: [], oracleEnabled: false });
  }

  // Find all open, enabled pools the player has access to
  const accessRecords = await prisma.bettingPoolAccess.findMany({
    where: { playerId: player.id },
    select: { bettingPoolId: true },
  });
  const poolIds = accessRecords.map((a) => a.bettingPoolId);
  if (poolIds.length === 0) return NextResponse.json({ pools: [], oracleEnabled: true });

  const pools = await prisma.bettingPool.findMany({
    where: {
      id:      { in: poolIds },
      status:  "open",
      enabled: true,
    },
    include: {
      tournament: { select: { name: true } },
      outcomes:   true,
    },
  });

  // Filter out pools where player is a competitor (re-check at render time)
  const eligible = [];
  for (const pool of pools) {
    const competitor = await isPlayerCompetitor(player.id, pool.id);
    if (competitor) continue;

    // Check not past closesAt
    if (new Date() >= pool.closesAt) continue;

    const odds = await getCurrentOdds(pool.id);

    // Get player's existing stake in this pool
    const myStake = await prisma.bettingStake.findUnique({
      where: { bettingPoolId_playerId: { bettingPoolId: pool.id, playerId: player.id } },
      include: { outcome: { select: { label: true } } },
    });

    // For single_match: fetch last 5 results per player for context
    let matchContext: { playerA: { name: string; recentResults: string[] }; playerB: { name: string; recentResults: string[] } } | null = null;
    if (pool.scopeType === "single_match" && pool.matchId) {
      const match = await prisma.tournamentMatch.findUnique({
        where: { id: pool.matchId },
        select: { playerAId: true, playerAName: true, playerBId: true, playerBName: true },
      });
      if (match) {
        const getRecent = async (pId: string, pName: string) => {
          const recent = await prisma.tournamentMatch.findMany({
            where: {
              status: "completed",
              OR: [{ playerAId: pId }, { playerBId: pId }],
            },
            orderBy: { scheduledAt: "desc" },
            take: 5,
            select: { winnerId: true, playerAId: true, playerBId: true },
          });
          return recent.map((m) =>
            m.winnerId === pId ? "W" : m.winnerId === null ? "D" : "L"
          );
        };
        matchContext = {
          playerA: { name: match.playerAName, recentResults: await getRecent(match.playerAId, match.playerAName) },
          playerB: { name: match.playerBName, recentResults: await getRecent(match.playerBId, match.playerBName) },
        };
      }
    }

    eligible.push({
      id:              pool.id,
      title:           pool.title,
      tournamentName:  pool.tournament.name,
      scopeType:       pool.scopeType,
      closesAt:        pool.closesAt.toISOString(),
      allowDraw:       pool.scopeType === "single_match",
      odds,
      myStake:         myStake ? { outcomeId: myStake.outcomeId, label: myStake.outcome.label, amountCxp: myStake.amountCxp } : null,
      matchContext,
    });
  }

  return NextResponse.json({
    oracleEnabled: true,
    cxpBalance:    player.cxpBalance,
    pools:         eligible,
  });
}
