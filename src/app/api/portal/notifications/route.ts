import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — return unread notifications for logged-in player
export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("portal_player_id")?.value;
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
export async function POST(request: NextRequest) {
  try {
    const playerId = request.cookies.get("portal_player_id")?.value;
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
