import { NextResponse } from "next/server";
import { signToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDbPool } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const ADMIN_USERNAME = process.env.AUTH_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.AUTH_PASSWORD ?? "admin1234";

const MAX_AGE = 8 * 60 * 60; // 8시간 (초)

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: false,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, factory } = body ?? {};

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const trimmedUsername = username.trim();

    // ── 관리자 계정: 공장 선택 불필요 ──
    if (trimmedUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = await signToken(trimmedUsername, "");
      const res = NextResponse.json({ ok: true, isAdmin: true });
      setSessionCookie(res, token);
      return res;
    }

    // ── 일반 사용자 ──
    const pool = await getDbPool();

    const userResult = await pool
      .request()
      .input("Username", trimmedUsername)
      .query(`
        SELECT Id, Password, FactoryCode
        FROM dbo.AppUser
        WHERE Username = @Username AND IsActive = 1
      `);

    const user = userResult.recordset[0];

    const passwordMatch = user ? await verifyPassword(password, user.Password) : false;
    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (!factory) {
      return NextResponse.json(
        { ok: false, message: "공장을 선택해 주세요." },
        { status: 400 }
      );
    }

    const token = await signToken(trimmedUsername, factory as string);
    const res = NextResponse.json({ ok: true, isAdmin: false });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { ok: false, message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
