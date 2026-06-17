import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getTierRule,
  calculateGamingSessionPricing,
  calculateRacingPricing,
  isRacingSimDevice,
  buildPerkStatus,
} from "@/lib/membershipTiers";

// GET /api/sessions/price-preview?gamerTag=&deviceId=&hours=
// Returns session pricing + full perk status for the member panel
export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const gamerTag = searchParams.get("gamerTag");
  const deviceId = searchParams.get("deviceId");
  const hours = Number(searchParams.get("hours") ?? 1);

  if (!deviceId || !hours || hours <= 0) {
    return NextResponse.json({ error: "deviceId and hours required" }, { status: 400 });
  }

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const racingSim = isRacingSimDevice(device.type);
  const basePrice = racingSim ? device.hourlyRate : hours * device.hourlyRate;

  if (!gamerTag) {
    return NextResponse.json({
      session: {
        isRacingSim: racingSim,
        basePrice,
        totalPrice: basePrice,
        membershipCovered: false,
        membershipDiscount: 0,
        label: `$${basePrice.toFixed(2)}`,
        warning: null,
      },
      perkStatus: null,
    });
  }

  const player = await prisma.player.findUnique({ where: { gamerTag } });
  if (!player) {
    return NextResponse.json({
      session: {
        isRacingSim: racingSim,
        basePrice,
        totalPrice: basePrice,
        membershipCovered: false,
        membershipDiscount: 0,
        label: `$${basePrice.toFixed(2)} (member not found)`,
        warning: null,
      },
      perkStatus: null,
    });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const rule = getTierRule(player.membershipTier);
  const membershipActive = !player.membershipExpiresAt || player.membershipExpiresAt > now;
  const periodExpired = !player.currentPeriodEnd || player.currentPeriodEnd < now;
  const perksMonthExpired = !player.perksMonthEnd || player.perksMonthEnd < now;
  const isNewDay = player.lastSessionDate !== todayStr;
  const hoursUsedToday = isNewDay ? 0 : player.hoursUsedToday;

  let sessionPricing;
  if (racingSim) {
    sessionPricing = calculateRacingPricing({
      walkInRate: device.hourlyRate,
      tier: player.membershipTier,
      racingRacesUsed: player.racingRacesUsed,
      perksMonthExpired,
      membershipActive,
    });
  } else {
    sessionPricing = calculateGamingSessionPricing({
      durationHours: hours,
      hourlyRate: device.hourlyRate,
      tier: player.membershipTier,
      hoursUsedThisPeriod: periodExpired ? 0 : player.hoursUsedThisPeriod,
      hoursUsedToday,
      periodExpired,
      membershipActive,
    });
  }

  const perkStatus = rule.periodType
    ? buildPerkStatus({
        membershipTier: player.membershipTier,
        membershipExpiresAt: player.membershipExpiresAt,
        currentPeriodEnd: player.currentPeriodEnd,
        hoursUsedThisPeriod: player.hoursUsedThisPeriod,
        hoursUsedToday: player.hoursUsedToday,
        lastSessionDate: player.lastSessionDate,
        perksMonthEnd: player.perksMonthEnd,
        racingRacesUsed: player.racingRacesUsed,
        fridayEntriesUsed: player.fridayEntriesUsed,
        racingLeagueUsed: player.racingLeagueUsed,
        wifiMinutesUsed: player.wifiMinutesUsed,
        showOnLeaderboardWall: player.showOnLeaderboardWall,
      })
    : null;

  return NextResponse.json({ session: sessionPricing, perkStatus });
}
