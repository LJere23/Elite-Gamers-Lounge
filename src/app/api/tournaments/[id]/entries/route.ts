import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId: id },
    orderBy: { registeredAt: "asc" },
    include: { player: { select: { avatarUrl: true } } },
  });

  const serialized = entries.map(({ player, ...entry }) => ({
    ...entry,
    playerAvatarUrl: player?.avatarUrl ?? null,
    registeredAt: entry.registeredAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const player = await prisma.player.findUnique({ where: { id: body.playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const existing = await prisma.tournamentEntry.findFirst({
    where: { tournamentId: id, playerId: body.playerId },
  });
  if (existing) {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  const entry = await prisma.tournamentEntry.create({
    data: {
      tournamentId: id,
      playerId: body.playerId,
      playerName: player.name,
      status: "registered",
      points: 0,
      wins: 0,
      losses: 0,
    },
  });

  await prisma.tournament.update({
    where: { id },
    data: { entries: { increment: 1 } },
  });

  return NextResponse.json(
    { ...entry, registeredAt: entry.registeredAt.toISOString() },
    { status: 201 }
  );
}
