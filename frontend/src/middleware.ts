import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "plancome_session";

function getSecret(): string {
  return process.env.AUTH_SECRET || "default-dev-secret";
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const expected = `${value}.${await hmacSign(value, getSecret())}`;
  if (expected === signed) return value;
  return null;
}

async function isTokenValid(token: string): Promise<boolean> {
  const raw = await verify(token);
  if (!raw) return false;
  try {
    const payload = JSON.parse(atob(raw));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token || !(await isTokenValid(token))) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
