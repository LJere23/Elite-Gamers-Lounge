import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function serializeTournament(t: {
  id: string;
  name: string;
  game: string;
  category: string;
  format: string;
  status: string;
  startAt: Date;
  endAt: Date;
  entries: number;
  prizeUsd: number;
  prizeDescription: string;
  scoringSystem: string;
  currentRound: number | null;
  winnerId: string | null;
  winnerName: string | null;
  runnerUpId: string | null;
  runnerUpName: string | null;
  completedAt: Date | null;
  createdAt: Date;
}) {
  return {
    ...t,
    startAt: t.startAt.toISOString(),
    endAt: t.endAt.toISOString(),
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTournament(tournament));
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const updates = await request.json();

  // Strip fields that are only set by the complete/match routes
  const { winnerId, winnerName, runnerUpId, runnerUpName, entries, completedAt: _c, ...safeUpdates } = updates;
  void winnerId; void winnerName; void runnerUpId; void runnerUpName; void entries;

  const data: Record<string, unknown> = { ...safeUpdates };

  if (updates.startAt) data.startAt = new Date(updates.startAt);
  if (updates.endAt) data.endAt = new Date(updates.endAt);
  if (updates.completedAt) data.completedAt = new Date(updates.completedAt);

  const tournament = await prisma.tournament.update({
    where: { id },
    data,
  });

  return NextResponse.json(serializeTournament(tournament));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  if (tournament.status === "ongoing") {
    return NextResponse.json(
      { error: "Cannot delete an ongoing tournament" },
      { status: 400 }
    );
  }

  await prisma.tournament.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
