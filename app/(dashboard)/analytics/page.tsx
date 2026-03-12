"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { KPICard } from "@/components/common/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/common/data-table";
import { formatCurrency } from "@/lib/utils";
import { analyticsData } from "@/lib/mock/analytics";
import type { SupplierAnalyticsRow } from "@/types/analytics";
import { Select, type SelectOption } from "@/components/ui/select";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

const LineSpendChart = dynamic(
  () => import("@/components/charts/line-spend-chart").then((m) => ({ default: m.LineSpendChart })),
  { ssr: false }
);
const BarSpendChart = dynamic(
  () => import("@/components/charts/bar-spend-chart").then((m) => ({ default: m.BarSpendChart })),
  { ssr: false }
);
const SupplierPieChart = dynamic(
  () => import("@/components/charts/supplier-pie-chart").then((m) => ({ default: m.SupplierPieChart })),
  { ssr: false }
);

const periodOptions: SelectOption[] = [
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("12m");

  const { kpis, monthlySpend, supplierSpend, categorySpend, supplierTable } =
    analyticsData;

  const pieData = categorySpend.map((c) => ({
    name: c.category,
    value: c.amount,
    percentage: c.percentage,
  }));

  const columns: Column<SupplierAnalyticsRow>[] = [
    { key: "supplierName", header: "공급사명" },
    {
      key: "totalSpend",
      header: "구매금액",
      cell: (row) => formatCurrency(row.totalSpend),
    },
    {
      key: "deliveryRate",
      header: "납기준수율",
      cell: (row) => `${row.deliveryRate}%`,
    },
    { key: "orderCount", header: "발주건수" },
    {
      key: "avgUnitPrice",
      header: "평균단가",
      cell: (row) => formatCurrency(row.avgUnitPrice),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Procurement Analytics"
        description="Analyze spend, suppliers, and delivery performance"
      />

      <FilterBar
        searchPlaceholder="Search..."
        filters={[
          {
            type: "select",
            placeholder: "Period",
            options: periodOptions,
            value: period,
            onChange: setPeriod,
          },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="총 구매금액"
          value={formatCurrency(kpis.totalSpend)}
          icon={DollarSign}
        />
        <KPICard
          title="활성 공급사 수"
          value={kpis.activeSuppliers}
          icon={Users}
        />
        <KPICard
          title="평균 납기준수율"
          value={`${kpis.avgDeliveryRate}%`}
          icon={Package}
        />
        <KPICard
          title="평균 발주금액"
          value={formatCurrency(kpis.avgOrderAmount)}
          icon={TrendingUp}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">월별 구매금액 추이</CardTitle>
            <p className="text-sm text-muted-foreground">Line chart</p>
          </CardHeader>
          <CardContent>
            <LineSpendChart data={monthlySpend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">공급사별 구매금액</CardTitle>
            <p className="text-sm text-muted-foreground">Bar chart</p>
          </CardHeader>
          <CardContent>
            <BarSpendChart data={supplierSpend} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">품목 카테고리별 구매 비중</CardTitle>
            <p className="text-sm text-muted-foreground">Pie chart</p>
          </CardHeader>
          <CardContent>
            <SupplierPieChart data={pieData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">납기 준수율</CardTitle>
            <p className="text-sm text-muted-foreground">Overall: {kpis.avgDeliveryRate}%</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-2xl font-bold">{kpis.avgDeliveryRate}%</span>
                <span className="text-xs text-muted-foreground">On-time</span>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Average delivery compliance rate across all suppliers for the selected period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">공급사 분석 테이블</CardTitle>
          <p className="text-sm text-muted-foreground">
            Spend, delivery rate, order count, and average unit price by supplier.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={supplierTable}
            keyExtractor={(row) => row.supplierName}
            resultCount={supplierTable.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}
