import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

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
  entryFee: number;
  prizeUsd: number;
  prizeDescription: string;
  scoringSystem: string;
  circuit: string | null;
  xpReward: number;
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

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tournaments.map(serializeTournament));
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json();

  const tournament = await prisma.tournament.create({
    data: {
      name:            body.name,
      game:            body.game,
      category:        body.category,
      format:          body.format,
      status:          body.status || "scheduled",
      startAt:         new Date(body.startAt),
      endAt:           new Date(body.endAt),
      entryFee:        body.entryFee  ?? 0,
      prizeUsd:        body.prizeUsd  ?? 0,
      prizeDescription: body.prizeDescription || "",
      scoringSystem:   body.scoringSystem || "best_of_1",
      entries:         body.entries   ?? 0,
      circuit:         body.circuit   ?? null,
      xpReward:        body.xpReward  ?? 3,
    },
  });

  // Auto-announce the new tournament
  const startFormatted = new Date(body.startAt).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const endFormatted = new Date(body.endAt).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const circuitPart = tournament.circuit ? ` — Circuit: ${tournament.circuit}` : "";
  const prizePart   = tournament.prizeDescription
    ? `Prize: ${tournament.prizeDescription}`
    : tournament.prizeUsd > 0 ? `Prize pool: $${tournament.prizeUsd}` : "";
  const xpPart = tournament.xpReward > 0 ? `+${tournament.xpReward} XP on entry` : "";

  const parts = [prizePart, xpPart].filter(Boolean).join(" · ");

  await prisma.announcement.create({
    data: {
      tournamentId:   tournament.id,
      tournamentName: tournament.name,
      type:           "tournament_scheduled",
      message: [
        `🏆 New tournament: ${tournament.name}`,
        `Game: ${tournament.game}${circuitPart}`,
        `Starts: ${startFormatted}`,
        `Ends: ${endFormatted}`,
        parts,
      ].filter(Boolean).join(" | "),
      expiresAt: tournament.endAt,
    },
  });

  return NextResponse.json(serializeTournament(tournament), { status: 201 });
}
