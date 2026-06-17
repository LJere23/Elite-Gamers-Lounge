import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
