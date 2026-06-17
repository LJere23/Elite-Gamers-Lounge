import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tryAwardJob } from "@/lib/jobs";
import { requireAdmin } from "@/lib/adminAuth";

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
      const remaining = Math.max(
        0,
        Math.floor((new Date(s.endTime).getTime() - now) / 60000)
      );
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
  if (!device) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  if (device.status === "busy") {
    return NextResponse.json({ error: "Device already busy" }, { status: 400 });
  }

  const durationHours = Number(hours);
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    return NextResponse.json(
      { error: "hours must be between 0 and 24" },
      { status: 400 }
    );
  }

  const totalPrice = durationHours * device.hourlyRate;
  const startTime = new Date();
  const endTime = new Date(Date.now() + durationHours * 3600000);

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
    },
  });

  await prisma.device.update({
    where: { id: deviceId },
    data: { status: "busy", currentSessionId: newSession.id },
  });

  if (playerGamerTag) {
    const player = await prisma.player.findUnique({
      where: { gamerTag: playerGamerTag },
    });
    if (player) {
      const sessionCount = await prisma.session.count({
        where: { playerGamerTag },
      });
      if (sessionCount === 1) {
        await tryAwardJob({
          jobType: "milestone_first_session",
          playerId: player.id,
        });
      }
    }
  }

  return NextResponse.json(serializeSession(newSession), { status: 201 });
}
