import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

function nextPowerOfTwo(n: number) {
  return 2 ** Math.ceil(Math.log2(n));
}

function getStage(matchCount: number, round: number): string {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Final";
  if (matchCount === 4) return "Quarter Final";
  return round === 1 ? "Round 1" : "Round " + round;
}

function getScoreThreshold(scoringSystem: string) {
  if (scoringSystem === "best_of_3") return 2;
  if (scoringSystem === "best_of_5") return 3;
  return 1;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: [{ round: "asc" }, { createdAt: "asc" }],
  });

  const serialized = matches.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const entries = await prisma.tournamentEntry.findMany({ where: { tournamentId: id } });

  if (entries.length < 2) {
    return NextResponse.json({ error: "Need at least 2 entries to generate matches" }, { status: 400 });
  }

  const existingCount = await prisma.tournamentMatch.count({ where: { tournamentId: id } });
  if (existingCount > 0) {
    return NextResponse.json({ error: "Matches already generated" }, { status: 409 });
  }

  const format = tournament.format;

  if (format === "fastest_lap") {
    return NextResponse.json([], { status: 201 });
  }

  const players = entries.map((e) => ({ id: e.playerId ?? e.id, name: e.playerName }));
  const threshold = getScoreThreshold(tournament.scoringSystem);
  const matches: {
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
  }[] = [];

  if (format === "points_league") {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: crypto.randomUUID(),
          tournamentId: id,
          playerAId: players[i].id,
          playerAName: players[i].name,
          playerBId: players[j].id,
          playerBName: players[j].name,
          scheduledAt: new Date(),
          status: "scheduled",
          scoreA: null,
          scoreB: null,
          winnerId: null,
          winnerName: null,
          isBye: false,
          round: 1,
          stage: "Round 1",
          bracket: "winner",
          seriesWinsA: 0,
          seriesWinsB: 0,
        });
      }
    }
  } else {
    // knockout / double_elimination
    const bracketSize = nextPowerOfTwo(players.length);
    const paddedPlayers = [...players, ...Array(bracketSize - players.length).fill(null)];

    for (let i = 0; i < paddedPlayers.length; i += 2) {
      const playerA = paddedPlayers[i] as { id: string; name: string } | null;
      const playerB = paddedPlayers[i + 1] as { id: string; name: string } | null;
      const isBye = !playerA || !playerB;
      const winnerId = isBye ? (playerA?.id ?? playerB?.id ?? null) : null;
      const stage = getStage(bracketSize / 2, 1);

      matches.push({
        id: crypto.randomUUID(),
        tournamentId: id,
        playerAId: playerA?.id ?? "",
        playerAName: playerA?.name ?? "BYE",
        playerBId: playerB?.id ?? "",
        playerBName: playerB?.name ?? "BYE",
        scheduledAt: new Date(Date.now() + (i / 2) * 15 * 60 * 1000),
        status: isBye ? "completed" : "scheduled",
        scoreA: isBye ? (playerA ? threshold : 0) : null,
        scoreB: isBye ? (playerB ? threshold : 0) : null,
        winnerId,
        winnerName: isBye ? (playerA ? playerA.name : (playerB?.name ?? null)) : null,
        isBye,
        round: 1,
        stage,
        bracket: "winner",
        seriesWinsA: 0,
        seriesWinsB: 0,
      });
    }
  }

  await prisma.tournamentMatch.createMany({ data: matches });
  await prisma.tournament.update({
    where: { id },
    data: { status: "ongoing", currentRound: 1 },
  });

  const serialized = matches.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
  }));

  return NextResponse.json(serialized, { status: 201 });
}
