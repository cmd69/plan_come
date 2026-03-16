import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { user, password } = await req.json();

  if (!checkCredentials(user, password)) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}
