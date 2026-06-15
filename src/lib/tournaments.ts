import { prisma } from "@/lib/db";

export function computeRank(xp: number, visitCount: number): string {
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

export function getXpMultiplier(tier: string): number {
  if (tier === "Legend") return 1.35;
  if (tier === "Hero") return 1.2;
  if (tier === "Warrior") return 1.1;
  return 1.0;
}

function getScoreThreshold(scoringSystem: string): number {
  if (scoringSystem === "best_of_3") return 2;
  if (scoringSystem === "best_of_5") return 3;
  return 1;
}

function getStageByMatchCount(matchCount: number, round: number): string {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Final";
  if (matchCount === 4) return "Quarter Final";
  return round === 1 ? "Round 1" : `Round ${round}`;
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value));
}

export function createBracketMatches(
  tournamentId: string,
  players: Array<{ id: string; name: string }>,
  round: number,
  bracket: "winner" | "loser" | "grand_final",
  scoringSystem: string
): Array<{
  id: string;
  tournamentId: string;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  scheduledAt: Date;
  status: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  winnerName: string | null;
  isBye: boolean;
  round: number;
  stage: string;
  bracket: string;
  seriesWinsA: number;
  seriesWinsB: number;
}> {
  const bracketSize = nextPowerOfTwo(players.length);
  const threshold = getScoreThreshold(scoringSystem);
  const paddedPlayers = [...players, ...Array(bracketSize - players.length).fill(null)];
  const matches = [];
  const nextMatchCount = bracketSize / 2;
  const stage = getStageByMatchCount(nextMatchCount, round);

  for (let i = 0; i < paddedPlayers.length; i += 2) {
    const playerA = paddedPlayers[i] as { id: string; name: string } | null;
    const playerB = paddedPlayers[i + 1] as { id: string; name: string } | null;
    const isBye = !playerA || !playerB;
    const winnerId = isBye ? (playerA?.id ?? playerB?.id ?? null) : null;
    const scoreA = isBye ? (playerA ? threshold : 0) : null;
    const scoreB = isBye ? (playerB ? threshold : 0) : null;

    matches.push({
      id: crypto.randomUUID(),
      tournamentId,
      playerAId: playerA?.id ?? "",
      playerAName: playerA?.name ?? "BYE",
      playerBId: playerB?.id ?? "",
      playerBName: playerB?.name ?? "BYE",
      scheduledAt: new Date(Date.now() + (i / 2) * 15 * 60 * 1000),
      status: isBye ? "completed" : "scheduled",
      scoreA,
      scoreB,
      winnerId,
      winnerName: isBye ? (playerA ? playerA.name : playerB?.name ?? null) : null,
      isBye,
      round,
      stage,
      bracket,
      seriesWinsA: 0,
      seriesWinsB: 0,
    });
  }

  return matches;
}

export async function declareTournamentChampion(tournamentId: string, finalMatch: any) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");

  const winnerId = finalMatch.winnerId as string | null;
  const winnerName: string =
    finalMatch.winnerName ??
    (winnerId === finalMatch.playerAId ? finalMatch.playerAName : finalMatch.playerBName);
  const loserId: string =
    finalMatch.playerAId === winnerId ? finalMatch.playerBId : finalMatch.playerAId;
  const loserName: string =
    finalMatch.playerAId === winnerId ? finalMatch.playerBName : finalMatch.playerAName;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "completed",
      winnerId: winnerId ?? undefined,
      winnerName,
      runnerUpId: loserId || undefined,
      runnerUpName: loserName || undefined,
      completedAt: new Date(),
    },
  });

  const announcementText = `${tournament.name} Champion: ${winnerName}`;

  await prisma.announcement.create({
    data: {
      message: announcementText,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      winnerName,
      prizeAmount: String(tournament.prizeUsd),
      type: "champion",
      createdAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      message: announcementText,
      severity: "info",
      createdAt: new Date(),
    },
  });

  // Award XP to winner if they exist as a player
  const winnerPlayer = await prisma.player.findFirst({ where: { name: winnerName } });
  if (winnerPlayer) {
    const multiplier = getXpMultiplier(winnerPlayer.membershipTier);
    const amount = Math.round(3 * multiplier);

    await prisma.xpLedger.create({
      data: {
        playerId: winnerPlayer.id,
        amount,
        source: "job",
        note: "Competition Winner",
        createdAt: new Date(),
      },
    });

    const newXp = (winnerPlayer.xp ?? 0) + amount;
    const newRank = computeRank(newXp, winnerPlayer.visitCount ?? 0);

    await prisma.player.update({
      where: { id: winnerPlayer.id },
      data: {
        xp: { increment: amount },
        rank: newRank,
      },
    });
  }

  return await prisma.tournament.findUnique({ where: { id: tournamentId } });
}

export async function advanceKnockoutRound(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");

  const winnerMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, bracket: "winner" },
  });

  const highestRound = winnerMatches.reduce((max, m) => Math.max(max, m.round ?? 1), 1);
  const currentRound = highestRound;

  const currentRoundMatches = winnerMatches.filter((m) => m.round === currentRound);
  const nonByeMatches = currentRoundMatches.filter((m) => !m.isBye);
  const allCompleted = nonByeMatches.every((m) => m.status === "completed");

  if (!allCompleted) {
    return { tournament, newMatches: [] };
  }

  const completedMatches = currentRoundMatches.filter(
    (m) => m.status === "completed" && m.winnerId
  );
  const winners = completedMatches.map((m) => ({
    id: m.winnerId as string,
    name: m.winnerName ?? (m.winnerId === m.playerAId ? m.playerAName : m.playerBName),
  }));

  // If only one winner remains, declare champion
  if (winners.length === 1) {
    const finalMatch = completedMatches.find(
      (m) => m.stage === "Final" || m.stage === "Grand Final"
    );
    if (finalMatch && finalMatch.winnerId) {
      const updatedTournament = await declareTournamentChampion(tournamentId, finalMatch);
      return { tournament: updatedTournament, newMatches: [] };
    }
  }

  // Generate next round
  const nextRound = currentRound + 1;
  const nextMatches = createBracketMatches(
    tournamentId,
    winners,
    nextRound,
    "winner",
    tournament.scoringSystem ?? "best_of_1"
  );

  await prisma.tournamentMatch.createMany({ data: nextMatches });

  const updatedTournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { currentRound: nextRound },
  });

  return { tournament: updatedTournament, newMatches: nextMatches };
}
