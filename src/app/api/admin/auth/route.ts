import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signAdminToken, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/adminAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const DEFAULT_PASSWORD = "admin123";

export async function POST(request: NextRequest) {
  // 5 attempts per minute per IP
  const result = rateLimit(`admin-login:${clientIp(request)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const settings = await prisma.loungeSettings.findUnique({
      where: { id: "singleton" },
    });

    const stored = settings?.adminPassword ?? DEFAULT_PASSWORD;
    const isBcrypt = stored.startsWith("$2a$") || stored.startsWith("$2b$");

    let passwordOk: boolean;
    if (isBcrypt) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      // Plaintext — compare and upgrade to bcrypt on success
      passwordOk = password === stored;
      if (passwordOk) {
        const hash = await bcrypt.hash(password, 12);
        await prisma.loungeSettings.upsert({
          where: { id: "singleton" },
          update: { adminPassword: hash },
          create: { id: "singleton", adminPassword: hash },
        });
      }
    }

    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await signAdminToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
