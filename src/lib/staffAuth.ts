import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const STAFF_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "gweru-gamers-lounge-staff-secret"
);
const COOKIE = "staff_token";

export async function createStaffToken(staffId: string): Promise<string> {
  return new SignJWT({ sub: staffId, role: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(STAFF_SECRET);
}

export async function verifyStaffToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, STAFF_SECRET);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function requireStaff(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function requireAdminOrStaff(request: NextRequest): Promise<boolean> {
  // Check admin cookie first
  const adminToken = request.cookies.get("admin_token")?.value;
  if (adminToken) {
    try {
      await jwtVerify(
        adminToken,
        new TextEncoder().encode(process.env.JWT_SECRET ?? "gweru-gamers-lounge-secret")
      );
      return true;
    } catch {}
  }

  // Fall back to staff token
  const staffPayload = await requireStaff(request);
  return staffPayload !== null;
}

export async function verifyStaffPin(
  pin: string,
  staffId: string
): Promise<boolean> {
  const staff = await prisma.staffAccount.findUnique({ where: { id: staffId } });
  if (!staff || !staff.active) return false;
  return bcrypt.compare(pin, staff.pin);
}

export function getStaffCookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   60 * 60 * 12, // 12 hours
  };
}
