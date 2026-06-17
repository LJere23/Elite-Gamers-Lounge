import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

/*
|--------------------------------------------------------------------------
| GET DEVICES
|--------------------------------------------------------------------------
*/

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {

    const devices =
      await prisma.device.findMany({
        orderBy: { name: "asc" },
      });

    const parsed = devices.map(
      (device) => ({
        ...device,
        supportedGames: JSON.parse(
          device.supportedGames || "[]"
        ),
      })
    );

    return NextResponse.json(parsed);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE DEVICE
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {

    const body = await request.json();

    const device =
      await prisma.device.create({
        data: {
          name: body.name,
          type: body.type,
          hourlyRate: body.hourlyRate,
          supportedGames: JSON.stringify(
            body.supportedGames || []
          ),
          status: body.status || "available",
          location: body.location || "Main Floor",
        },
      });

    return NextResponse.json(
      {
        ...device,
        supportedGames: JSON.parse(
          device.supportedGames || "[]"
        ),
      },
      { status: 201 }
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}
