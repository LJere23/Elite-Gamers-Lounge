import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = announcements.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, tournamentId, tournamentName, winnerName, prizeAmount, expiresInDays } = body;

  const now = Date.now();
  const expiresAt = expiresInDays ? new Date(now + expiresInDays * 86400000) : null;

  const announcement = await prisma.announcement.create({
    data: {
      message,
      tournamentId: tournamentId ?? null,
      tournamentName: tournamentName ?? null,
      winnerName: winnerName ?? null,
      prizeAmount: prizeAmount ?? null,
      type: body.type || "general",
      expiresAt,
    },
  });

  return NextResponse.json(
    {
      ...announcement,
      createdAt: announcement.createdAt.toISOString(),
      expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
    },
    { status: 201 }
  );
}
