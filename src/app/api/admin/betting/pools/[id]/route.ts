import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { getCurrentOdds } from "@/lib/betting";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  const pool = await prisma.bettingPool.findUnique({
    where: { id },
    include: {
      tournament: { select: { name: true, format: true } },
      outcomes:   true,
      access: {
        include: { player: { select: { id: true, gamerTag: true, name: true, cxpBalance: true } } },
      },
      stakes: {
        include: { player: { select: { gamerTag: true } }, outcome: { select: { label: true } } },
        orderBy: { placedAt: "desc" },
      },
    },
  });

  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const odds = await getCurrentOdds(id);
  const totalActual = pool.stakes.reduce((s, x) => s + x.amountCxp, 0);

  return NextResponse.json({
    ...pool,
    closesAt:  pool.closesAt.toISOString(),
    settledAt: pool.settledAt?.toISOString() ?? null,
    createdAt: pool.createdAt.toISOString(),
    odds,
    totalActualCxp: totalActual,
    allowDraw: pool.scopeType === "single_match",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title           !== undefined) data.title           = body.title;
  if (body.status          !== undefined) data.status          = body.status;
  if (body.enabled         !== undefined) data.enabled         = body.enabled;
  if (body.houseCutPercent !== undefined) data.houseCutPercent = Number(body.houseCutPercent);
  if (body.closesAt        !== undefined) data.closesAt        = new Date(body.closesAt);

  const updated = await prisma.bettingPool.update({ where: { id }, data });
  return NextResponse.json({ ...updated, closesAt: updated.closesAt.toISOString() });
}
