import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!job.active) return NextResponse.json({ error: "Job is not active" }, { status: 400 });

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const alreadyCompleted = await prisma.jobCompletion.findFirst({
      where: { playerId, jobId: id },
    });
    if (alreadyCompleted) {
      return NextResponse.json({ error: "Player has already completed this job" }, { status: 409 });
    }

    const multiplier = getXpMultiplier(player.membershipTier);
    const finalAmount = Math.round(job.xpReward * multiplier);

    const { updatedPlayer, completion } = await prisma.$transaction(async (tx) => {
      const completion = await tx.jobCompletion.create({ data: { playerId, jobId: id } });

      await tx.xpLedger.create({
        data: { playerId, amount: finalAmount, source: "job", jobId: id, note: `Completed: ${job.name}` },
      });

      const fresh = await tx.player.update({
        where: { id: playerId },
        data: { xp: { increment: finalAmount } },
      });

      const newRank = computeRank(fresh.xp, fresh.visitCount);
      const updatedPlayer = newRank !== fresh.rank
        ? await tx.player.update({ where: { id: playerId }, data: { rank: newRank } })
        : fresh;

      return { updatedPlayer, completion };
    });

    const newRank = updatedPlayer.rank;
    const rankUp = newRank !== player.rank;

    // Quest complete notification — always fires
    await prisma.notification.create({
      data: {
        playerId,
        type: "quest",
        heading: "Quest Complete",
        message: `You completed "${job.name}" and earned ${finalAmount} XP. Well done, adventurer.`,
        severity: "success",
      },
    });

    if (rankUp) {
      await prisma.announcement.create({
        data: { message: `${player.name} (${player.gamerTag}) ranked up to ${newRank}! 🎉`, type: "rank_up" },
      });
      await prisma.notification.create({
        data: {
          playerId,
          type: "rank_up",
          heading: "Rank Up!",
          message: `You have ascended to ${newRank}. The lounge recognises your dedication.`,
          severity: "success",
        },
      });
    }

    return NextResponse.json({ player: updatedPlayer, completion, xpAwarded: finalAmount, newRank, rankUp });
  } catch (error) {
    console.error("POST /api/loyalty/jobs/[id]/complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
