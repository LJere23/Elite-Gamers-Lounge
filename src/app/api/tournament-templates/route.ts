import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const templates = await prisma.tournamentTemplate.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(templates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  })));
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json();

  const template = await prisma.tournamentTemplate.create({
    data: {
      templateName:              String(body.templateName ?? "").trim(),
      defaultGame:               String(body.defaultGame ?? "").trim(),
      category:                  String(body.category ?? "other"),
      format:                    String(body.format ?? "knockout"),
      scoringSystem:             String(body.scoringSystem ?? "best_of_1"),
      maxPlayers:                Number(body.maxPlayers ?? 8),
      walkInFee:                 Number(body.walkInFee ?? 0),
      warriorFreeEntriesPerMonth: Number(body.warriorFreeEntriesPerMonth ?? 0),
      warriorDiscountPercent:    Number(body.warriorDiscountPercent ?? 0),
      heroFreeEntriesPerMonth:   Number(body.heroFreeEntriesPerMonth ?? 0),
      heroDiscountPercent:       Number(body.heroDiscountPercent ?? 0),
      legendFreeEntriesPerMonth: Number(body.legendFreeEntriesPerMonth ?? 0),
      legendDiscountPercent:     Number(body.legendDiscountPercent ?? 0),
      xpReward:                  Number(body.xpReward ?? 0),
      prizeDescription:          String(body.prizeDescription ?? "").trim(),
      isEnabled:                 body.isEnabled !== false,
    },
  });

  return NextResponse.json({ ...template, createdAt: template.createdAt.toISOString() }, { status: 201 });
}
