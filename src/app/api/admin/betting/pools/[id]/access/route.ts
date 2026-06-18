import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { isPlayerCompetitor } from "@/lib/betting";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  const access = await prisma.bettingPoolAccess.findMany({
    where: { bettingPoolId: id },
    include: { player: { select: { id: true, gamerTag: true, name: true, cxpBalance: true } } },
    orderBy: { invitedAt: "asc" },
  });

  return NextResponse.json(access);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id: bettingPoolId } = await params;
  const { playerId } = await request.json();

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const pool = await prisma.bettingPool.findUnique({ where: { id: bettingPoolId } });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  // Block competitors from being added to the access list entirely
  const competitor = await isPlayerCompetitor(playerId, bettingPoolId);
  if (competitor) {
    return NextResponse.json(
      { error: "This player is a competitor in the linked tournament or match. Competitors cannot be added to the betting access list." },
      { status: 422 }
    );
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, gamerTag: true, name: true },
  });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  try {
    const access = await prisma.bettingPoolAccess.create({
      data: { bettingPoolId, playerId },
      include: { player: { select: { id: true, gamerTag: true, name: true, cxpBalance: true } } },
    });
    return NextResponse.json(access, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Player already has access" }, { status: 409 });
    }
    throw e;
  }
}
