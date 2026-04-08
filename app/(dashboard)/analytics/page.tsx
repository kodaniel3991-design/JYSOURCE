"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { KPICard } from "@/components/common/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/common/data-table";
import { formatCurrency } from "@/lib/utils";
import type { SupplierAnalyticsRow } from "@/types/analytics";
import { Select, type SelectOption } from "@/components/ui/select";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";
import { apiPath } from "@/lib/api-path";

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
  { value: "6",  label: "최근 6개월" },
  { value: "12", label: "최근 12개월" },
];

type AnalyticsData = {
  kpis: { totalSpend: number; activeSuppliers: number; avgOrderAmount: number; avgDeliveryRate: number };
  monthlySpend: { month: string; amount: number }[];
  supplierSpend: { name: string; value: number }[];
  categorySpend: { category: string; amount: number; percentage: number }[];
  supplierTable: SupplierAnalyticsRow[];
};

const emptyData: AnalyticsData = {
  kpis: { totalSpend: 0, activeSuppliers: 0, avgOrderAmount: 0, avgDeliveryRate: 0 },
  monthlySpend: [], supplierSpend: [], categorySpend: [], supplierTable: [],
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("12");
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(apiPath(`/api/analytics?months=${period}`))
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setData({
          kpis:          d.kpis,
          monthlySpend:  d.monthlySpend  ?? [],
          supplierSpend: d.supplierSpend ?? [],
          categorySpend: d.categorySpend ?? [],
          supplierTable: d.supplierTable ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const pieData = data.categorySpend.map((c) => ({
    name: c.category, value: c.amount, percentage: c.percentage,
  }));

  const columns: Column<SupplierAnalyticsRow>[] = [
    { key: "supplierName", header: "공급사명" },
    { key: "totalSpend",   header: "구매금액",    cell: (row) => formatCurrency(row.totalSpend) },
    { key: "deliveryRate", header: "납기준수율",  cell: (row) => `${row.deliveryRate}%` },
    { key: "orderCount",   header: "발주건수" },
    { key: "avgUnitPrice", header: "평균단가",    cell: (row) => formatCurrency(row.avgUnitPrice) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="구매 분석"
        description="기간별 구매금액, 공급사별 현황, 납기 준수율을 분석합니다."
      />

      <div className="flex justify-end">
        <Select
          value={period}
          options={periodOptions}
          onChange={setPeriod}
          className="h-8 w-36 text-xs"
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="연간 구매금액"    value={loading ? "-" : formatCurrency(data.kpis.totalSpend)}      icon={DollarSign} />
        <KPICard title="활성 공급사 수"   value={loading ? "-" : String(data.kpis.activeSuppliers)}          icon={Users} />
        <KPICard title="평균 납기준수율"  value={loading ? "-" : `${data.kpis.avgDeliveryRate}%`}            icon={Package} />
        <KPICard title="평균 발주금액"    value={loading ? "-" : formatCurrency(data.kpis.avgOrderAmount)}   icon={TrendingUp} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">월별 구매금액 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">조회 중...</div>
            ) : (
              <LineSpendChart data={data.monthlySpend} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">공급사별 구매금액 TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">조회 중...</div>
            ) : (
              <BarSpendChart data={data.supplierSpend.map((s) => ({ supplierName: s.name, amount: s.value }))} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">품목유형별 구매 비중</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">조회 중...</div>
            ) : (
              <SupplierPieChart data={pieData} />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">납기 준수율</CardTitle>
            <p className="text-sm text-muted-foreground">입고예정일 기준: {data.kpis.avgDeliveryRate}%</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5 shrink-0">
                <span className="text-2xl font-bold">{loading ? "-" : `${data.kpis.avgDeliveryRate}%`}</span>
                <span className="text-xs text-muted-foreground">납기준수</span>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  선택 기간 내 실제 입고일이 입고예정일 이내인 건의 비율입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">공급사 분석 테이블</CardTitle>
          <p className="text-sm text-muted-foreground">구매금액, 납기준수율, 발주건수, 평균단가 (기간 내)</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">조회 중...</div>
          ) : (
            <DataTable
              columns={columns}
              data={data.supplierTable}
              keyExtractor={(row) => row.supplierName}
              resultCount={data.supplierTable.length}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
