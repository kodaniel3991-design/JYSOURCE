import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    username: session.username,
    factory: session.factory,
  });
}
