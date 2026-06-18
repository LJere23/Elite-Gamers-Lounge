import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id: bettingPoolId, playerId } = await params;

  await prisma.bettingPoolAccess.deleteMany({
    where: { bettingPoolId, playerId },
  });

  return NextResponse.json({ success: true });
}
