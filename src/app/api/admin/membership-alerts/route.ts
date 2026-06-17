import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// Returns players with expired or expiring memberships for admin dashboard banner
export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const PAID_TIERS = ["Warrior", "Hero", "Legend", "FoundingHero"];

  const [expired, expiringSoon] = await Promise.all([
    prisma.player.findMany({
      where: {
        membershipTier: { in: PAID_TIERS },
        membershipExpiresAt: { lt: now },
      },
      select: { id: true, name: true, gamerTag: true, membershipTier: true, membershipExpiresAt: true, isFounder: true, founderNumber: true },
      orderBy: { membershipExpiresAt: "asc" },
    }),
    prisma.player.findMany({
      where: {
        membershipTier: { in: PAID_TIERS },
        membershipExpiresAt: { gte: now, lte: in7Days },
      },
      select: { id: true, name: true, gamerTag: true, membershipTier: true, membershipExpiresAt: true, isFounder: true, founderNumber: true },
      orderBy: { membershipExpiresAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    expired: expired.map((p) => ({
      ...p,
      membershipExpiresAt: p.membershipExpiresAt?.toISOString() ?? null,
    })),
    expiringSoon: expiringSoon.map((p) => ({
      ...p,
      membershipExpiresAt: p.membershipExpiresAt?.toISOString() ?? null,
    })),
  });
}
