"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Building2, ChevronDown, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiPath } from "@/lib/api-path";
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

interface Factory {
  FactoryCode: string;
  FactoryName: string;
}

export function AppHeader({ username, factory, isAdmin }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<PageTab[]>([]);
  const [factoryDropdownOpen, setFactoryDropdownOpen] = useState(false);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [switching, setSwitching] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Factory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    await fetch(apiPath("/api/auth/logout"), { method: "POST" });
    localStorage.removeItem(STORAGE_KEY);
    router.push("/login");
    router.refresh();
  };

  // 마운트 시 공장 목록 미리 로드 (이름 표시 + 드롭다운 즉시 열기용)
  useEffect(() => {
    if (!factory || isAdmin) return;
    fetch(apiPath("/api/factories"))
      .then((r) => r.json())
      .then((data) => { if (data.ok) setFactories(data.factories ?? []); })
      .catch(() => {});
  }, [factory, isAdmin]);

  const handleFactoryClick = () => {
    setFactoryDropdownOpen((prev) => !prev);
  };

  const handleSelectFactory = (target: Factory) => {
    if (target.FactoryCode === factory || switching) return;
    setFactoryDropdownOpen(false);
    setConfirmTarget(target);
  };

  const handleConfirmSwitch = async () => {
    if (!confirmTarget) return;
    setSwitching(true);
    setConfirmTarget(null);
    try {
      const res = await fetch(apiPath("/api/auth/switch-factory"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory: confirmTarget.FactoryCode }),
      });
      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/dashboard";
      }
    } finally {
      setSwitching(false);
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!factoryDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFactoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [factoryDropdownOpen]);

  return (
    <>
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
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
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
            <span className="font-medium text-foreground">
              {username}
              {isAdmin && (
                <span className="ml-1 text-[11px] text-amber-500">(관리자)</span>
              )}
            </span>
            {!isAdmin && factory && (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={handleFactoryClick}
                  disabled={switching}
                  className="flex items-center gap-0.5 text-[11px] text-foreground/60 hover:text-foreground transition-colors"
                >
                  {(() => {
                    const match = factories.find((f) => f.FactoryCode === factory);
                    return <span>{match ? `${factory} - ${match.FactoryName}` : factory}</span>;
                  })()}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", factoryDropdownOpen && "rotate-180")} />
                </button>
                {factoryDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border bg-background shadow-lg py-1">
                    {factories.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">공장 없음</div>
                    ) : (
                      factories.map((f) => (
                        <button
                          key={f.FactoryCode}
                          type="button"
                          onClick={() => handleSelectFactory(f)}
                          className={cn(
                            "w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors",
                            f.FactoryCode === factory && "font-semibold text-primary"
                          )}
                        >
                          {f.FactoryName}
                          {f.FactoryCode === factory && <span className="ml-1 text-[10px]">(현재)</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/70 hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground/70 hover:text-foreground"
          aria-label="로그아웃"
          title="로그아웃"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>

    {/* 사업장 변경 확인 다이얼로그 */}
    {confirmTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-[340px] rounded border bg-background shadow-xl">
          {/* 타이틀 바 */}
          <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
            <span className="text-xs font-semibold">사업장 변경 확인</span>
          </div>
          {/* 본문 */}
          <div className="px-5 py-4 text-sm leading-relaxed">
            <p className="font-medium">사업장 변경 작업을 하시겠습니까?</p>
            <p className="mt-1 text-muted-foreground">사업장을 변경하면 현재 열린화면은 모두 닫힙니다.</p>
            <p className="mt-1 text-muted-foreground">
              (※ 현재사업장 : {factory} &rarr; 변경사업장 : {confirmTarget.FactoryCode})
            </p>
          </div>
          {/* 버튼 */}
          <div className="flex justify-center gap-3 border-t px-5 py-3">
            <button
              type="button"
              onClick={handleConfirmSwitch}
              className="min-w-[72px] rounded border bg-muted px-4 py-1.5 text-xs font-medium hover:bg-muted/80 active:scale-95 transition-all"
            >
              예
            </button>
            <button
              type="button"
              onClick={() => setConfirmTarget(null)}
              className="min-w-[72px] rounded border bg-muted px-4 py-1.5 text-xs font-medium hover:bg-muted/80 active:scale-95 transition-all"
            >
              아니오
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
