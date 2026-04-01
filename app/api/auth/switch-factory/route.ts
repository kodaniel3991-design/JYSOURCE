import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, signToken, SESSION_COOKIE } from "@/lib/auth/session";

const MAX_AGE = 8 * 60 * 60;

export async function POST(request: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const { factory } = await request.json();
  if (!factory) {
    return NextResponse.json({ ok: false, message: "공장을 선택해 주세요." }, { status: 400 });
  }

  const newToken = await signToken(session.username, factory as string);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: false,
  });
  return res;
}
