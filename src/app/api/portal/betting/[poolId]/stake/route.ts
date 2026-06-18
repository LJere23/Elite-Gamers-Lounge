import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { placeBet } from "@/lib/betting";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  const playerId = request.cookies.get("portal_player_id")?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { poolId } = await params;
  const { outcomeId, amountCxp } = await request.json();

  if (!outcomeId || typeof amountCxp !== "number") {
    return NextResponse.json({ error: "outcomeId and amountCxp are required" }, { status: 400 });
  }

  const result = await placeBet(playerId, poolId, outcomeId, amountCxp);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
