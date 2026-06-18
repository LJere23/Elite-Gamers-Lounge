import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { gamerTag, amount, sourceType, reason } = await request.json();

  if (!gamerTag || typeof amount !== "number") {
    return NextResponse.json({ error: "gamerTag and amount (integer) are required" }, { status: 400 });
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "Amount must be a non-zero integer" }, { status: 400 });
  }

  const player = await prisma.player.findFirst({
    where: { gamerTag: { equals: (gamerTag as string).replace(/^@/, ""), mode: "insensitive" } },
    select: { id: true, cxpBalance: true, gamerTag: true, name: true },
  });
  if (!player) return NextResponse.json({ error: `No player found with gamerTag @${gamerTag}` }, { status: 404 });

  const playerId = player.id;

  const newBalance = player.cxpBalance + amount;
  if (newBalance < 0) {
    return NextResponse.json(
      { error: `Cannot deduct ${Math.abs(amount)} C-XP — player only has ${player.cxpBalance}.` },
      { status: 400 }
    );
  }

  const type = sourceType === "mission" ? "mission" : "admin_adjustment";

  await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data: { cxpBalance: { increment: amount } },
    }),
    prisma.cxpLedger.create({
      data: {
        playerId,
        amount,
        sourceType: type,
        sourceLabel: reason.trim(),
      },
    }),
    prisma.notification.create({
      data: {
        playerId,
        type:    amount > 0 ? "xp" : "info",
        heading: amount > 0 ? `+${amount} C-XP` : `${amount} C-XP`,
        message: `${reason.trim()} — New balance: ${newBalance} C-XP.`,
        severity: amount > 0 ? "success" : "info",
      },
    }),
  ]);

  return NextResponse.json({ newBalance });
}
