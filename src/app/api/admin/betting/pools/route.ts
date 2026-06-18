import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { getCurrentOdds } from "@/lib/betting";

export async function GET(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;

  const pools = await prisma.bettingPool.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tournament: { select: { name: true } },
      outcomes:   true,
      access:     { select: { playerId: true } },
      stakes:     { select: { playerId: true, amountCxp: true, settled: true } },
    },
  });

  // Attach live odds to each pool
  const withOdds = await Promise.all(
    pools.map(async (p) => {
      const odds = await getCurrentOdds(p.id);
      const distinctStakers = new Set(p.stakes.map((s) => s.playerId)).size;
      return {
        ...p,
        closesAt:  p.closesAt.toISOString(),
        settledAt: p.settledAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        odds,
        distinctStakers,
        allowDraw: p.scopeType === "single_match",
      };
    })
  );

  return NextResponse.json(withOdds);
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;

  const body = await request.json();
  const { tournamentId, scopeType, matchId, title, closesAt, houseCutPercent } = body;

  if (!tournamentId || !scopeType || !title || !closesAt) {
    return NextResponse.json({ error: "tournamentId, scopeType, title, closesAt are required" }, { status: 400 });
  }
  if (!["full_tournament", "single_match"].includes(scopeType)) {
    return NextResponse.json({ error: "scopeType must be full_tournament or single_match" }, { status: 400 });
  }
  if (scopeType === "single_match" && !matchId) {
    return NextResponse.json({ error: "matchId is required for single_match scope" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Build outcomes
  const outcomes: { label: string; outcomeType: "player" | "draw"; linkedEntryId?: string; linkedPlayerSlot?: string }[] = [];

  if (scopeType === "full_tournament") {
    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      orderBy: { registeredAt: "asc" },
    });
    if (entries.length < 2) {
      return NextResponse.json({ error: "Tournament needs at least 2 entries to create a betting pool" }, { status: 400 });
    }
    for (const entry of entries) {
      outcomes.push({ label: entry.playerName, outcomeType: "player", linkedEntryId: entry.id });
    }
  } else {
    const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    outcomes.push({ label: match.playerAName, outcomeType: "player", linkedPlayerSlot: "playerA" });
    outcomes.push({ label: match.playerBName, outcomeType: "player", linkedPlayerSlot: "playerB" });
    outcomes.push({ label: "Draw", outcomeType: "draw" });
  }

  const pool = await prisma.bettingPool.create({
    data: {
      tournamentId,
      scopeType,
      matchId:        matchId ?? null,
      title,
      closesAt:       new Date(closesAt),
      houseCutPercent: houseCutPercent ?? 20,
      status:         "draft",
      enabled:        false,
      outcomes: { create: outcomes },
    },
    include: { outcomes: true },
  });

  return NextResponse.json({ ...pool, closesAt: pool.closesAt.toISOString(), createdAt: pool.createdAt.toISOString() }, { status: 201 });
}
