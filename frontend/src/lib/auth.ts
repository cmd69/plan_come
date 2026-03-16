import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "plancome_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "default-dev-secret";
}

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  if (sign(value) === signed) return value;
  return null;
}

export function checkCredentials(user: string, password: string): boolean {
  const validUser = process.env.AUTH_USER || "admin";
  const validPassword = process.env.AUTH_PASSWORD || "admin";
  return user === validUser && password === validPassword;
}

export async function createSession(): Promise<string> {
  const payload = JSON.stringify({ ts: Date.now(), exp: Date.now() + MAX_AGE * 1000 });
  const token = sign(Buffer.from(payload).toString("base64"));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return token;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const raw = verify(token);
  if (!raw) return false;

  try {
    const payload = JSON.parse(Buffer.from(raw, "base64").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
