import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;
  const sessions = await prisma.wifiSession.findMany({
    orderBy: { startedAt: "desc" },
  });

  const now = Date.now();

  const expiredIds: string[] = [];

  const updated = sessions.map((session) => {
    if (session.status === "active") {
      const remainingMinutes = Math.max(
        0,
        Math.floor((session.expiresAt.getTime() - now) / 60000)
      );

      if (remainingMinutes <= 0) {
        expiredIds.push(session.id);
        return {
          ...session,
          status: "expired",
          remainingMinutes: 0,
          startedAt: session.startedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        };
      }

      return {
        ...session,
        remainingMinutes,
        startedAt: session.startedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      };
    }

    return {
      ...session,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  });

  if (expiredIds.length > 0) {
    await Promise.all(
      expiredIds.map((id) =>
        prisma.wifiSession.update({
          where: { id },
          data: { status: "expired", remainingMinutes: 0 },
        })
      )
    );
  }

  return NextResponse.json(updated);
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const body = await request.json();

  const startedAt = new Date();
  const expiresAt =
    body.expiresAt && !Number.isNaN(new Date(body.expiresAt).getTime())
      ? new Date(body.expiresAt)
      : new Date(startedAt.getTime() + 3600000);

  if (expiresAt <= startedAt) {
    return NextResponse.json(
      { error: "expiresAt must be in the future" },
      { status: 400 }
    );
  }

  const durationHours = (expiresAt.getTime() - startedAt.getTime()) / 3600000;
  const remainingMinutes = Math.floor(
    (expiresAt.getTime() - startedAt.getTime()) / 60000
  );

  const session = await prisma.wifiSession.create({
    data: {
      name: String(body.name || ""),
      device: String(body.device || "Laptop"),
      station: String(body.station || "Main Floor"),
      status: "active",
      startedAt,
      expiresAt,
      durationHours,
      remainingMinutes,
      priceUsd: Number(body.priceUsd || 0),
    },
  });

  return NextResponse.json(
    {
      ...session,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    },
    { status: 201 }
  );
}
