import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const games = await prisma.game.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Game name is required" }, { status: 400 });
  }

  try {
    const game = await prisma.game.create({ data: { name } });
    return NextResponse.json(game, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A game with that name already exists" }, { status: 409 });
    }
    throw err;
  }
}
