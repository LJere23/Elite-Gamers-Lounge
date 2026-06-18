import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWeekKey } from "@/lib/challengeTracker";

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

  const weekKey    = getWeekKey();
  const challenges = await prisma.challenge.findMany({
    where:   { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      progress: {
        where: { playerId: player.id, weekKey },
      },
    },
  });

  const result = challenges.map((c) => ({
    id:          c.id,
    name:        c.name,
    description: c.description,
    icon:        c.icon,
    type:        c.type,
    target:      c.target,
    xpReward:    c.xpReward,
    weeklyReset: c.weeklyReset,
    progress:    c.progress[0]?.progress ?? 0,
    completed:   c.progress[0]?.completed ?? false,
    completedAt: c.progress[0]?.completedAt ?? null,
  }));

  return NextResponse.json({ weekKey, challenges: result });
}
