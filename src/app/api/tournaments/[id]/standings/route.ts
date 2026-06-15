import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId: id },
    orderBy: { points: "desc" },
  });

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
  });

  const serializeEntry = (e: typeof entries[number]) => ({
    ...e,
    registeredAt: e.registeredAt.toISOString(),
  });

  const { format } = tournament;

  // --- Fastest Lap ---
  if (format === "fastest_lap") {
    const sorted = [...entries].sort((a, b) => {
      if (a.bestLapTime === null && b.bestLapTime === null) return 0;
      if (a.bestLapTime === null) return 1;
      if (b.bestLapTime === null) return -1;
      return a.bestLapTime - b.bestLapTime;
    });

    const result = sorted.map((e, i) => ({
      ...serializeEntry(e),
      position: i + 1,
    }));

    return NextResponse.json(result);
  }

  // --- Points League ---
  if (format === "points_league") {
    const sorted = [...entries].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

    const result = sorted.map((e, i) => ({
      ...serializeEntry(e),
      position: i + 1,
    }));

    return NextResponse.json(result);
  }

  // --- Knockout / Double Elimination ---
  // Compute wins from completed matches
  const winCounts: Record<string, number> = {};
  matches
    .filter((m) => m.status === "completed" && m.winnerId)
    .forEach((m) => {
      winCounts[m.winnerId!] = (winCounts[m.winnerId!] || 0) + 1;
    });

  const withWins = entries.map((e) => ({
    ...serializeEntry(e),
    wins: winCounts[e.playerId] || 0,
  }));

  const sorted = [...withWins].sort((a, b) => b.wins - a.wins);

  const result = sorted.map((e, i) => ({
    ...e,
    position: i + 1,
  }));

  return NextResponse.json(result);
}
