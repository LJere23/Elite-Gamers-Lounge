import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { runWeeklyLeaderboard } from "@/lib/weeklyLeaderboard";
import { getWeekKey } from "@/lib/challengeTracker";

function isValidCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function runAll() {
  const leaderboard = await runWeeklyLeaderboard();
  const weekKey     = getWeekKey();
  return { leaderboard, weekKey, challengesReset: true };
}

// GET — called by Vercel Cron weekly on Mondays at 09:00 UTC
export async function GET(request: NextRequest) {
  if (!isValidCron(request)) {
    const adminErr = await requireAdmin(request);
    if (adminErr) return adminErr;
  }
  return NextResponse.json(await runAll());
}

// POST — manual trigger
export async function POST(request: NextRequest) {
  const adminErr = await requireAdmin(request);
  if (adminErr) return adminErr;
  return NextResponse.json(await runAll());
}
