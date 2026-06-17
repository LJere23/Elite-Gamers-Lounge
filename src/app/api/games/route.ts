import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET is public — used in session form dropdown
export async function GET() {
  const games = await prisma.game.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name || name.length > 80) {
    return NextResponse.json(
      { error: "Game name is required and must be under 80 characters" },
      { status: 400 }
    );
  }

  try {
    const game = await prisma.game.create({ data: { name } });
    return NextResponse.json(game, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "A game with that name already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
