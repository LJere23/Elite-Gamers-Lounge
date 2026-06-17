import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/db";
import { tryAwardJob } from "@/lib/jobs";

/*
|--------------------------------------------------------------------------
| SERIALIZE SESSION
|--------------------------------------------------------------------------
*/

function serializeSession(
  session: {
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
  }
) {
  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    createdAt: session.createdAt.toISOString(),
  };
}

/*
|--------------------------------------------------------------------------
| GET SESSIONS
|--------------------------------------------------------------------------
*/

export async function GET() {

  const sessions =
    await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
    });

  const now = Date.now();

  /*
  |--------------------------------------------------------------------------
  | AUTO-END EXPIRED ACTIVE SESSIONS
  |--------------------------------------------------------------------------
  */

  const toEnd = sessions.filter(
    (s) =>
      s.status === "ACTIVE" &&
      new Date(s.endTime).getTime() <= now
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

  /*
  |--------------------------------------------------------------------------
  | COMPUTE REMAINING MINUTES FOR ACTIVE SESSIONS
  |--------------------------------------------------------------------------
  */

  const serialized = sessions.map((s) => {

    if (s.status === "ACTIVE") {

      const endedByTimer = toEnd.some((e) => e.id === s.id);

      if (endedByTimer) {

        return serializeSession({
          ...s,
          status: "ENDED",
          remainingMinutes: 0,
        });
      }

      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(s.endTime).getTime() - now) / 60000
        )
      );

      return serializeSession({
        ...s,
        remainingMinutes: remaining,
      });
    }

    return serializeSession(s);
  });

  return NextResponse.json(serialized);
}

/*
|--------------------------------------------------------------------------
| CREATE SESSION
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {

  const body =
    await request.json();

  const { playerName, playerGamerTag, game, deviceId, hours } = body;

  /*
  |--------------------------------------------------------------------------
  | FIND DEVICE
  |--------------------------------------------------------------------------
  */

  const device =
    await prisma.device.findUnique({
      where: { id: deviceId },
    });

  if (!device) {

    return NextResponse.json(
      { error: "Device not found" },
      { status: 404 }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DEVICE BUSY CHECK
  |--------------------------------------------------------------------------
  */

  if (device.status === "busy") {

    return NextResponse.json(
      { error: "Device already busy" },
      { status: 400 }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULATIONS
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | CREATE SESSION
  |--------------------------------------------------------------------------
  */

  const newSession =
    await prisma.session.create({
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

  /*
  |--------------------------------------------------------------------------
  | UPDATE DEVICE
  |--------------------------------------------------------------------------
  */

  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: "busy",
      currentSessionId: newSession.id,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | FIRST BLOOD — auto-award on first ever session for a registered member
  | Only fires when a gamerTag was provided (unique identifier, avoids
  | the name-collision ambiguity of matching on playerName alone).
  |--------------------------------------------------------------------------
  */

  if (playerGamerTag) {
    const player = await prisma.player.findUnique({
      where: { gamerTag: playerGamerTag },
    });
    if (player) {
      const sessionCount = await prisma.session.count({
        where: { playerGamerTag },
      });
      if (sessionCount === 1) {
        // This is their first ever session
        await tryAwardJob({ jobType: "milestone_first_session", playerId: player.id });
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RESPONSE
  |--------------------------------------------------------------------------
  */

  return NextResponse.json(
    serializeSession(newSession),
    { status: 201 }
  );
}
