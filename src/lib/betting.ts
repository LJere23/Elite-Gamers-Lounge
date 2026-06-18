import { prisma } from "./db";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OddsResult {
  outcomeId: string;
  label: string;
  outcomeType: string;
  totalStakedCxp: number;
  payoutMultiplier: number | null; // null = no bets yet on this outcome
  impliedProbabilityPct: number | null;
}

export interface BetResult {
  success: true;
  newBalance: number;
  amountCxp: number;
}

// ── Competitor check ───────────────────────────────────────────────────────────

export async function isPlayerCompetitor(
  playerId: string,
  bettingPoolId: string
): Promise<boolean> {
  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
    select: { tournamentId: true, scopeType: true, matchId: true },
  });
  if (!pool) return false;

  if (pool.scopeType === "full_tournament") {
    const entry = await prisma.tournamentEntry.findFirst({
      where: { tournamentId: pool.tournamentId, playerId },
    });
    return !!entry;
  }

  if (pool.scopeType === "single_match" && pool.matchId) {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: pool.matchId },
      select: { playerAId: true, playerBId: true },
    });
    if (!match) return false;
    return match.playerAId === playerId || match.playerBId === playerId;
  }

  return false;
}

// ── Odds calculation ───────────────────────────────────────────────────────────

export async function getCurrentOdds(bettingPoolId: string): Promise<OddsResult[]> {
  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
    include: { outcomes: true },
  });
  if (!pool) return [];

  // Always compute from live data, not the denormalized counter
  const totalCxp = await prisma.bettingStake.aggregate({
    where: { bettingPoolId },
    _sum: { amountCxp: true },
  });
  const poolTotal = totalCxp._sum.amountCxp ?? 0;
  const distributable = poolTotal * (1 - pool.houseCutPercent / 100);

  return pool.outcomes.map((o) => {
    if (o.totalStakedCxp === 0) {
      return {
        outcomeId:            o.id,
        label:                o.label,
        outcomeType:          o.outcomeType,
        totalStakedCxp:       0,
        payoutMultiplier:     null,
        impliedProbabilityPct: null,
      };
    }
    const multiplier = distributable / o.totalStakedCxp;
    const impliedPct = poolTotal > 0
      ? Math.round((o.totalStakedCxp / poolTotal) * 100)
      : null;
    return {
      outcomeId:            o.id,
      label:                o.label,
      outcomeType:          o.outcomeType,
      totalStakedCxp:       o.totalStakedCxp,
      payoutMultiplier:     Math.round(multiplier * 100) / 100,
      impliedProbabilityPct: impliedPct,
    };
  });
}

// ── Place bet ──────────────────────────────────────────────────────────────────

export async function placeBet(
  playerId: string,
  bettingPoolId: string,
  outcomeId: string,
  amountCxp: number
): Promise<BetResult | { error: string }> {
  if (amountCxp < 1) return { error: "Minimum stake is 1 C-XP." };

  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
    select: {
      status: true, closesAt: true, enabled: true,
      tournamentId: true, scopeType: true, matchId: true,
    },
  });
  if (!pool)          return { error: "Pool not found." };
  if (!pool.enabled)  return { error: "This pool is not available." };
  if (pool.status !== "open") return { error: "Pool is not open for betting." };
  if (new Date() >= pool.closesAt) return { error: "Betting for this pool has closed." };

  // Competitor exclusion (second safeguard — UI hiding is the first)
  const competitor = await isPlayerCompetitor(playerId, bettingPoolId);
  if (competitor) return { error: "Competitors may not place bets." };

  // Access check
  const access = await prisma.bettingPoolAccess.findUnique({
    where: { bettingPoolId_playerId: { bettingPoolId, playerId } },
  });
  if (!access) return { error: "You have not been invited to this pool." };

  // Outcome exists in this pool
  const outcome = await prisma.bettingPoolOutcome.findFirst({
    where: { id: outcomeId, bettingPoolId },
  });
  if (!outcome) return { error: "Invalid outcome." };

  // Check for existing stake (one per player per pool)
  const existingStake = await prisma.bettingStake.findUnique({
    where: { bettingPoolId_playerId: { bettingPoolId, playerId } },
  });
  if (existingStake) return { error: "You have already placed a bet in this pool. Bets are final and cannot be changed." };

  // Balance check
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { cxpBalance: true },
  });
  if (!player) return { error: "Player not found." };
  if (player.cxpBalance < amountCxp) return { error: `Insufficient C-XP balance. You have ${player.cxpBalance} C-XP.` };

  // Atomic transaction: deduct balance, record ledger, create stake, update totals
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.player.update({
      where: { id: playerId },
      data: { cxpBalance: { decrement: amountCxp } },
      select: { cxpBalance: true },
    });

    await tx.cxpLedger.create({
      data: {
        playerId,
        amount:      -amountCxp,
        sourceType:  "bet_stake",
        sourceLabel: `Stake on "${outcome.label}"`,
        contextId:   bettingPoolId,
      },
    });

    await tx.bettingStake.create({
      data: { bettingPoolId, outcomeId, playerId, amountCxp },
    });

    await tx.bettingPoolOutcome.update({
      where: { id: outcomeId },
      data: { totalStakedCxp: { increment: amountCxp } },
    });

    await tx.bettingPool.update({
      where: { id: bettingPoolId },
      data: { totalPoolCxp: { increment: amountCxp } },
    });

    return updated.cxpBalance;
  });

  return { success: true, newBalance: result, amountCxp };
}

// ── Settle pool ────────────────────────────────────────────────────────────────

export async function settleBettingPool(
  bettingPoolId: string,
  winningOutcomeId: string
): Promise<void> {
  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
    include: { outcomes: true, stakes: true },
  });
  if (!pool || pool.status === "settled" || pool.status === "cancelled") return;

  // Re-compute from live data
  const allStakes = await prisma.bettingStake.findMany({
    where: { bettingPoolId },
  });

  // Guard: refund instead of settling a pool with fewer than 2 distinct stakers
  const uniqueStakers = new Set(allStakes.map((s) => s.playerId)).size;
  if (uniqueStakers < 2) {
    await refundBettingPool(bettingPoolId, "Pool did not attract enough participants to settle fairly.");
    return;
  }
  const poolTotal       = allStakes.reduce((s, x) => s + x.amountCxp, 0);
  const houseCutAmount  = Math.floor(poolTotal * (pool.houseCutPercent / 100));
  const distributable   = poolTotal - houseCutAmount;

  const winningStakes = allStakes.filter((s) => s.outcomeId === winningOutcomeId);
  const winningTotal  = winningStakes.reduce((s, x) => s + x.amountCxp, 0);

  const winningOutcome = pool.outcomes.find((o) => o.id === winningOutcomeId);

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Pay winners
    for (const stake of allStakes) {
      if (stake.outcomeId === winningOutcomeId && winningTotal > 0) {
        const payoutCxp = Math.floor(distributable * (stake.amountCxp / winningTotal));
        await tx.player.update({
          where: { id: stake.playerId },
          data: { cxpBalance: { increment: payoutCxp } },
        });
        await tx.cxpLedger.create({
          data: {
            playerId:    stake.playerId,
            amount:      payoutCxp,
            sourceType:  "bet_payout",
            sourceLabel: `Won: ${pool.title}`,
            contextId:   bettingPoolId,
          },
        });
        await tx.bettingStake.update({
          where: { id: stake.id },
          data: { settled: true, payoutCxp },
        });
      } else {
        // Loser
        await tx.bettingStake.update({
          where: { id: stake.id },
          data: { settled: true, payoutCxp: 0 },
        });
      }
    }

    // Log house cut
    if (houseCutAmount > 0) {
      await tx.cxpLedger.create({
        data: {
          playerId:    allStakes[0]?.playerId ?? "",
          amount:      -houseCutAmount,
          sourceType:  "house_cut",
          sourceLabel: `House cut: ${pool.title}`,
          contextId:   bettingPoolId,
        },
      }).catch(() => {});
    }

    await tx.bettingPool.update({
      where: { id: bettingPoolId },
      data: {
        status:                "settled",
        settledAt:             now,
        totalHouseCutCollected: { increment: houseCutAmount },
      },
    });
  });

  // Notify all participants (fire-and-forget per participant)
  await notifySettlement(bettingPoolId, winningOutcomeId, winningOutcome?.label ?? "Unknown", distributable, winningTotal);
}

// ── Refund pool ────────────────────────────────────────────────────────────────

export async function refundBettingPool(
  bettingPoolId: string,
  reason: string
): Promise<void> {
  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
  });
  if (!pool || pool.status === "settled" || pool.status === "cancelled") return;

  const allStakes = await prisma.bettingStake.findMany({
    where: { bettingPoolId },
  });

  await prisma.$transaction(async (tx) => {
    for (const stake of allStakes) {
      await tx.player.update({
        where: { id: stake.playerId },
        data: { cxpBalance: { increment: stake.amountCxp } },
      });
      await tx.cxpLedger.create({
        data: {
          playerId:    stake.playerId,
          amount:      stake.amountCxp,
          sourceType:  "bet_refund",
          sourceLabel: `Refund: ${pool.title} — ${reason}`,
          contextId:   bettingPoolId,
        },
      });
      await tx.bettingStake.update({
        where: { id: stake.id },
        data: { settled: true, payoutCxp: stake.amountCxp },
      });
    }

    await tx.bettingPool.update({
      where: { id: bettingPoolId },
      data: { status: "cancelled", settledAt: new Date() },
    });
  });

  // Notify participants
  for (const stake of allStakes) {
    await prisma.notification.create({
      data: {
        playerId: stake.playerId,
        type:     "info",
        heading:  "Bet Refunded",
        message:  `${pool.title} was refunded — ${reason}. Your ${stake.amountCxp} C-XP has been returned.`,
        severity: "info",
      },
    }).catch(() => {});
  }
}

// ── Auto-settlement triggers ───────────────────────────────────────────────────

export async function triggerMatchSettlement(matchId: string): Promise<void> {
  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, winnerId: true, playerAId: true, playerBId: true, tournamentId: true },
    });
    if (!match) return;

    const pools = await prisma.bettingPool.findMany({
      where: { matchId, status: { in: ["open", "closed"] }, scopeType: "single_match" },
      include: { outcomes: true },
    });

    for (const pool of pools) {
      if (match.winnerId) {
        // Find the outcome matching the winner
        const winningOutcome = pool.outcomes.find(
          (o) => o.outcomeType === "player" &&
            (o.linkedPlayerSlot === "playerA"
              ? match.playerAId === match.winnerId
              : match.playerBId === match.winnerId) &&
            o.linkedPlayerSlot !== null
        ) ?? pool.outcomes.find((o) =>
          o.outcomeType === "player" && (
            (o.linkedPlayerSlot === "playerA" && match.winnerId === match.playerAId) ||
            (o.linkedPlayerSlot === "playerB" && match.winnerId === match.playerBId)
          )
        );

        if (winningOutcome) {
          await settleBettingPool(pool.id, winningOutcome.id);
        } else {
          // Can't determine winner outcome — refund
          await refundBettingPool(pool.id, "Match result could not be mapped to an outcome.");
        }
      } else {
        // Draw on a pool that allows draw
        const drawOutcome = pool.outcomes.find((o) => o.outcomeType === "draw");
        if (drawOutcome) {
          await settleBettingPool(pool.id, drawOutcome.id);
        } else {
          // Draw on a pool without draw outcome — refund
          await refundBettingPool(pool.id, "Match ended in a draw with no draw option offered.");
        }
      }
    }
  } catch (err) {
    console.error("[triggerMatchSettlement]", matchId, err);
  }
}

export async function triggerTournamentSettlement(tournamentId: string): Promise<void> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, winnerId: true, winnerName: true },
    });
    if (!tournament?.winnerId) return;

    const pools = await prisma.bettingPool.findMany({
      where: { tournamentId, status: { in: ["open", "closed"] }, scopeType: "full_tournament" },
      include: { outcomes: true },
    });

    for (const pool of pools) {
      // Find outcome linked to the winning entry
      const winningOutcome = pool.outcomes.find((o) =>
        o.outcomeType === "player" && o.linkedEntryId !== null
      );

      // Find via linkedEntryId — the TournamentEntry for the winner
      const winnerEntry = await prisma.tournamentEntry.findFirst({
        where: { tournamentId, playerId: tournament.winnerId },
      });

      const matchedOutcome = pool.outcomes.find(
        (o) => o.linkedEntryId === winnerEntry?.id
      ) ?? pool.outcomes.find(
        (o) => o.label.toLowerCase() === tournament.winnerName?.toLowerCase()
      );

      if (matchedOutcome) {
        await settleBettingPool(pool.id, matchedOutcome.id);
      } else {
        await refundBettingPool(pool.id, "Tournament winner could not be mapped to a betting outcome.");
      }
    }
  } catch (err) {
    console.error("[triggerTournamentSettlement]", tournamentId, err);
  }
}

export async function autoRefundExpiredPools(): Promise<void> {
  try {
    const now = new Date();
    const expiredPools = await prisma.bettingPool.findMany({
      where: { status: "open", closesAt: { lt: now } },
    });

    for (const pool of expiredPools) {
      // Check distinct staker count
      const distinctStakers = await prisma.bettingStake.findMany({
        where: { bettingPoolId: pool.id },
        select: { playerId: true },
        distinct: ["playerId"],
      });

      if (distinctStakers.length < 2) {
        await refundBettingPool(
          pool.id,
          "Pool closed with fewer than 2 participants."
        );
      } else {
        // Close the pool (no longer open for bets, awaiting manual settlement)
        await prisma.bettingPool.update({
          where: { id: pool.id },
          data: { status: "closed" },
        });
      }
    }
  } catch (err) {
    console.error("[autoRefundExpiredPools]", err);
  }
}

// ── Notification helper ────────────────────────────────────────────────────────

async function notifySettlement(
  bettingPoolId: string,
  winningOutcomeId: string,
  winningLabel: string,
  distributable: number,
  winningTotal: number
): Promise<void> {
  const stakes = await prisma.bettingStake.findMany({
    where: { bettingPoolId },
    select: { playerId: true, outcomeId: true, amountCxp: true, payoutCxp: true },
  });

  const pool = await prisma.bettingPool.findUnique({
    where: { id: bettingPoolId },
    select: { title: true },
  });

  for (const stake of stakes) {
    const player = await prisma.player.findUnique({
      where: { id: stake.playerId },
      select: { cxpBalance: true },
    });
    const won = stake.outcomeId === winningOutcomeId;
    const payout = stake.payoutCxp ?? 0;

    await prisma.notification.create({
      data: {
        playerId: stake.playerId,
        type:     won ? "xp" : "info",
        heading:  won ? "Oracle Pool — You Won!" : "Oracle Pool — Better luck next time",
        message:  won
          ? `Your bet on "${winningLabel}" in "${pool?.title}" paid out ${payout} C-XP! New balance: ${player?.cxpBalance ?? 0} C-XP.`
          : `Your bet in "${pool?.title}" lost. Balance: ${player?.cxpBalance ?? 0} C-XP.`,
        severity: won ? "success" : "info",
      },
    }).catch(() => {});
  }
}
