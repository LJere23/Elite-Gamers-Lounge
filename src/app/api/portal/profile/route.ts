import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const playerId = cookieStore.get("portal_player_id")?.value;
    if (!playerId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name ?? "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (name.length > 40) {
      return NextResponse.json({ error: "Name must be 40 characters or fewer." }, { status: 400 });
    }

    // Check if another player already has this name (case-insensitive)
    const conflict = await prisma.player.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        NOT: { id: playerId },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "That name is already taken. Please choose a different one." }, { status: 409 });
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { name },
    });

    return NextResponse.json({ name: updated.name });
  } catch (error) {
    console.error("PATCH /api/portal/profile error:", error);
    return NextResponse.json({ error: "Failed to update name." }, { status: 500 });
  }
}
