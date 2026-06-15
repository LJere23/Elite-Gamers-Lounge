import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) {
    return NextResponse.json({ error: "Membership plan not found" }, { status: 404 });
  }

  return NextResponse.json({ ...plan, perks: JSON.parse(plan.perks || "[]") });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json() as {
    name?: string;
    priceUsd?: number;
    period?: string;
    description?: string;
    perks?: string[];
  };

  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.perks)) {
    data.perks = JSON.stringify(body.perks);
  }

  const plan = await prisma.membershipPlan.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ...plan, perks: JSON.parse(plan.perks || "[]") });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.membershipPlan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
