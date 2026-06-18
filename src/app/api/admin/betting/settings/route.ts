import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;

  const settings = await prisma.loungeSettings.findUnique({
    where: { id: "singleton" },
    select: { oraclePoolEnabled: true },
  });

  return NextResponse.json({ oraclePoolEnabled: settings?.oraclePoolEnabled ?? false });
}

export async function PATCH(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;

  const { oraclePoolEnabled } = await request.json();

  const updated = await prisma.loungeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", oraclePoolEnabled: oraclePoolEnabled ?? false },
    update: { oraclePoolEnabled: oraclePoolEnabled ?? false },
    select: { oraclePoolEnabled: true },
  });

  return NextResponse.json(updated);
}
