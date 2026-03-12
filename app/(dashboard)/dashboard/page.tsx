import dynamic from "next/dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { dashboardData } from "@/lib/mock/dashboard";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { DashboardKPICards } from "@/components/dashboard/dashboard-kpi-cards";
import { RecentPOTable } from "@/components/dashboard/recent-po-table";
import { DelayAlertCard } from "@/components/dashboard/delay-alert-card";
import { DashboardSummaryWidgets } from "@/components/dashboard/dashboard-summary-widgets";

const MonthlySpendChart = dynamic(
  () => import("@/components/dashboard/monthly-spend-chart").then((m) => m.MonthlySpendChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

const SupplierSpendChart = dynamic(
  () => import("@/components/dashboard/supplier-spend-chart").then((m) => m.SupplierSpendChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function DashboardPage() {
  const {
    kpis,
    monthlySpend,
    supplierSpend,
    recentPOs,
    delayedPOs,
    topSuppliers,
    topItems,
    pendingActions,
  } = dashboardData;

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
