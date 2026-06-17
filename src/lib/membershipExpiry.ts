import { prisma } from "@/lib/db";

const PAID_TIERS = ["Warrior", "Hero", "Legend", "FoundingHero"];

export interface ExpiryCheckResult {
  expired: number;
  warningSent: number;
  founderLocksRevoked: number;
}

/**
 * Runs the membership expiry check:
 * 1. Downgrades players whose membership has expired, notifies them
 * 2. Sends 7-day renewal warnings to upcoming expirations
 * 3. Sends admin notifications for both
 */
export async function runMembershipExpiryCheck(): Promise<ExpiryCheckResult> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notifyCooldown = new Date(now.getTime() - 24 * 60 * 60 * 1000); // don't re-notify within 24h

  // ── 1. Expire overdue memberships ─────────────────────────────────────────
  const expired = await prisma.player.findMany({
    where: {
      membershipTier: { in: PAID_TIERS },
      membershipExpiresAt: { lt: now },
    },
    select: { id: true, name: true, gamerTag: true, membershipTier: true, isFounder: true, founderNumber: true },
  });

  let expiredCount = 0;
  for (const player of expired) {
    const downgradeTo = "Adventurer";

    await prisma.player.update({
      where: { id: player.id },
      data: {
        membershipTier: downgradeTo,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        hoursUsedThisPeriod: 0,
      },
    });

    await prisma.notification.create({
      data: {
        playerId: player.id,
        type: "membership",
        heading: "Membership Expired",
        message: player.isFounder
          ? `Your Founding Hero membership has expired. You retain your Founder #${player.founderNumber} title. Renew within 14 days to keep your $15/month price lock.`
          : `Your ${player.membershipTier} membership has expired. You've been moved to Adventurer status. Visit the lounge to renew!`,
        severity: "warning",
      },
    });

    // Admin notification (no playerId = admin-visible)
    await prisma.notification.create({
      data: {
        playerId: null,
        type: "admin_membership_expired",
        heading: "Membership Expired",
        message: `${player.name} (@${player.gamerTag}) — ${player.membershipTier} membership has expired and they've been downgraded to Adventurer.`,
        severity: "warning",
      },
    });

    expiredCount++;
  }

  // ── 2. Send 7-day renewal warnings ────────────────────────────────────────
  const expiringSoon = await prisma.player.findMany({
    where: {
      membershipTier: { in: PAID_TIERS },
      membershipExpiresAt: { gte: now, lte: in7Days },
      OR: [
        { membershipRenewalNotifiedAt: null },
        { membershipRenewalNotifiedAt: { lt: notifyCooldown } },
      ],
    },
    select: { id: true, name: true, gamerTag: true, membershipTier: true, membershipExpiresAt: true, isFounder: true, founderNumber: true },
  });

  let warningSentCount = 0;
  for (const player of expiringSoon) {
    if (!player.membershipExpiresAt) continue;
    const daysLeft = Math.ceil((player.membershipExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    await prisma.notification.create({
      data: {
        playerId: player.id,
        type: "membership",
        heading: "Membership Renewal Reminder",
        message: player.isFounder
          ? `Your Founding Hero membership expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Renew now to keep your $15/month founder price lock!`
          : `Your ${player.membershipTier} membership expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Visit the lounge to renew and keep your benefits!`,
        severity: "info",
      },
    });

    // Admin notification
    await prisma.notification.create({
      data: {
        playerId: null,
        type: "admin_membership_expiring",
        heading: "Membership Expiring Soon",
        message: `${player.name} (@${player.gamerTag}) — ${player.membershipTier} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} (${player.membershipExpiresAt.toLocaleDateString()}).`,
        severity: "info",
      },
    });

    await prisma.player.update({
      where: { id: player.id },
      data: { membershipRenewalNotifiedAt: now },
    });

    warningSentCount++;
  }

  return { expired: expiredCount, warningSent: warningSentCount, founderLocksRevoked: 0 };
}
