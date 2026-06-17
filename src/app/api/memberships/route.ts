import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET is public — membership tiers shown on public /memberships page
// Founding Hero plan is hidden automatically when slots reach 0
export async function GET() {
  const [plans, settings] = await Promise.all([
    prisma.membershipPlan.findMany(),
    prisma.loungeSettings.findUnique({ where: { id: "singleton" }, select: { foundingSlotsRemaining: true } }),
  ]);

  const slotsRemaining = settings?.foundingSlotsRemaining ?? 0;

  const parsed = plans
    .filter((plan) => {
      const isFoundingPlan = plan.name.toLowerCase().includes("founding");
      return !isFoundingPlan || slotsRemaining > 0;
    })
    .map((plan) => ({
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
