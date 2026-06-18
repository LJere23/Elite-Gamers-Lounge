import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id } = await params;
  const body   = await request.json();

  const challenge = await prisma.challenge.update({
    where: { id },
    data:  {
      ...(body.name        !== undefined && { name:        body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.icon        !== undefined && { icon:        body.icon }),
      ...(body.type        !== undefined && { type:        body.type }),
      ...(body.target      !== undefined && { target:      Number(body.target) }),
      ...(body.xpReward    !== undefined && { xpReward:    Number(body.xpReward) }),
      ...(body.weeklyReset !== undefined && { weeklyReset: body.weeklyReset }),
      ...(body.active      !== undefined && { active:      body.active }),
      ...(body.sortOrder   !== undefined && { sortOrder:   Number(body.sortOrder) }),
    },
  });

  return NextResponse.json(challenge);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id } = await params;
  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
