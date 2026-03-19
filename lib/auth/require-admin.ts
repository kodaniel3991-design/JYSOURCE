import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";
import { NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.AUTH_USERNAME ?? "admin";

/** API 라우트에서 관리자 인증 확인. 비관리자면 401 Response 반환 */
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;

  if (!session || session.username !== ADMIN_USERNAME) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "관리자 권한이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  return { ok: true };
}
