import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { assignFounderStatus } from "@/lib/founderService";

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30) return "Adventurer";
  if (xp < 80) return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

function getXpMultiplier(tier: string): number {
  if (tier === "Legend") return 1.35;
  if (tier === "Hero" || tier === "FoundingHero") return 1.2;
  if (tier === "Warrior") return 1.1;
  return 1.0;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      titles: true,
      xpLedger: { orderBy: { createdAt: "desc" }, take: 20 },
      jobCompletions: { include: { job: true } },
    },
  });

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  return NextResponse.json(player);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  const body = await request.json();

  // Strip fields that must only be modified through their own dedicated routes
  const { xp, rank, visitCount, isFounder, founderNumber, founderPriceLocked, ...safeBody } = body;
  void xp; void rank; void visitCount; void isFounder; void founderNumber; void founderPriceLocked;

  // Convert date string fields to Date objects
  const data: Record<string, unknown> = { ...safeBody };
  if (typeof data.dateOfBirth === "string") data.dateOfBirth = new Date(data.dateOfBirth);
  if (typeof data.membershipExpiresAt === "string") data.membershipExpiresAt = new Date(data.membershipExpiresAt);
  if (typeof data.joinedAt === "string") data.joinedAt = new Date(data.joinedAt);
  if (typeof data.lastVisitAt === "string") data.lastVisitAt = new Date(data.lastVisitAt);

  // Fetch current player to have current xp, visitCount, membershipTier, city
  const existing = await prisma.player.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  // Handle FoundingHero tier assignment via founder service
  if (data.membershipTier === "FoundingHero" && existing.membershipTier !== "FoundingHero") {
    const result = await assignFounderStatus(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Cannot assign Founding Hero" }, { status: 400 });
    }
    // founder service already set membershipTier + founderNumber; drop from data to avoid overwrite
    delete data.membershipTier;
  }

  // When renewing a founder membership, update founderRenewalDue
  if (
    existing.isFounder &&
    existing.founderPriceLocked &&
    data.membershipExpiresAt instanceof Date
  ) {
    const renewalDue = new Date(data.membershipExpiresAt as Date);
    data.founderRenewalDue = renewalDue;
  }

  // Apply update
  let updated = await prisma.player.update({
    where: { id },
    data,
  });

  // Recompute rank
  const newRank = computeRank(updated.xp, updated.visitCount);
  const oldRank = existing.rank;

  if (newRank !== updated.rank) {
    updated = await prisma.player.update({
      where: { id },
      data: { rank: newRank },
    });

    // Create announcement on rank-up (only when rank improves)
    const rankOrder = ["Villager", "Adventurer", "F Rank", "E Rank", "D Rank", "C Rank", "B Rank", "A Rank", "S Rank"];
    const oldIndex = rankOrder.indexOf(oldRank);
    const newIndex = rankOrder.indexOf(newRank);
    if (newIndex > oldIndex) {
      await prisma.announcement.create({
        data: {
          message: `${updated.name} (${updated.gamerTag}) has ranked up to ${newRank}!`,
          type: "rank_up",
          createdAt: new Date(),
        },
      });
    }
  }

  // Handle Otherworlder title based on city
  const cityUpdated = "city" in body;
  if (cityUpdated) {
    const isGweru = updated.city === "Gweru";
    const existingTitle = await prisma.playerTitle.findFirst({
      where: { playerId: id, title: "Otherworlder" },
    });

    if (!isGweru && !existingTitle) {
      await prisma.playerTitle.create({
        data: { playerId: id, title: "Otherworlder", awardedAt: new Date() },
      });
      await prisma.notification.create({
        data: {
          playerId: id,
          type: "title",
          heading: "Title Bestowed",
          message: `You have been granted the title "Otherworlder". A traveller from beyond Gweru — your presence is noted.`,
          severity: "success",
        },
      });
    } else if (isGweru && existingTitle) {
      await prisma.playerTitle.delete({ where: { id: existingTitle.id } });
    }
  }

  // Return updated player with relations
  const result = await prisma.player.findUnique({
    where: { id },
    include: {
      titles: true,
      xpLedger: { orderBy: { createdAt: "desc" }, take: 20 },
      jobCompletions: { include: { job: true } },
    },
  });

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const existing = await prisma.player.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  await prisma.player.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
