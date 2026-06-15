import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/db";

/*
|--------------------------------------------------------------------------
| GET DEVICE
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {

  try {

    const { id } = await context.params;

    const device =
      await prisma.device.findUnique({
        where: { id },
      });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...device,
      supportedGames: JSON.parse(
        device.supportedGames || "[]"
      ),
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH DEVICE
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {

  try {

    const { id } = await context.params;

    const updates = await request.json();

    const device =
      await prisma.device.update({
        where: { id },
        data: {
          ...updates,
          supportedGames: updates.supportedGames
            ? JSON.stringify(updates.supportedGames)
            : undefined,
        },
      });

    return NextResponse.json({
      ...device,
      supportedGames: JSON.parse(
        device.supportedGames || "[]"
      ),
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE DEVICE
|--------------------------------------------------------------------------
*/

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {

  try {

    const { id } = await context.params;

    const activeSession =
      await prisma.session.findFirst({
        where: { deviceId: id, status: "ACTIVE" },
      });

    if (activeSession) {
      return NextResponse.json(
        { error: "Cannot delete device with active sessions" },
        { status: 400 }
      );
    }

    await prisma.device.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
