import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id }        = await params;
  const { name, pin, role, active } = await request.json();

  const data: Record<string, unknown> = {};
  if (name   !== undefined) data.name   = name;
  if (role   !== undefined) data.role   = role;
  if (active !== undefined) data.active = active;

  if (pin) {
    if (pin.length < 4) {
      return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
    }
    const salt      = await bcrypt.genSalt(10);
    data.pin        = await bcrypt.hash(pin, salt);
    data.pinSalt    = salt;
  }

  const account = await prisma.staffAccount.update({
    where: { id },
    data,
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(account);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { id } = await params;
  await prisma.staffAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
