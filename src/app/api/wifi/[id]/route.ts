import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  const session = await prisma.wifiSession.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "WiFi session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    startedAt: session.startedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;
  const body = await request.json();

  const data: Record<string, unknown> = { ...body };
  if (body.expiresAt) {
    data.expiresAt = new Date(body.expiresAt);
  }

  const session = await prisma.wifiSession.update({ where: { id }, data });

  return NextResponse.json({
    ...session,
    startedAt: session.startedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id } = await context.params;

  await prisma.wifiSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
