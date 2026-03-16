import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "plancome_session";

function getSecret(): string {
  return process.env.AUTH_SECRET || "default-dev-secret";
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(value);
  const expected = `${value}.${hmac.digest("hex")}`;
  if (expected === signed) return value;
  return null;
}

function isTokenValid(token: string): boolean {
  const raw = verify(token);
  if (!raw) return false;
  try {
    const payload = JSON.parse(Buffer.from(raw, "base64").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token || !isTokenValid(token)) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
