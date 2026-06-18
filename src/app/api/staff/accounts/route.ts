import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const accounts = await prisma.staffAccount.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { name, pin, role } = await request.json();

  if (!name || !pin) {
    return NextResponse.json({ error: "Name and PIN required" }, { status: 400 });
  }
  if (pin.length < 4) {
    return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
  }

  const salt       = await bcrypt.genSalt(10);
  const hashedPin  = await bcrypt.hash(pin, salt);

  const account = await prisma.staffAccount.create({
    data: {
      name,
      pin:     hashedPin,
      pinSalt: salt,
      role:    role ?? "staff",
    },
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(account, { status: 201 });
}
