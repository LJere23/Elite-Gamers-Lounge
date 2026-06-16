import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export async function GET() {
  try {
    const settings = await prisma.loungeSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      return NextResponse.json(defaults);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const updated = await prisma.loungeSettings.upsert({
      where: { id: "singleton" },
      update: body,
      create: { ...defaults, ...body, id: "singleton" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
