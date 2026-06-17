import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; entryId: string }> }) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { entryId } = await context.params;
  const body = await request.json();
  const { bestLapTime, lapTimeNote } = body as { bestLapTime: number; lapTimeNote?: string };

  const entry = await prisma.tournamentEntry.update({
    where: { id: entryId },
    data: { bestLapTime, lapTimeNote },
  });

  return NextResponse.json({
    ...entry,
    registeredAt: entry.registeredAt.toISOString(),
  });
}
