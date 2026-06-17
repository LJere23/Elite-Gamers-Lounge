import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSalt, hashPin, validatePinFormat } from "@/lib/pin";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST /api/portal/forgot-pin
// Body: { identifier, dateOfBirth, newPin, confirmPin }
// Verifies identity via email/gamerTag + date of birth, then resets PIN.
export async function POST(request: NextRequest) {
  // 5 attempts per 15 minutes per IP
  const rl = rateLimit(`forgot-pin:${clientIp(request)}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { identifier, dateOfBirth, newPin, confirmPin } = await request.json();

    if (!identifier || !dateOfBirth || !newPin || !confirmPin) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (newPin !== confirmPin) {
      return NextResponse.json({ error: "PINs do not match." }, { status: 400 });
    }

    const pinError = validatePinFormat(newPin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const player = await prisma.player.findFirst({
      where: { OR: [{ email: identifier.trim() }, { gamerTag: identifier.trim() }] },
    });

    const fail = () =>
      NextResponse.json(
        { error: "We could not verify your identity. Check your details or contact the lounge." },
        { status: 401 }
      );

    if (!player) return fail();

    if (!player.dateOfBirth) {
      return NextResponse.json(
        { error: "No date of birth on file. Please visit the lounge to reset your PIN." },
        { status: 401 }
      );
    }

    const inputDay = new Date(dateOfBirth).toISOString().slice(0, 10);
    const storedDay = player.dateOfBirth.toISOString().slice(0, 10);

    if (inputDay !== storedDay) return fail();

    const salt = generateSalt();
    const hash = hashPin(newPin, salt);

    await prisma.player.update({
      where: { id: player.id },
      data: { pin: hash, pinSalt: salt },
    });

    return NextResponse.json({ success: true, gamerTag: player.gamerTag });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
