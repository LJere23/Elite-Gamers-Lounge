import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tryAwardJob } from "@/lib/jobs";
import { trackChallenge } from "@/lib/challengeTracker";
import { requireAdmin } from "@/lib/adminAuth";
import { calculateTournamentPricing, classifyTournament, nextMonthEnd } from "@/lib/membershipTiers";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

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
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id: tournamentId } = await context.params;
  const body = await request.json();

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // ── Member registration ──────────────────────────────────────────────────
  if (body.playerId) {
    const player = await prisma.player.findUnique({ where: { id: body.playerId } });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const existing = await prisma.tournamentEntry.findFirst({
      where: { tournamentId, playerId: body.playerId },
    });
    if (existing) return NextResponse.json({ error: "Already registered" }, { status: 409 });

    const now = new Date();
    const membershipActive = !player.membershipExpiresAt || player.membershipExpiresAt > now;
    const perksMonthExpired = !player.perksMonthEnd || player.perksMonthEnd < now;
    const tourCategory = classifyTournament(tournament.category);

    const pricing = calculateTournamentPricing({
      category: tournament.category,
      walkInFee: tournament.entryFee,
      tier: player.membershipTier,
      fridayEntriesUsed: player.fridayEntriesUsed,
      racingLeagueUsed: player.racingLeagueUsed,
      perksMonthExpired,
      membershipActive,
    });

    // Update monthly perks counters for consumed free entries
    const perksUpdate: Record<string, unknown> = {};
    if (membershipActive) {
      if (tourCategory === "friday_mini") {
        const used = perksMonthExpired ? 0 : player.fridayEntriesUsed;
        perksUpdate.fridayEntriesUsed = used + 1;
      } else if (tourCategory === "racing_sim_league") {
        const used = perksMonthExpired ? 0 : player.racingLeagueUsed;
        perksUpdate.racingLeagueUsed = used + 1;
      }
      if (Object.keys(perksUpdate).length > 0 && perksMonthExpired) {
        perksUpdate.perksMonthStart = now;
        perksUpdate.perksMonthEnd = nextMonthEnd(now);
      }
      if (Object.keys(perksUpdate).length > 0) {
        await prisma.player.update({ where: { id: player.id }, data: perksUpdate });
      }
    }

    const entry = await prisma.tournamentEntry.create({
      data: {
        tournamentId,
        playerId: player.id,
        playerName: player.name,
        status: "registered",
        points: 0, wins: 0, losses: 0,
      },
    });

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { entries: { increment: 1 } },
    });

    await tryAwardJob({
      jobType: "tournament_entry",
      playerId: player.id,
      contextId: tournamentId,
      xpOverride: tournament.xpReward > 0 ? tournament.xpReward : undefined,
    });
    await trackChallenge(player.id, "tournament_entry", 1);

    return NextResponse.json(
      {
        ...entry,
        playerAvatarUrl: null,
        registeredAt: entry.registeredAt.toISOString(),
        entryFeeCharged: pricing.finalFee,
        entryFeeLabel: pricing.label,
        entryFeeWarning: pricing.warning,
        discountSaved: pricing.membershipDiscount,
      },
      { status: 201 }
    );
  }

  // ── Guest registration ───────────────────────────────────────────────────
  if (body.guestName && typeof body.guestName === "string" && body.guestName.trim()) {
    const name = body.guestName.trim();

    const entry = await prisma.tournamentEntry.create({
      data: {
        tournamentId,
        playerId: null,
        playerName: name,
        guestName: name,
        status: "registered",
        points: 0, wins: 0, losses: 0,
      },
    });

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { entries: { increment: 1 } },
    });

    return NextResponse.json(
      {
        ...entry,
        playerAvatarUrl: null,
        registeredAt: entry.registeredAt.toISOString(),
        entryFeeCharged: tournament.entryFee,
        entryFeeLabel: `$${tournament.entryFee.toFixed(2)}`,
        entryFeeWarning: null,
        discountSaved: 0,
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { error: "Provide either playerId (member) or guestName (non-member)" },
    { status: 400 }
  );
}
