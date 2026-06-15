import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, generateSalt, hashPin, validatePinFormat } from "@/lib/pin";

// PATCH /api/portal/pin — change PIN (must be logged in)
export async function PATCH(request: NextRequest) {
  try {
    const playerId = request.cookies.get("portal_player_id")?.value;
    if (!playerId) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const { currentPin, newPin, confirmPin } = await request.json();

    if (!currentPin || !newPin || !confirmPin) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (newPin !== confirmPin) {
      return NextResponse.json({ error: "New PINs do not match." }, { status: 400 });
    }

    const pinError = validatePinFormat(newPin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player || !player.pin || !player.pinSalt) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    if (!verifyPin(currentPin, player.pinSalt, player.pin)) {
      return NextResponse.json({ error: "Current PIN is incorrect." }, { status: 401 });
    }

    const newSalt = generateSalt();
    const newHash = hashPin(newPin, newSalt);

    await prisma.player.update({
      where: { id: playerId },
      data: { pin: newHash, pinSalt: newSalt },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
