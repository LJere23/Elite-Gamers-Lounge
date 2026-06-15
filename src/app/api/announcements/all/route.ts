import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    }))
  );
}
