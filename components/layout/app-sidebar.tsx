"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PackageSearch,
  Truck,
  BarChart3,
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Car,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const topNavItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
];

const masterNavGroup = {
  label: "기준정보 관리",
  icon: FolderOpen,
  children: [
    { href: "/items", label: "품목관리", icon: PackageSearch },
    { href: "/model-codes", label: "모델코드 관리", icon: Car },
    { href: "/purchasers", label: "구매처 관리", icon: Building2 },
    { href: "/purchase-prices", label: "구매단가 관리", icon: FileText },
  ],
};

const purchaseOrderNavGroup = {
  label: "구매오더",
  icon: FileText,
  children: [
    { href: "/purchase-orders", label: "구매오더 현황", icon: FileText },
    { href: "/purchase-orders/create", label: "신규 구매오더", icon: FileText },
  ],
};

const performanceNavGroup = {
  label: "구매실적관리",
  icon: BarChart3,
  children: [
    { href: "/purchase-orders/performance", label: "구매실적관리", icon: BarChart3 },
    { href: "/purchase-orders/performance/receipts", label: "발주대비 입고현황", icon: FileText },
    { href: "/purchase-orders/performance/closing", label: "마감현황", icon: FileText },
  ],
};

const settingsNavGroup = {
  label: "설정",
  icon: Settings,
  children: [
    {
      href: "/settings/common-codes",
      label: "공통코드 관리",
      icon: Settings,
    },
    {
      href: "/settings/display",
      label: "화면 설정",
      icon: LayoutDashboard,
    },
  ],
};

const bottomNavItems = [
  { href: "/suppliers", label: "공급사", icon: Truck },
  { href: "/analytics", label: "분석", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isMasterActive =
    pathname.startsWith("/items") ||
    pathname.startsWith("/model-codes") ||
    pathname.startsWith("/purchasers");
  const isPoActive = pathname.startsWith("/purchase-orders");
  const isPerformanceActive = pathname.startsWith("/purchase-orders/performance");
  const isSettingsActive = pathname.startsWith("/settings");
  const [masterOpen, setMasterOpen] = useState(isMasterActive);
  const [poOpen, setPoOpen] = useState(isPoActive);
  const [performanceOpen, setPerformanceOpen] = useState(isPerformanceActive);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);
  useEffect(() => {
    if (isMasterActive) setMasterOpen(true);
  }, [isMasterActive]);
  useEffect(() => {
    if (isPoActive) setPoOpen(true);
  }, [isPoActive]);
  useEffect(() => {
    if (isPerformanceActive) setPerformanceOpen(true);
  }, [isPerformanceActive]);
  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
  }, [isSettingsActive]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <span className="text-lg text-primary">JYPurch</span>
          <span className="text-xs text-muted-foreground">
            구매관리 플랫폼
          </span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {topNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* 기준정보 관리 (상위) + 품목관리 (하위) */}
        <div className="py-1">
          <button
            type="button"
            onClick={() => setMasterOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isMasterActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <masterNavGroup.icon className="h-5 w-5 shrink-0" />
              <span>{masterNavGroup.label}</span>
            </div>
            {masterOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {masterOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
              {masterNavGroup.children.map((child) => {
                const isChildActive =
                  pathname === child.href || pathname.startsWith(child.href);
                const Icon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {/* 구매오더 그룹: 현황 / 신규 */}
        <div className="py-1">
          <button
            type="button"
            onClick={() => setPoOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isPoActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <purchaseOrderNavGroup.icon className="h-5 w-5 shrink-0" />
              <span>{purchaseOrderNavGroup.label}</span>
            </div>
            {poOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {poOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
              {purchaseOrderNavGroup.children.map((child) => {
                const isChildActive = pathname === child.href;
                const Icon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 구매실적관리 그룹: 실적 / 발주대비 입고현황 */}
        <div className="py-1">
          <button
            type="button"
            onClick={() => setPerformanceOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isPerformanceActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <performanceNavGroup.icon className="h-5 w-5 shrink-0" />
              <span>{performanceNavGroup.label}</span>
            </div>
            {performanceOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {performanceOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
              {performanceNavGroup.children.map((child) => {
                const isChildActive = pathname === child.href;
                const Icon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* 설정 그룹: 공통코드 관리 등 (맨 아래) */}
        <div className="py-1">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isSettingsActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <settingsNavGroup.icon className="h-5 w-5 shrink-0" />
              <span>{settingsNavGroup.label}</span>
            </div>
            {settingsOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {settingsOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
              {settingsNavGroup.children.map((child) => {
                const isChildActive = pathname === child.href;
                const Icon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
