import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const plans = await prisma.membershipPlan.findMany();
  const parsed = plans.map((plan) => ({
    ...plan,
    perks: JSON.parse(plan.perks || "[]"),
  }));
  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    name: string;
    priceUsd: number;
    period: string;
    description: string;
    perks?: string[];
  };

  const { name, priceUsd, period, description, perks } = body;

  const plan = await prisma.membershipPlan.create({
    data: {
      name,
      priceUsd,
      period,
      description,
      perks: JSON.stringify(perks ?? []),
    },
  });

  return NextResponse.json(
    { ...plan, perks: JSON.parse(plan.perks || "[]") },
    { status: 201 }
  );
}
