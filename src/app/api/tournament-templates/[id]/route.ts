import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.templateName   !== undefined) data.templateName              = String(body.templateName).trim();
  if (body.defaultGame    !== undefined) data.defaultGame               = String(body.defaultGame).trim();
  if (body.category       !== undefined) data.category                  = String(body.category);
  if (body.format         !== undefined) data.format                    = String(body.format);
  if (body.scoringSystem  !== undefined) data.scoringSystem             = String(body.scoringSystem);
  if (body.maxPlayers     !== undefined) data.maxPlayers                = Number(body.maxPlayers);
  if (body.walkInFee      !== undefined) data.walkInFee                 = Number(body.walkInFee);
  if (body.warriorFreeEntriesPerMonth !== undefined) data.warriorFreeEntriesPerMonth = Number(body.warriorFreeEntriesPerMonth);
  if (body.warriorDiscountPercent     !== undefined) data.warriorDiscountPercent     = Number(body.warriorDiscountPercent);
  if (body.heroFreeEntriesPerMonth    !== undefined) data.heroFreeEntriesPerMonth    = Number(body.heroFreeEntriesPerMonth);
  if (body.heroDiscountPercent        !== undefined) data.heroDiscountPercent        = Number(body.heroDiscountPercent);
  if (body.legendFreeEntriesPerMonth  !== undefined) data.legendFreeEntriesPerMonth  = Number(body.legendFreeEntriesPerMonth);
  if (body.legendDiscountPercent      !== undefined) data.legendDiscountPercent      = Number(body.legendDiscountPercent);
  if (body.xpReward        !== undefined) data.xpReward        = Number(body.xpReward);
  if (body.prizeDescription !== undefined) data.prizeDescription = String(body.prizeDescription).trim();
  if (body.circuit         !== undefined) data.circuit          = body.circuit ? String(body.circuit).trim() : null;
  if (body.isEnabled        !== undefined) data.isEnabled        = Boolean(body.isEnabled);

  const updated = await prisma.tournamentTemplate.update({ where: { id }, data });
  return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  await prisma.tournamentTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
