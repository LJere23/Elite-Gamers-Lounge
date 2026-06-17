import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30) return "Adventurer";
  if (xp < 80) return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

function getXpMultiplier(tier: string): number {
  if (tier === "Legend") return 1.35;
  if (tier === "Hero") return 1.2;
  if (tier === "Warrior") return 1.1;
  return 1.0;
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 1. Get tournament
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // 2. Only fastest_lap tournaments can be completed via this endpoint
  if (tournament.format !== "fastest_lap") {
    return NextResponse.json(
      { error: "Only fastest_lap tournaments can be completed via this endpoint" },
      { status: 400 }
    );
  }

  // 3. Get entries
  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId: id },
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries found" }, { status: 400 });
  }

  // 4. Find entry with lowest bestLapTime (not null)
  const withTime = entries.filter((e) => e.bestLapTime !== null);
  if (withTime.length === 0) {
    return NextResponse.json(
      { error: "No entries with a recorded lap time" },
      { status: 400 }
    );
  }

  const sorted = [...withTime].sort((a, b) => a.bestLapTime! - b.bestLapTime!);
  const winner = sorted[0];

  const now = new Date();

  // 5. Update tournament
  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      winnerId: winner.playerId,
      winnerName: winner.playerName,
      status: "completed",
      completedAt: now,
    },
  });

  // 6. Create announcement
  const announcementMessage = `${tournament.name} Champion — ${winner.playerName} — Prize: $${tournament.prizeUsd}`;

  await prisma.announcement.create({
    data: {
      message: announcementMessage,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      winnerName: winner.playerName,
      prizeAmount: String(tournament.prizeUsd),
      type: "champion",
      createdAt: now,
    },
  });

  // 7. Create notification
  await prisma.notification.create({
    data: {
      message: announcementMessage,
      severity: "info",
      createdAt: now,
    },
  });

  // 8. Try to award XP (Competition Winner: +3 XP) to winning player (skip guests)
  try {
    if (!winner.playerId) throw new Error("Guest winner — no XP to award");
    const player = await prisma.player.findUnique({
      where: { id: winner.playerId },
    });

    if (player) {
      const multiplier = getXpMultiplier(player.membershipTier);
      const baseXp = 3;
      const xpAwarded = Math.floor(baseXp * multiplier);
      const newXp = player.xp + xpAwarded;
      const oldRank = player.rank;
      const newRank = computeRank(newXp, player.visitCount);

      await prisma.player.update({
        where: { id: player.id },
        data: { xp: newXp, rank: newRank },
      });

      await prisma.xpLedger.create({
        data: {
          playerId: player.id,
          amount: xpAwarded,
          source: "Competition Winner",
          note: `Won ${tournament.name}`,
          createdAt: now,
        },
      });

      // Announce rank-up if rank improved
      if (newRank !== oldRank) {
        const rankOrder = [
          "Villager",
          "Adventurer",
          "F Rank",
          "E Rank",
          "D Rank",
          "C Rank",
          "B Rank",
          "A Rank",
          "S Rank",
        ];
        const oldIndex = rankOrder.indexOf(oldRank);
        const newIndex = rankOrder.indexOf(newRank);
        if (newIndex > oldIndex) {
          await prisma.announcement.create({
            data: {
              message: `${player.name} (${player.gamerTag}) has ranked up to ${newRank}!`,
              type: "rank_up",
              createdAt: now,
            },
          });
        }
      }
    }
  } catch {
    // XP award is best-effort; do not fail the request
  }

  // 9. Return updated tournament
  return NextResponse.json({
    ...updated,
    startAt: updated.startAt.toISOString(),
    endAt: updated.endAt.toISOString(),
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  });
}
