import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET /api/loyalty/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, xpReward, active } = body;

    if (!name || !description || xpReward === undefined) {
      return NextResponse.json(
        { error: "name, description, and xpReward are required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        name,
        description,
        xpReward: Number(xpReward),
        active: active !== false,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("POST /api/loyalty/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
