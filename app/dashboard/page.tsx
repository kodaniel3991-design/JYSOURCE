/**
 * 구매 대시보드 페이지
 * - KPI 카드, 월별/공급사별 차트, 최근 PO·납기지연·요약 위젯을 표시합니다.
 */
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { DashboardKPICards } from "@/components/dashboard/dashboard-kpi-cards";
import { RecentPOTable } from "@/components/dashboard/recent-po-table";
import { DelayAlertCard } from "@/components/dashboard/delay-alert-card";
import { DashboardSummaryWidgets } from "@/components/dashboard/dashboard-summary-widgets";
import { apiPath } from "@/lib/api-path";

/** 차트는 클라이언트 전용(차트 라이브러리)이므로 dynamic import, 로딩 시 스켈레톤 표시 */
const MonthlySpendChart = dynamic(
  () => import("@/components/dashboard/monthly-spend-chart").then((m) => m.MonthlySpendChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

const SupplierSpendChart = dynamic(
  () => import("@/components/dashboard/supplier-spend-chart").then((m) => m.SupplierSpendChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

const defaultDashboardData = {
  periodYearMonth: "2024-04",
  kpis: { monthlySpend: 0, orderCount: 0, pendingReceipt: 0, delayedCount: 0 },
  monthlySpend: [] as { month: string; amount: number }[],
  supplierSpend: [] as { name: string; value: number; percentage: number }[],
  recentPOs: [] as PurchaseOrderSummary[],
  delayedPOs: [] as { poNumber: string; supplierName: string; itemName: string; dueDate: string; delayDays: number; severity: string }[],
  topSuppliers: [] as { name: string; amount: number; share: number }[],
  topItems: [] as { itemName: string; category: string; orderCount: number; amount: number }[],
  pendingActions: [] as { type: string; label: string; count: number }[],
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath("/api/dashboard"))
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.ok) setDashboardData(data as typeof defaultDashboardData);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const {
    periodYearMonth = "2024-04",
    kpis = { monthlySpend: 0, orderCount: 0, pendingReceipt: 0, delayedCount: 0 },
    monthlySpend = [],
    supplierSpend = [],
    recentPOs = [],
    delayedPOs = [],
    topSuppliers = [],
    topItems = [],
    pendingActions = [],
  } = dashboardData;

  const [y, m] = String(periodYearMonth).split("-");
  const periodLabel = y && m ? `${y}년 ${parseInt(m, 10)}월` : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        title="구매 대시보드"
        description="구매오더, 공급사별 지출, 납기 리스크와 운영 현황을 한눈에 모니터링합니다."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
            <Link href="/purchase-orders/create">
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                신규 구매오더
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          모니터링 현황 <span className="font-medium text-foreground">({periodLabel})</span>
        </h2>
      </div>

      <DashboardKPICards
        monthlySpend={kpis.monthlySpend}
        orderCount={kpis.orderCount}
        pendingReceipt={kpis.pendingReceipt}
        delayedCount={kpis.delayedCount}
      />

      <section className="grid gap-6 lg:grid-cols-7">
        <MonthlySpendChart data={monthlySpend} />
        <SupplierSpendChart data={supplierSpend} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <RecentPOTable data={recentPOs as PurchaseOrderSummary[]} />
        <DelayAlertCard
          items={delayedPOs.map((d) => ({
            poNumber: d.poNumber,
            supplierName: d.supplierName,
            itemName: d.itemName,
            dueDate: d.dueDate,
            delayDays: d.delayDays,
            severity: d.severity as "low" | "medium" | "high",
          }))}
        />
      </section>

      <DashboardSummaryWidgets
        topSuppliers={topSuppliers}
        topItems={topItems}
        pendingActions={pendingActions}
      />
    </div>
  );
}
