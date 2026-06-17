import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin } from "@/lib/pin";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // 10 attempts per 15 minutes per IP
  const rl = rateLimit(`portal-login:${clientIp(request)}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

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
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
