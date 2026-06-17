import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "admin_token";
const ADMIN_LOGIN_PATH = "/admin/login";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.ADMIN_SECRET ?? "fallback-dev-secret-change-in-production"
  );
}

async function isValidAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Protect all admin pages except the login page
  if (pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || !(await isValidAdminToken(token))) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
