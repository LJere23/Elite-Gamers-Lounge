import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gamerTag: string }> }
) {
  const { gamerTag } = await params;

  const player = await prisma.player.findFirst({
    where: { gamerTag: { equals: gamerTag, mode: "insensitive" } },
    select: { id: true },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const [xpLedger, sessions, titles] = await Promise.all([
    prisma.xpLedger.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.session.findMany({
      where: { playerGamerTag: { equals: gamerTag, mode: "insensitive" } },
      orderBy: { startTime: "desc" },
      take: 50,
      select: {
        id: true,
        game: true,
        deviceName: true,
        startTime: true,
        endTime: true,
        durationHours: true,
        totalPrice: true,
        membershipCovered: true,
        status: true,
      },
    }),
    prisma.playerTitle.findMany({
      where: { playerId: player.id },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ xpLedger, sessions, titles });
}
