import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const playerId = cookieStore.get("portal_player_id")?.value;

    const jobs = await prisma.job.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    let completedJobIds: string[] = [];
    if (playerId) {
      const completions = await prisma.jobCompletion.findMany({
        where: { playerId },
        select: { jobId: true },
      });
      completedJobIds = completions.map((c) => c.jobId);
    }

    return NextResponse.json({ jobs, completedJobIds, isLoggedIn: !!playerId });
  } catch (error) {
    console.error("GET /api/portal/quests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
