import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSalt, hashPin, validatePinFormat } from "@/lib/pin";
import { tryAwardJob } from "@/lib/jobs";

export async function GET() {
  const players = await prisma.player.findMany({ orderBy: { joinedAt: "desc" } });

  const serialized = players.map((player) => ({
    ...player,
    joinedAt: player.joinedAt.toISOString(),
    membershipExpiresAt: player.membershipExpiresAt
      ? player.membershipExpiresAt.toISOString()
      : null,
    dateOfBirth: player.dateOfBirth ? player.dateOfBirth.toISOString() : null,
    lastVisitAt: player.lastVisitAt ? player.lastVisitAt.toISOString() : null,
    membershipType:
      player.membershipTier !== "Villager" && player.membershipTier !== "Adventurer"
        ? "member"
        : "visitor",
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    name,
    gamerTag,
    email,
    phone,
    dateOfBirth,
    city,
    age,
    membershipTier,
    membershipExpiresAt,
    favoriteGame,
    pin,
    referredByGamerTag,
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }
  const pinError = validatePinFormat(pin);
  if (pinError) {
    return NextResponse.json({ error: pinError }, { status: 400 });
  }

  const resolvedGamerTag =
    gamerTag && gamerTag.trim() !== ""
      ? gamerTag
      : name.replace(/\s+/g, "") + Date.now().toString(36);

  const initialRank = "Villager";
  const pinSalt = generateSalt();
  const pinHash = hashPin(pin, pinSalt);

  // Resolve optional referrer by gamerTag (must exist and not be the same person)
  let referredById: string | null = null;
  if (referredByGamerTag && typeof referredByGamerTag === "string" && referredByGamerTag.trim()) {
    const referrer = await prisma.player.findUnique({
      where: { gamerTag: referredByGamerTag.trim() },
    });
    if (referrer) referredById = referrer.id;
  }

  let newPlayer;
  try {
  newPlayer = await prisma.player.create({
    data: {
      name,
      gamerTag: resolvedGamerTag,
      email,
      phone: phone ?? null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      city: city ?? "Gweru",
      age: age ?? null,
      membershipTier: membershipTier ?? "Villager",
      membershipExpiresAt: membershipExpiresAt ? new Date(membershipExpiresAt) : null,
      favoriteGame: favoriteGame ?? null,
      status: "active",
      xp: 0,
      visitCount: 0,
      rank: initialRank,
      pin: pinHash,
      pinSalt,
      referredById,
    },
  });
  } catch (err: any) {
    if (err?.code === "P2002") {
      const field = err?.meta?.target?.includes("email") ? "email" : "gamerTag";
      return NextResponse.json({ error: `A player with this ${field} already exists` }, { status: 409 });
    }
    throw err;
  }

  // Community Champion — award the referrer for each unique successful referral.
  // Known limitation: a determined user could register multiple accounts with
  // different emails to farm this. Low risk in a single-lounge setting where
  // staff can verify registrations. Deactivate the job in Admin → Loyalty if abused.
  if (referredById) {
    await tryAwardJob({
      jobType:   "referral",
      playerId:  referredById,
      contextId: newPlayer.id,
    });
  }

  if (city && city !== "Gweru") {
    await prisma.playerTitle.create({
      data: {
        playerId: newPlayer.id,
        title: "Otherworlder",
      },
    });
    await prisma.notification.create({
      data: {
        playerId: newPlayer.id,
        type: "title",
        heading: "Title Bestowed",
        message: `You have been granted the title "Otherworlder". A traveller from beyond Gweru — your presence is noted.`,
        severity: "success",
      },
    });
  }

  const serialized = {
    ...newPlayer,
    joinedAt: newPlayer.joinedAt.toISOString(),
    membershipExpiresAt: newPlayer.membershipExpiresAt
      ? newPlayer.membershipExpiresAt.toISOString()
      : null,
    dateOfBirth: newPlayer.dateOfBirth ? newPlayer.dateOfBirth.toISOString() : null,
    lastVisitAt: newPlayer.lastVisitAt ? newPlayer.lastVisitAt.toISOString() : null,
    membershipType:
      newPlayer.membershipTier !== "Villager" && newPlayer.membershipTier !== "Adventurer"
        ? "member"
        : "visitor",
  };

  return NextResponse.json(serialized, { status: 201 });
}
