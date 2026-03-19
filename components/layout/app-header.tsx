"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type PageTab,
  getPageLabel,
  usePageTabsTracker,
} from "@/lib/hooks/use-page-tabs";

const STORAGE_KEY = "page_tabs";

function loadTabs(): PageTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PageTab[]) : [];
  } catch {
    return [];
  }
}

function saveTabs(tabs: PageTab[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {}
}

interface AppHeaderProps {
  username?: string;
  factory?: string;
  isAdmin?: boolean;
}

export function AppHeader({ username, factory, isAdmin }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<PageTab[]>([]);

  // 현재 페이지를 탭에 추가
  usePageTabsTracker();

  // localStorage → 상태 동기화 (pathname 변경 시마다)
  useEffect(() => {
    setTabs(loadTabs());
  }, [pathname]);

  const handleClose = (href: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = tabs.filter((t) => t.href !== href);
    saveTabs(next);
    setTabs(next);

    // 닫은 탭이 현재 탭이면 인접 탭으로 이동
    if (href === pathname) {
      const idx = tabs.findIndex((t) => t.href === href);
      const target = next[idx] ?? next[idx - 1] ?? null;
      if (target) router.push(target.href);
      else router.push("/dashboard");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* 탭 목록 */}
      <div className="flex flex-1 items-center overflow-x-auto scrollbar-none h-full">
        {tabs.length === 0 ? (
          <span className="px-4 text-xs text-muted-foreground select-none">
            메뉴를 선택하면 탭이 표시됩니다.
          </span>
        ) : (
          tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => router.push(tab.href)}
                className={cn(
                  "group relative flex h-full shrink-0 items-center gap-2 border-r px-4 text-xs transition-colors select-none",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="max-w-[120px] truncate">{tab.label}</span>
                <span
                  role="button"
                  aria-label="탭 닫기"
                  onClick={(e) => handleClose(tab.href, e)}
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "hover:bg-primary-foreground/20"
                      : "opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20"
                  )}
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* 우측 사용자 정보 + 버튼 */}
      <div className="flex shrink-0 items-center gap-2 px-4 border-l">
        {username && (
          <div className="flex flex-col items-end leading-tight text-xs">
            <span className="font-medium text-slate-900">
              {username}
              {isAdmin && (
                <span className="ml-1 text-[11px] text-amber-600">(관리자)</span>
              )}
            </span>
            {!isAdmin && factory && (
              <span className="text-[11px] text-muted-foreground">
                공장: {factory}
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="로그아웃"
          title="로그아웃"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
