import { cookies } from "next/headers";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";

const ADMIN_USERNAME = process.env.AUTH_USERNAME ?? "admin";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: { username: string; factory: string } | null = null;
  let isAdmin = false;

  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value ?? "";
    session = token ? await verifyToken(token) : null;
    isAdmin = session?.username === ADMIN_USERNAME;
  } catch (e) {
    console.error("[DashboardLayout] session error", e);
  }

  try {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar isAdmin={isAdmin} />
        <div className="pl-64">
          <AppHeader
            username={session?.username}
            factory={session?.factory}
            isAdmin={isAdmin}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>
    );
  } catch (e) {
    console.error("[DashboardLayout] render error", e);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-sm text-muted-foreground">레이아웃을 불러오는 중 오류가 발생했습니다.</p>
        <Link href="/login" className="text-sm text-primary underline">
          로그인으로 이동
        </Link>
      </div>
    );
  }
}
