import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30) return "Adventurer";
  if (xp < 80) return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

function getXpMultiplier(tier: string): number {
  if (tier === "Legend") return 1.35;
  if (tier === "Hero") return 1.2;
  if (tier === "Warrior") return 1.1;
  return 1.0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeSession(session: any) {
  return {
    ...session,
    startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
    endTime: session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  const body = await request.json();

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...body };
  if (typeof data.startTime === "string") data.startTime = new Date(data.startTime);
  if (typeof data.endTime === "string") data.endTime = new Date(data.endTime);

  const updatedSession = await prisma.session.update({ where: { id }, data });

  if (body.status === "ENDED") {
    await prisma.device.update({
      where: { id: session.deviceId },
      data: { status: "available", currentSessionId: null },
    });

    await prisma.notification.create({
      data: {
        message: `${session.playerName} finished playing on ${session.deviceName}`,
        severity: "info",
      },
    });

    const player = await prisma.player.findFirst({
      where: { name: session.playerName },
    });

    if (player) {
      const newVisitCount = player.visitCount + 1;
      const multiplier = getXpMultiplier(player.membershipTier);
      const xpAwarded = Math.floor(1 * multiplier);
      const newXp = player.xp + xpAwarded;
      const oldRank = player.rank;
      const newRank = computeRank(newXp, newVisitCount);

      await prisma.player.update({
        where: { id: player.id },
        data: { visitCount: newVisitCount, lastVisitAt: new Date(), xp: newXp, rank: newRank },
      });

      await prisma.xpLedger.create({
        data: {
          playerId: player.id,
          amount: xpAwarded,
          source: "visit",
          note: `Visit XP from session on ${session.deviceName}`,
          createdAt: new Date(),
        },
      });

      if (newRank !== oldRank) {
        const rankOrder = ["Villager", "Adventurer", "F Rank", "E Rank", "D Rank", "C Rank", "B Rank", "A Rank", "S Rank"];
        if (rankOrder.indexOf(newRank) > rankOrder.indexOf(oldRank)) {
          await prisma.announcement.create({
            data: {
              message: `${player.name} (${player.gamerTag}) has ranked up to ${newRank}!`,
              type: "rank_up",
              createdAt: new Date(),
            },
          });
        }
      }
    }
  }

  return NextResponse.json(serializeSession(updatedSession));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.device.update({
    where: { id: session.deviceId },
    data: { status: "available", currentSessionId: null },
  });

  await prisma.session.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
