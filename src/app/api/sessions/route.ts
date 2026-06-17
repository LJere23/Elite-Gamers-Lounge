import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tryAwardJob } from "@/lib/jobs";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getTierRule,
  calculateGamingSessionPricing,
  calculateRacingPricing,
  isRacingSimDevice,
  nextPeriodEnd,
  nextMonthEnd,
} from "@/lib/membershipTiers";

function serializeSession(session: {
  id: string;
  playerName: string;
  game: string;
  deviceId: string;
  deviceName: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  totalPrice: number;
  remainingMinutes: number;
  status: string;
  createdAt: Date;
  membershipCovered: boolean;
  membershipDiscount: number;
}) {
  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    createdAt: session.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const toEnd = sessions.filter(
    (s) => s.status === "ACTIVE" && new Date(s.endTime).getTime() <= now
  );

  if (toEnd.length > 0) {
    await Promise.all(
      toEnd.map((s) =>
        prisma.session.update({
          where: { id: s.id },
          data: { status: "ENDED", remainingMinutes: 0 },
        })
      )
    );
  }

  const serialized = sessions.map((s) => {
    if (s.status === "ACTIVE") {
      const endedByTimer = toEnd.some((e) => e.id === s.id);
      if (endedByTimer) {
        return serializeSession({ ...s, status: "ENDED", remainingMinutes: 0 });
      }
      const remaining = Math.max(0, Math.floor((new Date(s.endTime).getTime() - now) / 60000));
      return serializeSession({ ...s, remainingMinutes: remaining });
    }
    return serializeSession(s);
  });

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json();
  const { playerName, playerGamerTag, game, deviceId, hours } = body;

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });
  if (device.status === "busy") return NextResponse.json({ error: "Device already busy" }, { status: 400 });

  const durationHours = Number(hours);
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    return NextResponse.json({ error: "hours must be between 0 and 24" }, { status: 400 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const racingSim = isRacingSimDevice(device.type);

  let membershipCovered = false;
  let membershipDiscount = 0;
  let totalPrice = durationHours * device.hourlyRate;
  let playerForSession: Awaited<ReturnType<typeof prisma.player.findUnique>> | null = null;

  if (playerGamerTag) {
    playerForSession = await prisma.player.findUnique({ where: { gamerTag: playerGamerTag } });
  }

  if (playerForSession) {
    const rule = getTierRule(playerForSession.membershipTier);
    const membershipActive = !playerForSession.membershipExpiresAt || playerForSession.membershipExpiresAt > now;

    if (membershipActive && rule.periodType) {
      const periodExpired = !playerForSession.currentPeriodEnd || playerForSession.currentPeriodEnd < now;
      const perksMonthExpired = !playerForSession.perksMonthEnd || playerForSession.perksMonthEnd < now;
      const isNewDay = playerForSession.lastSessionDate !== todayStr;

      if (racingSim) {
        // Racing sim: per-race pricing
        const pricing = calculateRacingPricing({
          walkInRate: device.hourlyRate,
          tier: playerForSession.membershipTier,
          racingRacesUsed: playerForSession.racingRacesUsed,
          perksMonthExpired,
          membershipActive,
        });

        membershipCovered = pricing.raceFree;
        membershipDiscount = pricing.membershipDiscount;
        totalPrice = pricing.totalPrice;

        // Update monthly perks period
        const newRacesUsed = (perksMonthExpired ? 0 : playerForSession.racingRacesUsed) + 1;
        await prisma.player.update({
          where: { id: playerForSession.id },
          data: {
            racingRacesUsed: newRacesUsed,
            perksMonthStart: perksMonthExpired ? now : playerForSession.perksMonthStart,
            perksMonthEnd: perksMonthExpired ? nextMonthEnd(now) : playerForSession.perksMonthEnd,
          },
        });
      } else {
        // Standard gaming session
        const hoursUsedToday = isNewDay ? 0 : playerForSession.hoursUsedToday;
        const pricing = calculateGamingSessionPricing({
          durationHours,
          hourlyRate: device.hourlyRate,
          tier: playerForSession.membershipTier,
          hoursUsedThisPeriod: playerForSession.hoursUsedThisPeriod,
          hoursUsedToday,
          periodExpired,
          membershipActive,
        });

        if (pricing.dailyCapExceeded && pricing.dailyHoursRemaining === 0) {
          return NextResponse.json(
            { error: `Daily gaming cap reached (${rule.dailyHoursCap}h/day). No membership hours apply today.` },
            { status: 400 }
          );
        }

        membershipCovered = pricing.membershipCovered;
        membershipDiscount = pricing.membershipDiscount;
        totalPrice = pricing.totalPrice;

        // Update gaming period
        let newPeriodStart = playerForSession.currentPeriodStart;
        let newPeriodEnd = playerForSession.currentPeriodEnd;
        let newHoursUsed = playerForSession.hoursUsedThisPeriod + durationHours;

        if (periodExpired) {
          newPeriodStart = now;
          newPeriodEnd = nextPeriodEnd(now, rule.periodType);
          newHoursUsed = durationHours;
        }

        const newHoursToday = hoursUsedToday + durationHours;

        await prisma.player.update({
          where: { id: playerForSession.id },
          data: {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            hoursUsedThisPeriod: newHoursUsed,
            hoursUsedToday: newHoursToday,
            lastSessionDate: todayStr,
          },
        });
      }
    }
  }

  const startTime = now;
  const endTime = new Date(now.getTime() + durationHours * 3600000);

  const newSession = await prisma.session.create({
    data: {
      playerName,
      playerGamerTag: playerGamerTag || null,
      game,
      deviceId,
      deviceName: device.name,
      startTime,
      endTime,
      durationHours,
      totalPrice,
      remainingMinutes: durationHours * 60,
      status: "ACTIVE",
      membershipCovered,
      membershipDiscount,
    },
  });

  await prisma.device.update({
    where: { id: deviceId },
    data: { status: "busy", currentSessionId: newSession.id },
  });

  if (playerForSession) {
    const sessionCount = await prisma.session.count({ where: { playerGamerTag } });
    if (sessionCount === 1) {
      await tryAwardJob({ jobType: "milestone_first_session", playerId: playerForSession.id });
    }
  }

  return NextResponse.json(serializeSession(newSession), { status: 201 });
}
