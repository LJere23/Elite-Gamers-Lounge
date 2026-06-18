import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createStaffToken, getStaffCookieOptions } from "@/lib/staffAuth";

export async function POST(request: NextRequest) {
  const { name, pin } = await request.json();

  if (!name || !pin) {
    return NextResponse.json({ error: "Name and PIN required" }, { status: 400 });
  }

  const staff = await prisma.staffAccount.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, active: true },
  });

  if (!staff || !(await bcrypt.compare(pin, staff.pin))) {
    return NextResponse.json({ error: "Invalid name or PIN" }, { status: 401 });
  }

  const token = await createStaffToken(staff.id);
  const res   = NextResponse.json({ success: true, name: staff.name, role: staff.role });
  res.cookies.set("staff_token", token, getStaffCookieOptions());
  return res;
}
