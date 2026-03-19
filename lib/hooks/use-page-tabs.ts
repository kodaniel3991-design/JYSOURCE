"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export type PageTab = {
  href: string;
  label: string;
};

/** pathname → 표시 라벨 매핑 (사이드바 메뉴 기준) */
const ROUTE_LABELS: { pattern: RegExp | string; label: string }[] = [
  { pattern: "/dashboard",                                 label: "대시보드" },
  { pattern: "/purchase-orders/create",                    label: "신규 구매오더" },
  { pattern: "/purchase-orders/performance/receipts",      label: "발주대비 입고현황" },
  { pattern: "/purchase-orders/performance/closing",       label: "마감현황" },
  { pattern: "/purchase-orders/performance",               label: "구매실적관리" },
  { pattern: /^\/purchase-orders\/[^/]+$/,                 label: "구매오더 상세" },
  { pattern: "/purchase-orders",                           label: "구매오더 현황" },
  { pattern: "/purchase-prices",                           label: "구매단가 관리" },
  { pattern: "/purchasers",                                label: "구매처 관리" },
  { pattern: "/model-codes",                               label: "모델코드 관리" },
  { pattern: "/item-type-codes",                           label: "품목형태코드 관리" },
  { pattern: "/item-types",                                label: "품목유형 관리" },
  { pattern: "/items",                                     label: "품목관리" },
  { pattern: "/settings/common-codes",                     label: "공통코드 관리" },
  { pattern: "/settings/display",                          label: "화면 설정" },
  { pattern: "/admin/users",                               label: "사용자 관리" },
  { pattern: "/admin/factories",                           label: "공장 관리" },
  { pattern: "/analytics",                                 label: "분석" },
];

export function getPageLabel(pathname: string): string | null {
  for (const { pattern, label } of ROUTE_LABELS) {
    if (typeof pattern === "string") {
      if (pathname === pattern) return label;
    } else {
      if (pattern.test(pathname)) return label;
    }
  }
  // prefix 매칭 (정확 일치 없을 때)
  for (const { pattern, label } of ROUTE_LABELS) {
    if (typeof pattern === "string" && pathname.startsWith(pattern)) return label;
  }
  return null;
}

const STORAGE_KEY = "page_tabs";
const MAX_TABS = 10;

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

/** 현재 pathname 변경 시 탭 목록 업데이트 (localStorage 기반) */
export function usePageTabsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const label = getPageLabel(pathname);
    if (!label) return;

    const tabs = loadTabs();
    const exists = tabs.find((t) => t.href === pathname);
    if (exists) return; // 이미 있으면 추가 안함

    const next: PageTab[] = [...tabs, { href: pathname, label }];
    if (next.length > MAX_TABS) next.shift(); // 오래된 탭 제거
    saveTabs(next);
  }, [pathname]);
}
