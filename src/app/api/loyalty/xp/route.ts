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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, amount, source, jobId, note } = body;

    if (!playerId || amount === undefined || !source) {
      return NextResponse.json(
        { error: "playerId, amount, and source are required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const multiplier = getXpMultiplier(player.membershipTier);
    const finalAmount = Math.round(parsedAmount * multiplier);
    const visitIncrement = source === "visit" ? 1 : 0;

    // Atomic increment avoids read-then-write race condition under concurrent requests
    const updatedPlayer = await prisma.$transaction(async (tx) => {
      await tx.xpLedger.create({
        data: {
          playerId,
          amount: finalAmount,
          source,
          jobId: jobId ?? null,
          note: note ?? null,
        },
      });

      const fresh = await tx.player.update({
        where: { id: playerId },
        data: {
          xp: { increment: finalAmount },
          visitCount: { increment: visitIncrement },
        },
      });

      const newRank = computeRank(fresh.xp, fresh.visitCount);
      if (newRank !== fresh.rank) {
        return tx.player.update({ where: { id: playerId }, data: { rank: newRank } });
      }
      return fresh;
    });

    const newRank = updatedPlayer.rank;
    const rankUp = newRank !== player.rank;

    if (rankUp) {
      await prisma.announcement.create({
        data: {
          message: `${player.name} (${player.gamerTag}) has ranked up to ${newRank}! 🎉`,
          type: "rank_up",
        },
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


    return NextResponse.json({
      player: updatedPlayer,
      xpAwarded: finalAmount,
      newRank,
      rankUp,
    });
  } catch (error) {
    console.error("POST /api/loyalty/xp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const players = await prisma.player.findMany({
      orderBy: { xp: "desc" },
      take: limit,
      include: { titles: true },
    });

    const leaderboard = players.map((player, index) => ({
      ...player,
      position: index + 1,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/loyalty/xp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
