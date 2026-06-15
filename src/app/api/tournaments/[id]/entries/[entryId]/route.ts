import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; entryId: string }> }) {
  const { entryId } = await context.params;
  const body = await request.json();

  const entry = await prisma.tournamentEntry.update({
    where: { id: entryId },
    data: body,
  });

  return NextResponse.json({
    ...entry,
    registeredAt: entry.registeredAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await context.params;

  await prisma.tournamentEntry.delete({ where: { id: entryId } });

  await prisma.tournament.update({
    where: { id },
    data: { entries: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
