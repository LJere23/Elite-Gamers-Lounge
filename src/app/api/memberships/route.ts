import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET is public — membership tiers shown on public /memberships page
export async function GET() {
  const plans = await prisma.membershipPlan.findMany();
  const parsed = plans.map((plan) => ({
    ...plan,
    perks: JSON.parse(plan.perks || "[]"),
  }));
  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json() as {
    name: string;
    priceUsd: number;
    period: string;
    description: string;
    perks?: string[];
  };

  const { name, priceUsd, period, description, perks } = body;

  const plan = await prisma.membershipPlan.create({
    data: { name, priceUsd, period, description, perks: JSON.stringify(perks ?? []) },
  });

  return NextResponse.json(
    { ...plan, perks: JSON.parse(plan.perks || "[]") },
    { status: 201 }
  );
}
