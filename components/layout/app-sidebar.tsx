"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PackageSearch,
  BarChart3,
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Car,
  Building2,
  ShieldCheck,
  Users,
  Factory,
  Shapes,
  Layers,
  PackageCheck,
  Truck,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeftRight,
  ClipboardList,
  CalendarRange,
  Receipt,
  Star,
  PanelTopOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/hooks/use-favorites";

const PAGE_TABS_KEY = "page_tabs";

const topNavItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
];

const masterNavGroup = {
  label: "기준정보 관리",
  icon: FolderOpen,
  children: [
    { href: "/purchase-prices", label: "구매단가 관리", icon: FileText },
    { href: "/purchasers", label: "구매처 관리", icon: Building2 },
    { href: "/model-codes", label: "모델코드 관리", icon: Car },
    { href: "/items", label: "품목관리", icon: PackageSearch },
    { href: "/item-types", label: "품목유형 관리", icon: Layers },
    { href: "/item-type-codes", label: "품목형태코드 관리", icon: Shapes },
  ],
};

const purchaseOrderNavGroup = {
  label: "구매오더 관리",
  icon: FileText,
  children: [
    { href: "/purchase-orders/create",                label: "구매오더 관리",    icon: FileText },
    { href: "/purchase-orders",                       label: "구매오더 현황",    icon: FileText },
    { href: "/purchase-orders/price-verification",    label: "단가변경 교차검증", icon: ArrowLeftRight },
  ],
};

const receiptNavGroup = {
  label: "구매입고관리",
  icon: Truck,
  children: [
    { href: "/purchase-receipts",        label: "구매입고처리",     icon: PackageCheck },
    { href: "/purchase-receipts/returns", label: "반품처리",        icon: RotateCcw },
    { href: "/purchase-receipts/status",  label: "입고현황 조회/출력",   icon: ClipboardList },
    { href: "/purchase-receipts/period",  label: "기간별 구매입고현황", icon: CalendarRange },
  ],
};

const performanceNavGroup = {
  label: "구매실적관리",
  icon: BarChart3,
  children: [
    { href: "/purchase-orders/performance/purchase-input", label: "매입 실적 관리", icon: Receipt },
    { href: "/purchase-orders/performance/receipts", label: "발주대비 입고현황", icon: FileText },
    { href: "/purchase-orders/performance/closing", label: "마감현황", icon: FileText },
  ],
};

const settingsNavGroup = {
  label: "설정",
  icon: Settings,
  children: [
    { href: "/settings/common-codes", label: "공통코드 관리", icon: Settings },
    { href: "/settings/display", label: "화면 설정", icon: LayoutDashboard },
  ],
};

const bottomNavItems = [
  { href: "/analytics", label: "분석", icon: BarChart3 },
];

const adminNavGroup = {
  label: "시스템 관리",
  icon: ShieldCheck,
  children: [
    { href: "/admin/users", label: "사용자 관리", icon: Users },
    { href: "/admin/factories", label: "공장 관리", icon: Factory },
  ],
};

interface AppSidebarProps {
  isAdmin?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({ isAdmin = false, collapsed = false, onToggle, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { favorites, isFavorite, toggle } = useFavorites();

  const openAllFavorites = () => {
    if (favorites.length === 0) return;
    try {
      const raw = localStorage.getItem(PAGE_TABS_KEY);
      const existing: { href: string; label: string }[] = raw ? JSON.parse(raw) : [];
      const merged = [...existing];
      for (const fav of favorites) {
        if (!merged.find((t) => t.href === fav.href)) {
          merged.push({ href: fav.href, label: fav.label });
        }
      }
      // 최대 10개 유지
      const trimmed = merged.slice(-10);
      localStorage.setItem(PAGE_TABS_KEY, JSON.stringify(trimmed));
    } catch {}
    router.push(favorites[0].href);
    onNavigate?.();
  };
  const isMasterActive =
    pathname.startsWith("/items") ||
    pathname.startsWith("/model-codes") ||
    pathname.startsWith("/item-type-codes") ||
    pathname.startsWith("/item-types") ||
    pathname.startsWith("/purchasers") ||
    pathname.startsWith("/purchase-prices");
  const isPoActive = pathname.startsWith("/purchase-orders");
  const isReceiptActive = pathname.startsWith("/purchase-receipts");
  const isPerformanceActive = pathname.startsWith("/purchase-orders/performance");
  const isSettingsActive = pathname.startsWith("/settings");
  const isAdminActive = pathname.startsWith("/admin");

  const [masterOpen, setMasterOpen] = useState(isMasterActive);
  const [poOpen, setPoOpen] = useState(isPoActive);
  const [receiptOpen, setReceiptOpen] = useState(isReceiptActive);
  const [performanceOpen, setPerformanceOpen] = useState(isPerformanceActive);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  useEffect(() => { if (isMasterActive) setMasterOpen(true); }, [isMasterActive]);
  useEffect(() => { if (isPoActive) setPoOpen(true); }, [isPoActive]);
  useEffect(() => { if (isReceiptActive) setReceiptOpen(true); }, [isReceiptActive]);
  useEffect(() => { if (isPerformanceActive) setPerformanceOpen(true); }, [isPerformanceActive]);
  useEffect(() => { if (isSettingsActive) setSettingsOpen(true); }, [isSettingsActive]);
  useEffect(() => { if (isAdminActive) setAdminOpen(true); }, [isAdminActive]);

  // 접힌 상태에서 아이콘 클릭 → 사이드바 펼치기
  const renderCollapsedIcon = (Icon: React.ElementType, label: string, isActive: boolean) => (
    <button
      key={label}
      type="button"
      title={label}
      onClick={onToggle}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  const renderCollapsedGroup = (
    GroupIcon: React.ElementType,
    groupLabel: string,
    isActive: boolean,
  ) => (
    <button
      key={groupLabel}
      type="button"
      title={groupLabel}
      onClick={onToggle}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <GroupIcon className="h-5 w-5" />
    </button>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-[width] duration-300 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* 로고 + 토글 버튼 */}
      <div className="flex h-16 items-center border-b px-3">
        {!collapsed && (
          <Link href="/dashboard" className="flex flex-1 items-center gap-2 font-semibold overflow-hidden">
            <span className="text-lg text-primary whitespace-nowrap">JYPurch</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">구매관리 플랫폼</span>
          </Link>
        )}
        {collapsed && <div className="flex-1" />}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* 접힌 상태 */}
      {collapsed && (
        <nav className="flex flex-col items-center gap-1 p-2 pt-3">
          {favorites.length > 0 && (
            <button
              type="button"
              title="즐겨찾기 전체 열기"
              onClick={openAllFavorites}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-amber-400 hover:bg-muted transition-colors"
            >
              <Star className="h-5 w-5 fill-amber-400" />
            </button>
          )}
          {topNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return renderCollapsedIcon(item.icon, item.label, isActive);
          })}
          {renderCollapsedGroup(masterNavGroup.icon, masterNavGroup.label, isMasterActive)}
          {renderCollapsedGroup(purchaseOrderNavGroup.icon, purchaseOrderNavGroup.label, isPoActive && !isPerformanceActive)}
          {renderCollapsedGroup(receiptNavGroup.icon, receiptNavGroup.label, isReceiptActive)}
          {renderCollapsedGroup(performanceNavGroup.icon, performanceNavGroup.label, isPerformanceActive)}
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return renderCollapsedIcon(item.icon, item.label, isActive);
          })}
          {isAdmin && renderCollapsedGroup(adminNavGroup.icon, adminNavGroup.label, isAdminActive)}
          {renderCollapsedGroup(settingsNavGroup.icon, settingsNavGroup.label, isSettingsActive)}
        </nav>
      )}

      {/* 펼친 상태 */}
      {!collapsed && (
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* ── 즐겨찾기 섹션 ── */}
          {favorites.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  즐겨찾기
                </div>
                <button
                  type="button"
                  title="즐겨찾기 전체 열기"
                  onClick={openAllFavorites}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PanelTopOpen className="h-3 w-3" />
                  전체 열기
                </button>
              </div>
              <div className="ml-4 flex flex-col gap-0.5 border-l border-amber-200 dark:border-amber-800/50 pl-2">
                {favorites.map((fav) => {
                  const isActive = pathname === fav.href;
                  return (
                    <Link
                      key={fav.href}
                      href={fav.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      {fav.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {topNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {/* 기준정보 관리 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setMasterOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isMasterActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <masterNavGroup.icon className="h-5 w-5 shrink-0" />
                <span>{masterNavGroup.label}</span>
              </div>
              {masterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {masterOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                {masterNavGroup.children.map((child) => {
                  const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                  const Icon = child.icon;
                  const starred = isFavorite(child.href);
                  return (
                    <div key={child.href} className="group flex items-center">
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                      <button
                        type="button"
                        title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggle({ href: child.href, label: child.label })}
                        className={cn(
                          "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          "hover:bg-muted"
                        )}
                      >
                        <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 구매오더 관리 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setPoOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isPoActive && !isPerformanceActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <purchaseOrderNavGroup.icon className="h-5 w-5 shrink-0" />
                <span>{purchaseOrderNavGroup.label}</span>
              </div>
              {poOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {poOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                {purchaseOrderNavGroup.children.map((child) => {
                  const isChildActive = pathname === child.href;
                  const Icon = child.icon;
                  const starred = isFavorite(child.href);
                  return (
                    <div key={child.href} className="group flex items-center">
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                      <button
                        type="button"
                        title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggle({ href: child.href, label: child.label })}
                        className={cn(
                          "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          "hover:bg-muted"
                        )}
                      >
                        <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 구매입고관리 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setReceiptOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isReceiptActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <receiptNavGroup.icon className="h-5 w-5 shrink-0" />
                <span>{receiptNavGroup.label}</span>
              </div>
              {receiptOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {receiptOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                {receiptNavGroup.children.map((child) => {
                  const isChildActive = pathname === child.href;
                  const Icon = child.icon;
                  const starred = isFavorite(child.href);
                  return (
                    <div key={child.href} className="group flex items-center">
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                      <button
                        type="button"
                        title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggle({ href: child.href, label: child.label })}
                        className={cn(
                          "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          "hover:bg-muted"
                        )}
                      >
                        <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 구매실적관리 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setPerformanceOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isPerformanceActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <performanceNavGroup.icon className="h-5 w-5 shrink-0" />
                <span>{performanceNavGroup.label}</span>
              </div>
              {performanceOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {performanceOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                {performanceNavGroup.children.map((child) => {
                  const isChildActive = pathname === child.href;
                  const Icon = child.icon;
                  const starred = isFavorite(child.href);
                  return (
                    <div key={child.href} className="group flex items-center">
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                      <button
                        type="button"
                        title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggle({ href: child.href, label: child.label })}
                        className={cn(
                          "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          "hover:bg-muted"
                        )}
                      >
                        <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 분석 */}
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {/* 시스템 관리 (관리자 전용) */}
          {isAdmin && (
            <div className="py-1">
              <button
                type="button"
                onClick={() => setAdminOpen((o) => !o)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isAdminActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <adminNavGroup.icon className="h-5 w-5 shrink-0" />
                  <span>{adminNavGroup.label}</span>
                </div>
                {adminOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              </button>
              {adminOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                  {adminNavGroup.children.map((child) => {
                    const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                    const Icon = child.icon;
                    const starred = isFavorite(child.href);
                    return (
                      <div key={child.href} className="group flex items-center">
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                            isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {child.label}
                        </Link>
                        <button
                          type="button"
                          title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          onClick={() => toggle({ href: child.href, label: child.label })}
                          className={cn(
                            "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                            starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                            "hover:bg-muted"
                          )}
                        >
                          <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 설정 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isSettingsActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <settingsNavGroup.icon className="h-5 w-5 shrink-0" />
                <span>{settingsNavGroup.label}</span>
              </div>
              {settingsOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {settingsOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
                {settingsNavGroup.children.map((child) => {
                  const isChildActive = pathname === child.href;
                  const Icon = child.icon;
                  const starred = isFavorite(child.href);
                  return (
                    <div key={child.href} className="group flex items-center">
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isChildActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                      <button
                        type="button"
                        title={starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggle({ href: child.href, label: child.label })}
                        className={cn(
                          "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-opacity",
                          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          "hover:bg-muted"
                        )}
                      >
                        <Star className={cn("h-3.5 w-3.5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      )}
    </aside>
  );
}
