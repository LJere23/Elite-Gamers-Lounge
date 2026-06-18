import { prisma } from "./db";
import { getDoubleXpMultiplier } from "./doubleXp";

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30)  return "Adventurer";
  if (xp < 80)  return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

function getXpMultiplier(tier: string): number {
  if (tier === "Legend")  return 1.35;
  if (tier === "Hero")    return 1.2;
  if (tier === "Warrior") return 1.1;
  return 1.0;
}

/**
 * Award a job to a player if they're eligible.
 *
 * jobType  — matches Job.jobType in the DB (e.g. "milestone_first_session")
 * playerId — the player receiving the XP
 * contextId — optional scoping key:
 *   • tournament_entry: the tournament ID   (awards once per tournament)
 *   • referral:         the new player's ID  (awards once per referred player)
 *   • milestone_*:      omit               (awards once globally)
 *
 * Returns { awarded: true, xpAwarded } on success, { awarded: false } otherwise.
 * Never throws — errors are caught and logged so callers keep running.
 */
export async function tryAwardJob({
  jobType,
  playerId,
  contextId,
  xpOverride,
}: {
  jobType: string;
  playerId: string;
  contextId?: string;
  xpOverride?: number; // overrides the job's fixed XP (e.g. per-tournament reward)
}): Promise<{ awarded: boolean; xpAwarded?: number }> {
  try {
    const job = await prisma.job.findFirst({ where: { jobType, active: true } });
    if (!job) return { awarded: false };

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return { awarded: false };

    // Eligibility check — scope to contextId when provided
    const existing = await prisma.jobCompletion.findFirst({
      where: contextId
        ? { playerId, jobId: job.id, contextId }
        : { playerId, jobId: job.id },
    });
    if (existing) return { awarded: false };

    const multiplier  = getXpMultiplier(player.membershipTier);
    const baseXp      = xpOverride !== undefined ? xpOverride : job.xpReward;
    const { multiplier: dxpMult } = await getDoubleXpMultiplier();
    const finalAmount = Math.round(baseXp * multiplier * dxpMult);

    const { rankChanged, newRank } = await prisma.$transaction(async (tx) => {
      await tx.jobCompletion.create({
        data: { playerId, jobId: job.id, contextId: contextId ?? null },
      });
      await tx.xpLedger.create({
        data: {
          playerId,
          amount: finalAmount,
          source: "job",
          jobId:  job.id,
          note:   contextId
            ? `Completed: ${job.name} (ctx:${contextId})`
            : `Completed: ${job.name}`,
        },
      });

      const fresh    = await tx.player.update({ where: { id: playerId }, data: { xp: { increment: finalAmount } } });
      const newRank  = computeRank(fresh.xp, fresh.visitCount);
      let rankChanged = false;

      if (newRank !== fresh.rank) {
        await tx.player.update({ where: { id: playerId }, data: { rank: newRank } });
        await tx.announcement.create({
          data: {
            message: `⬆ @${player.gamerTag} has ranked up to ${newRank}!`,
            type: "rank_up",
          },
        });
        rankChanged = true;
      }

      return { rankChanged, newRank };
    });

    // Post-transaction notifications (fire-and-forget — don't roll back XP if these fail)
    await prisma.notification.create({
      data: {
        playerId,
        type:    "quest",
        heading: "Quest Complete",
        message: `You completed "${job.name}" and earned ${finalAmount} XP. Well done, adventurer.`,
        severity: "success",
      },
    }).catch(() => {});

    if (rankChanged) {
      await prisma.notification.create({
        data: {
          playerId,
          type:    "rank_up",
          heading: "Rank Up!",
          message: `You have ascended to ${newRank}. The lounge recognises your dedication.`,
          severity: "success",
        },
      }).catch(() => {});
    }

    return { awarded: true, xpAwarded: finalAmount };
  } catch (err) {
    console.error("[tryAwardJob]", { jobType, playerId, contextId }, err);
    return { awarded: false };
  }
}
