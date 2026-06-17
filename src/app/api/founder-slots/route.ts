import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public — read-only counter for staff and public display
export async function GET() {
  const settings = await prisma.loungeSettings.findUnique({
    where: { id: "singleton" },
    select: { foundingSlotsCap: true, foundingSlotsRemaining: true },
  });

  const cap = settings?.foundingSlotsCap ?? 50;
  const remaining = settings?.foundingSlotsRemaining ?? 50;
  const filled = cap - remaining;

  return NextResponse.json({ cap, remaining, filled });
}
