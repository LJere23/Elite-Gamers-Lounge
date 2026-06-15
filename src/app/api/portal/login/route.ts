import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin } from "@/lib/pin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, pin } = body;

    if (!identifier) {
      return NextResponse.json({ error: "Email or GamerTag is required." }, { status: 400 });
    }
    if (!pin) {
      return NextResponse.json({ error: "PIN is required." }, { status: 400 });
    }

    const player = await prisma.player.findFirst({
      where: { OR: [{ email: identifier }, { gamerTag: identifier }] },
    });

    // Same error for both "not found" and "wrong PIN" to avoid enumeration
    const invalid = () =>
      NextResponse.json(
        { error: "Incorrect GamerTag / email or PIN." },
        { status: 401 }
      );

    if (!player) return invalid();
    if (!player.pin || !player.pinSalt) return invalid();
    if (!verifyPin(pin, player.pinSalt, player.pin)) return invalid();

    const response = NextResponse.json({ player: { gamerTag: player.gamerTag } });
    response.cookies.set("portal_player_id", player.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
