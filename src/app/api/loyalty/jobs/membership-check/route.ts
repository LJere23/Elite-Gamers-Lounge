import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { runMembershipExpiryCheck } from "@/lib/membershipExpiry";
import { revokeExpiredFounderPriceLocks } from "@/lib/founderService";
import { runBirthdayCheck } from "@/lib/birthdayCheck";
import { runTournamentLifecycle } from "@/lib/tournamentScheduler";
import { autoRefundExpiredPools } from "@/lib/betting";
import { prisma } from "@/lib/db";

async function runInactivityCheck(): Promise<{ notified: number }> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const cutoff          = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000); // don't re-notify within 13 days

  const inactivePlayers = await prisma.player.findMany({
    where: {
      status:        "active",
      membershipTier: { in: ["Warrior", "Hero", "Legend", "FoundingHero"] },
      OR: [
        { lastVisitAt: null },
        { lastVisitAt: { lt: fourteenDaysAgo } },
      ],
    },
    select: { id: true, name: true, gamerTag: true, membershipTier: true },
  });

  let notified = 0;
  for (const p of inactivePlayers) {
    // Only send once per 14-day window
    const recent = await prisma.notification.findFirst({
      where: { playerId: p.id, type: "we_miss_you", createdAt: { gte: cutoff } },
    });
    if (recent) continue;

    await prisma.notification.create({
      data: {
        playerId: p.id,
        type:     "we_miss_you",
        heading:  "We miss you at the lounge!",
        message:  `Hey ${p.name}, it has been a while! Your Guild spot is waiting. Your XP and rank are safe — come back and pick up where you left off. See you soon, adventurer. 🎮`,
        severity: "info",
      },
    }).catch(() => {});

    notified++;
  }
  return { notified };
}

async function runAllDailyChecks() {
  const [expiry, inactivity, birthdays, tournaments] = await Promise.allSettled([
    runMembershipExpiryCheck(),
    runInactivityCheck(),
    runBirthdayCheck(),
    runTournamentLifecycle(),
  ]);

  const founderLocksRevoked = await revokeExpiredFounderPriceLocks();
  await autoRefundExpiredPools().catch((e) => console.error("[daily/oracle-refund]", e));

  return {
    ok:                  true,
    expired:             expiry.status === "fulfilled" ? expiry.value.expired : 0,
    warningSent:         expiry.status === "fulfilled" ? expiry.value.warningSent : 0,
    founderLocksRevoked,
    inactivityNotified:  inactivity.status === "fulfilled" ? inactivity.value.notified : 0,
    birthdaysFound:      birthdays.status === "fulfilled" ? birthdays.value.found : 0,
    tournamentsStarted:  tournaments.status === "fulfilled" ? tournaments.value.started : 0,
    tournamentsCompleted: tournaments.status === "fulfilled" ? tournaments.value.completed : 0,
  };
}

function isValidCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

// GET — called by Vercel Cron daily at 06:00 UTC
export async function GET(request: NextRequest) {
  if (!isValidCron(request)) {
    const adminErr = await requireAdmin(request);
    if (adminErr) return adminErr;
  }
  return NextResponse.json(await runAllDailyChecks());
}

// POST — manual trigger from admin dashboard
export async function POST(request: NextRequest) {
  const adminErr = await requireAdmin(request);
  if (adminErr) return adminErr;
  return NextResponse.json(await runAllDailyChecks());
}
