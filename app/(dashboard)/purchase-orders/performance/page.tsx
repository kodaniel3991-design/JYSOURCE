"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/common/filter-bar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchaseOrderSummaries } from "@/lib/mock/purchase-orders";
import { suppliers } from "@/lib/mock/suppliers";
import { dashboardData } from "@/lib/mock/dashboard";
import type { PurchaseOrderSummary } from "@/types/purchase";
import type { SelectOption } from "@/components/ui/select";

const supplierOptions: SelectOption[] = suppliers.map((s) => ({
  value: s.id,
  label: s.name,
}));

type SupplierSummaryRow = {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  totalAmount: number;
};

export default function PurchasePerformancePage() {
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return purchaseOrderSummaries.filter((po) => {
      const matchSearch =
        !search ||
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = !supplierId || po.supplierId === supplierId;

      const due = new Date(po.dueDate);
      const matchFrom = !fromDate || due >= new Date(fromDate);
      const matchTo = !toDate || due <= new Date(toDate);

      return matchSearch && matchSupplier && matchFrom && matchTo;
    });
  }, [search, supplierId, fromDate, toDate]);

  const totalAmount = filtered.reduce(
    (sum, po) => sum + po.totalAmount,
    0
  );

  const supplierSummary: SupplierSummaryRow[] = useMemo(() => {
    const map = new Map<string, SupplierSummaryRow>();
    for (const po of filtered) {
      const key = po.supplierId;
      const existing = map.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalAmount += po.totalAmount;
      } else {
        map.set(key, {
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          orderCount: 1,
          totalAmount: po.totalAmount,
        });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const totalOrders = purchaseOrderSummaries.length;
  const delayedOrders = dashboardData.delayedPOs.length;
  const onTimeRate =
    totalOrders === 0
      ? 0
      : Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="구매실적관리"
        description="기간·업체별 구매실적과 납입준수율을 모니터링합니다. (데모)"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              조회 건수
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              총 구매금액
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              납입 준수율 (데모)
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{onTimeRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              지연 건수 {delayedOrders}건 / 전체 {totalOrders}건 기준
            </p>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        searchPlaceholder="PO 번호, 공급사명 검색..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            type: "select",
            placeholder: "공급사",
            options: supplierOptions,
            value: supplierId,
            onChange: (v) => setSupplierId(v),
          },
          {
            type: "custom",
            children: (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                />
                <span className="self-center text-xs text-muted-foreground">
                  ~
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                />
              </div>
            ),
          },
        ]}
        onReset={() => {
          setSearch("");
          setSupplierId("");
          setFromDate("");
          setToDate("");
        }}
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            PO 목록
          </span>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<PurchaseOrderSummary>
              columns={[
                {
                  key: "poNumber",
                  header: "PO 번호",
                  minWidth: 120,
                  maxWidth: 140,
                },
                {
                  key: "supplierName",
                  header: "공급사",
                  minWidth: 160,
                  maxWidth: 220,
                },
                {
                  key: "itemCount",
                  header: "품목수",
                  minWidth: 80,
                  maxWidth: 80,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => `${row.itemCount}건`,
                },
                {
                  key: "totalAmount",
                  header: "발주금액",
                  minWidth: 140,
                  maxWidth: 160,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.totalAmount),
                },
                {
                  key: "dueDate",
                  header: "납기일",
                  minWidth: 110,
                  maxWidth: 110,
                  cell: (row) => formatDate(row.dueDate),
                },
              ]}
              data={filtered}
              keyExtractor={(row) => row.id}
              maxHeight="100%"
              emptyMessage="조건에 맞는 구매실적이 없습니다."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            업체별 구매실적 집계
          </span>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<SupplierSummaryRow>
              columns={[
                {
                  key: "supplierName",
                  header: "공급사",
                  minWidth: 160,
                  maxWidth: 220,
                },
                {
                  key: "orderCount",
                  header: "발주건수",
                  minWidth: 90,
                  maxWidth: 100,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => `${row.orderCount}건`,
                },
                {
                  key: "totalAmount",
                  header: "총 발주금액",
                  minWidth: 150,
                  maxWidth: 170,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.totalAmount),
                },
              ]}
              data={supplierSummary}
              keyExtractor={(row) => row.supplierId}
              maxHeight="100%"
              emptyMessage="조건에 맞는 업체별 실적이 없습니다."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

