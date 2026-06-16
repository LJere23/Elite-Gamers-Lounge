import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

async function getPlayerFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("portal_player_id")?.value ?? null;
}

// GET — return unread notifications for logged-in player
export async function GET() {
  try {
    const playerId = await getPlayerFromCookie();
    if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { playerId, read: false },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/portal/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — mark all notifications as read for logged-in player
export async function POST() {
  try {
    const playerId = await getPlayerFromCookie();
    if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { playerId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/portal/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
