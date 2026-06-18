import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { refundBettingPool } from "@/lib/betting";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  const { reason } = await request.json();

  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "A reason is required for refund" }, { status: 400 });
  }

  await refundBettingPool(id, reason.trim());
  return NextResponse.json({ success: true });
}
