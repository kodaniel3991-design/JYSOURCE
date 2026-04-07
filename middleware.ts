/**
 * Next.js 미들웨어 — 모든 요청에 앞서 실행되어 인증 및 접근 권한을 제어한다.
 *
 * 동작 순서:
 * 1. 정적 파일·API 라우트는 인증 없이 통과시킨다.
 * 2. 세션 쿠키를 검증하여 로그인 상태를 확인한다.
 * 3. 이미 로그인된 사용자가 /login 에 접근하면 역할에 맞는 홈으로 리다이렉트한다.
 * 4. 미인증 사용자가 보호된 경로에 접근하면 /login 으로 리다이렉트한다.
 * 5. /admin 하위 경로는 관리자 계정만 접근할 수 있다.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

// 환경변수에 설정된 관리자 아이디 (기본값: "admin")
const ADMIN_USERNAME = process.env.AUTH_USERNAME ?? "admin";

// 모든 페이지 요청에서 실행되는 미들웨어 함수
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 라우트(auth 제외)나 정적 파일은 그냥 통과
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 쿠키에서 세션 토큰을 읽고 서명을 검증하여 세션 정보를 추출한다
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;

  // 이미 로그인 상태에서 /login 접근 → 역할에 맞는 홈으로
  if (pathname === "/login" && session) {
    const home = session.username === ADMIN_USERNAME ? "/admin/users" : "/dashboard";
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = home;
    return NextResponse.redirect(homeUrl);
  }

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 미인증 → 로그인 페이지로
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // /admin 경로는 관리자 전용 — 일반 사용자는 /dashboard 로 이동
  if (pathname.startsWith("/admin") && session.username !== ADMIN_USERNAME) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

// favicon, 정적 에셋을 제외한 모든 경로에 미들웨어를 적용한다
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
