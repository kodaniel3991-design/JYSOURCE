"use client";

import { useMemo, useState, useEffect } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { getPageState } from "@/lib/page-state-cache";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/common/filter-bar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { Sheet, SheetContent, SheetHeader as SheetHdr, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { suppliers } from "@/lib/mock/suppliers";
import type { PurchaseOrderSummary } from "@/types/purchase";
import type { SelectOption } from "@/components/ui/select";
import { apiPath } from "@/lib/api-path";
import { DateInput } from "@/components/ui/date-input";

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
  const [list, setList] = useCachedState<PurchaseOrderSummary[]>("perf/list", []);
  const [loading, setLoading] = useState(!getPageState("perf/list"));
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");
  const [stripedRows, setStripedRows] = useState(true);
  const [search, setSearch] = useCachedState<string>("perf/search", "");
  const [supplierId, setSupplierId] = useCachedState<string>("perf/supplierId", "");
  const [fromDate, setFromDate] = useCachedState<string>("perf/fromDate", "");
  const [toDate, setToDate] = useCachedState<string>("perf/toDate", "");

  useEffect(() => {
    // 캐시된 데이터가 있으면 재조회 생략
    if (getPageState("perf/list")) return;
    let cancelled = false;
    setLoading(true);
    fetch(apiPath("/api/purchase-orders"))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.items) return;
        setList(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return list.filter((po) => {
      const matchSearch =
        !search ||
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = !supplierId || po.supplierId === supplierId;

      if (!po.dueDate) return matchSearch && matchSupplier;
      const due = new Date(po.dueDate);
      const matchFrom = !fromDate || due >= new Date(fromDate);
      const matchTo = !toDate || due <= new Date(toDate);

      return matchSearch && matchSupplier && matchFrom && matchTo;
    });
  }, [list, search, supplierId, fromDate, toDate]);

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

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const totalOrders = list.length;
  const delayedOrders = useMemo(
    () =>
      list.filter(
        (po) =>
          (po.status === "issued" || po.status === "confirmed" || po.status === "partial") &&
          po.dueDate &&
          po.dueDate < today
      ).length,
    [list, today]
  );
  const onTimeRate =
    totalOrders === 0
      ? 0
      : Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const header = ["PO번호","공급사","품목수","발주금액","납기일"];
    const rows = filtered.map((r) => [
      r.poNumber, r.supplierName, String(r.itemCount),
      String(r.totalAmount), r.dueDate ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const csv = [header.join(","), rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "purchase-performance.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <>
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
                <DateInput
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="self-center text-xs text-muted-foreground">
                  ~
                </span>
                <DateInput
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs"
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">PO 목록</span>
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
            onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
          />
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
              data={loading ? [] : filtered}
              keyExtractor={(row) => row.id}
              maxHeight="100%"
              emptyMessage={loading ? "조회 중..." : "조건에 맞는 구매실적이 없습니다."}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">업체별 구매실적 집계</span>
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
              data={loading ? [] : supplierSummary}
              keyExtractor={(row) => row.supplierId}
              maxHeight="100%"
              emptyMessage={loading ? "조회 중..." : "조건에 맞는 업체별 실적이 없습니다."}
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
      <SheetContent>
        <SheetHdr>
          <SheetTitle>그리드 설정</SheetTitle>
          <SheetDescription className="text-xs">내보내기 · 보기 설정</SheetDescription>
        </SheetHdr>
        <div className="mt-4 space-y-5 text-xs">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={gridSettingsTab === "export" ? "default" : "outline"} onClick={() => setGridSettingsTab("export")}>내보내기</Button>
            <Button size="sm" variant={gridSettingsTab === "view" ? "default" : "outline"} onClick={() => setGridSettingsTab("view")}>보기</Button>
          </div>
          {gridSettingsTab === "export" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">조회된 구매실적 데이터를 CSV 파일로 다운로드합니다.</p>
              <Button size="sm" onClick={handleExport} disabled={filtered.length === 0}>CSV 내보내기</Button>
            </div>
          )}
          {gridSettingsTab === "view" && (
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                <Checkbox checked={stripedRows} onChange={(e) => setStripedRows(e.target.checked)} />
              </label>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}

