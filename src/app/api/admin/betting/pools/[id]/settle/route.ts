import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { settleBettingPool } from "@/lib/betting";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  const { winningOutcomeId } = await request.json();

  if (!winningOutcomeId) {
    return NextResponse.json({ error: "winningOutcomeId is required" }, { status: 400 });
  }

  await settleBettingPool(id, winningOutcomeId);
  return NextResponse.json({ success: true });
}
