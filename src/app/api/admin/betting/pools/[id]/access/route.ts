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
  const { gamerTag } = await request.json();

  if (!gamerTag || typeof gamerTag !== "string") {
    return NextResponse.json({ error: "gamerTag is required" }, { status: 400 });
  }

  const pool = await prisma.bettingPool.findUnique({ where: { id: bettingPoolId } });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const player = await prisma.player.findFirst({
    where: { gamerTag: { equals: gamerTag.replace(/^@/, ""), mode: "insensitive" } },
    select: { id: true, gamerTag: true, name: true },
  });
  if (!player) return NextResponse.json({ error: `No player found with gamerTag @${gamerTag}` }, { status: 404 });

  // Block competitors from being added to the access list entirely
  const competitor = await isPlayerCompetitor(player.id, bettingPoolId);
  if (competitor) {
    return NextResponse.json(
      { error: `@${player.gamerTag} is a competitor in this pool's tournament or match and cannot be invited.` },
      { status: 422 }
    );
  }

  const playerId = player.id;

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
