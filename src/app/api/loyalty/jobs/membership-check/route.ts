import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { runMembershipExpiryCheck } from "@/lib/membershipExpiry";
import { revokeExpiredFounderPriceLocks } from "@/lib/founderService";

async function runCheck() {
  const expiry = await runMembershipExpiryCheck();
  const founderLocksRevoked = await revokeExpiredFounderPriceLocks();
  return { ok: true, expired: expiry.expired, warningSent: expiry.warningSent, founderLocksRevoked };
}

function isValidCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

// GET — called by Vercel Cron daily at 06:00 UTC
export async function GET(request: NextRequest) {
  if (!isValidCron(request)) {
    const adminErr = await requireAdmin(request);
    if (adminErr) return adminErr;
  }
  return NextResponse.json(await runCheck());
}

// POST — manual trigger from admin dashboard
export async function POST(request: NextRequest) {
  const adminErr = await requireAdmin(request);
  if (adminErr) return adminErr;
  return NextResponse.json(await runCheck());
}
