import { prisma } from "@/lib/db";

export interface FounderAssignResult {
  success: boolean;
  founderNumber?: number;
  error?: string;
}

/**
 * Attempts to assign Founding Hero status to a player.
 * Checks slot availability, assigns sequentially, decrements counter,
 * creates the permanent locked Founder title, and sends a portal notification.
 * All done in a transaction — either everything succeeds or nothing changes.
 */
export async function assignFounderStatus(playerId: string): Promise<FounderAssignResult> {
  return await prisma.$transaction(async (tx) => {
    const settings = await tx.loungeSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) return { success: false, error: "Settings not found" };
    if (settings.foundingSlotsRemaining <= 0) {
      return { success: false, error: "No founding slots remaining" };
    }

    const topFounder = await tx.player.findFirst({
      where: { isFounder: true, founderNumber: { not: null } },
      orderBy: { founderNumber: "desc" },
    });
    const nextNumber = (topFounder?.founderNumber ?? 0) + 1;

    const now = new Date();
    const renewalDue = new Date(now);
    renewalDue.setMonth(renewalDue.getMonth() + 1);

    await tx.player.update({
      where: { id: playerId },
      data: {
        membershipTier: "FoundingHero",
        isFounder: true,
        founderNumber: nextNumber,
        founderPriceLocked: true,
        founderRenewalDue: renewalDue,
      },
    });

    // Create permanent Founder title only if not already present
    const existing = await tx.playerTitle.findFirst({
      where: { playerId, title: "Founder" },
    });
    if (!existing) {
      await tx.playerTitle.create({
        data: { playerId, title: "Founder", awardedAt: now },
      });
    }

    await tx.loungeSettings.update({
      where: { id: "singleton" },
      data: { foundingSlotsRemaining: { decrement: 1 } },
    });

    await tx.notification.create({
      data: {
        playerId,
        type: "founder",
        heading: "Founding Hero Status Granted",
        message: `You are Founder #${nextNumber} of Gweru's Gamers Lounge! Your membership price is locked at $15/month for life. Welcome to the inner circle.`,
        severity: "success",
      },
    });

    return { success: true, founderNumber: nextNumber };
  });
}

/**
 * Revokes price lock for Founders who haven't renewed within the 14-day grace period.
 * Title and founderNumber remain permanently — only the price lock is lifted.
 * Returns the number of players whose price lock was revoked.
 */
export async function revokeExpiredFounderPriceLocks(): Promise<number> {
  const graceDeadline = new Date();
  graceDeadline.setDate(graceDeadline.getDate() - 14);

  const overdue = await prisma.player.findMany({
    where: {
      isFounder: true,
      founderPriceLocked: true,
      founderRenewalDue: { lt: graceDeadline },
    },
    select: { id: true, name: true, founderNumber: true },
  });

  if (overdue.length === 0) return 0;

  await prisma.player.updateMany({
    where: { id: { in: overdue.map((p) => p.id) } },
    data: {
      founderPriceLocked: false,
      membershipTier: "Hero",
    },
  });

  for (const player of overdue) {
    await prisma.notification.create({
      data: {
        playerId: player.id,
        type: "membership",
        heading: "Founder Price Lock Expired",
        message: `Your Founding Hero price lock ($15/month) has expired because your membership was not renewed within the 14-day grace period. You retain your Founder #${player.founderNumber} status and title permanently. Future renewals will be at the standard Hero rate ($25/month).`,
        severity: "warning",
      },
    });
  }

  return overdue.length;
}
