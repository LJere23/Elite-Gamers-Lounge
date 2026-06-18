import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { progress: true } } },
  });
  return NextResponse.json(challenges);
}

export async function POST(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const body = await request.json();
  const { name, description, icon, type, target, xpReward, weeklyReset, active, sortOrder } = body;

  if (!name || !type || !target) {
    return NextResponse.json({ error: "name, type, and target are required" }, { status: 400 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      name,
      description: description ?? "",
      icon:        icon ?? "⚔",
      type,
      target:      Number(target),
      xpReward:    xpReward !== undefined ? Number(xpReward) : 10,
      weeklyReset: weeklyReset !== false,
      active:      active !== false,
      sortOrder:   sortOrder ?? 0,
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}
