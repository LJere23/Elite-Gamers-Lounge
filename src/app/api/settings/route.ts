import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

const defaults = {
  id: "singleton",
  name: "Elite Gamers Lounge",
  tagline: "Gweru's Premier Gaming Experience",
  contactEmail: "",
  contactPhone: "",
  address: "Gweru, Zimbabwe",
  sessionRate: 1.0,
  wifiRate: 0.5,
  currency: "USD",
  openingTime: "09:00",
  closingTime: "22:00",
  whatsappNumber: "263784497531",
  adminPassword: "admin123",
  communityHeadline: "Join Our Gaming Community",
  communityBody:
    "Elite Gamers Lounge is more than a gaming venue — it's a community of competitive players, casual gamers, and esports enthusiasts all under one roof.",
  communityStat1Label: "Members",
  communityStat1Value: "200+",
  communityStat2Label: "Tournaments",
  communityStat2Value: "50+",
  communityStat3Label: "Games Available",
  communityStat3Value: "30+",
  countdownEnabled: false,
  countdownTitle: "Next Event",
  countdownDate: "",
};

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const settings = await prisma.loungeSettings.findUnique({
      where: { id: "singleton" },
    });

    const base = settings ?? defaults;
    // Never return the password hash to the client
    return NextResponse.json({ ...base, adminPassword: "" });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();

    // Hash the password if a new one was provided
    const updateData = { ...body };
    if (typeof body.adminPassword === "string" && body.adminPassword.trim()) {
      updateData.adminPassword = await bcrypt.hash(body.adminPassword, 12);
    } else {
      delete updateData.adminPassword;
    }

    const updated = await prisma.loungeSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: { ...defaults, ...updateData, id: "singleton" },
    });

    return NextResponse.json({ ...updated, adminPassword: "" });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
