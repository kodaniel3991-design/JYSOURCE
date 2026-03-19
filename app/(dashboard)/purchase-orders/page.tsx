"use client";

import { useCallback, useMemo, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { POStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { poStatusLabels } from "@/lib/mock/purchase-orders";
import { suppliers } from "@/lib/mock/suppliers";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { FileText, MoreHorizontal, PackageCheck, Search, RotateCcw } from "lucide-react";
import { ReceiptProcessSheet } from "@/components/purchase-orders/receipt-process-sheet";
import type { POStatus } from "@/types/purchase";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

const statusOptions: SelectOption[] = Object.entries(poStatusLabels).map(
  ([value, label]) => ({ value, label })
);
const supplierOptions: SelectOption[] = suppliers.map((s) => ({
  value: s.id,
  label: s.name,
}));

const PAGE_SIZE = 10;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [list, setList] = useCachedState<PurchaseOrderSummary[]>("po-list/list", []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useCachedState<boolean>("po-list/hasSearched", false);
  const [search, setSearch] = useCachedState<string>("po-list/search", "");
  const [supplierId, setSupplierId] = useCachedState<string>("po-list/supplierId", "");
  const [status, setStatus] = useCachedState<string>("po-list/status", "");
  const [fromDate, setFromDate] = useCachedState<string>("po-list/fromDate", "");
  const [toDate, setToDate] = useCachedState<string>("po-list/toDate", "");
  const [page, setPage] = useCachedState<number>("po-list/page", 1);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      setList(data?.items && Array.isArray(data.items) ? data.items : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useCachedState<keyof PurchaseOrderSummary>("po-list/sortKey", "poNumber");
  const [sortDir, setSortDir] = useCachedState<"asc" | "desc">("po-list/sortDir", "asc");
  const [stripedRows, setStripedRows] = useCachedState<boolean>("po-list/stripedRows", true);
  const [compactView, setCompactView] = useCachedState<boolean>("po-list/compactView", true);

  const filtered = useMemo(() => {
    return list.filter((po) => {
      const matchSearch =
        !search ||
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = !supplierId || po.supplierId === supplierId;
      const matchStatus = !status || po.status === status;

      let matchDate = true;
      if (fromDate || toDate) {
        const due = po.dueDate ? new Date(po.dueDate) : null;
        if (!due) {
          matchDate = false;
        } else {
          if (fromDate) matchDate = matchDate && due >= new Date(fromDate);
          if (toDate) matchDate = matchDate && due <= new Date(toDate);
        }
      }

      return matchSearch && matchSupplier && matchStatus && matchDate;
    });
  }, [list, search, supplierId, status, fromDate, toDate]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;

      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortDir, sortKey]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const totalOrders = list.length;
  const openOrders = useMemo(
    () =>
      list.filter(
        (po) =>
          po.status === "draft" ||
          po.status === "approved" ||
          po.status === "issued" ||
          po.status === "confirmed" ||
          po.status === "partial" ||
          po.status === "received"
      ).length,
    [list]
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
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

  const resetFilters = useCallback(() => {
    setSearch("");
    setSupplierId("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }, []);

  const handleSupplierChange = useCallback((v: string) => {
    setSupplierId(v);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((v: string) => {
    setStatus(v);
    setPage(1);
  }, []);

  // 입고처리 가능 상태 (draft/closed는 제외)
  const receiptEligibleStatuses: POStatus[] = ["approved", "issued", "confirmed", "partial"];

  const eligibleSelected = useMemo(
    () =>
      list.filter(
        (po) => selectedIds.has(po.id) && receiptEligibleStatuses.includes(po.status)
      ),
    [list, selectedIds]
  );

  const pageIds = useMemo(() => paginated.map((r) => r.id), [paginated]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleReceiptComplete = useCallback(
    (updatedIds: string[], newStatus: POStatus) => {
      setList((prev) =>
        prev.map((po) =>
          updatedIds.includes(po.id) ? { ...po, status: newStatus } : po
        )
      );
      setSelectedIds(new Set());
    },
    []
  );

  const allColumns = useMemo(
    () =>
      [
        {
          key: "_select",
          header: "",
          minWidth: 36,
          maxWidth: 36,
          headerClassName: "px-1",
          cellClassName: "px-1",
          cell: (row: PurchaseOrderSummary) => (
            <div
              className="flex h-full items-center justify-center"
              onClick={(e) => toggleSelect(row.id, e)}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 cursor-pointer"
                checked={selectedIds.has(row.id)}
                onChange={() => {}}
              />
            </div>
          ),
        },
        {
          key: "poNumber",
          header: "PO 번호",
          minWidth: 120,
          maxWidth: 140,
          cell: (row: PurchaseOrderSummary) => (
            <span className="font-medium text-primary">{row.poNumber}</span>
          ),
        },
        {
          key: "supplierName",
          header: "공급사",
          minWidth: 160,
          maxWidth: 200,
        },
        {
          key: "itemCount",
          header: "품목수",
          minWidth: 80,
          maxWidth: 80,
          align: "right" as const,
          cellClassName: "text-right",
          cell: (row: PurchaseOrderSummary) => `${row.itemCount}건`,
        },
        {
          key: "totalAmount",
          header: "총금액",
          minWidth: 140,
          maxWidth: 160,
          align: "right" as const,
          cellClassName: "text-right",
          cell: (row: PurchaseOrderSummary) => formatCurrency(row.totalAmount),
        },
        {
          key: "dueDate",
          header: "납기일",
          minWidth: 110,
          maxWidth: 110,
          cell: (row: PurchaseOrderSummary) => formatDate(row.dueDate),
        },
        {
          key: "status",
          header: "상태",
          minWidth: 110,
          maxWidth: 110,
          cell: (row: PurchaseOrderSummary) => (
            <POStatusBadge status={row.status} />
          ),
        },
        {
          key: "assignedTo",
          header: "담당자",
          minWidth: 100,
          maxWidth: 120,
        },
        {
          key: "action",
          header: "",
          minWidth: 60,
          maxWidth: 60,
          cell: (row: PurchaseOrderSummary) => (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/purchase-orders/${row.id}`);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ),
        },
      ] as const,
    [router, selectedIds, toggleSelect]
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    allColumns.map((c) => c.key)
  );

  const visibleColumns = useMemo(() => {
    const set = new Set(visibleColumnKeys);
    // _select는 항상 첫 번째로 포함
    const rest = allColumns.filter((c) => c.key !== "_select" && set.has(c.key));
    const selectCol = allColumns.find((c) => c.key === "_select")!;
    return rest.length > 0 ? [selectCol, ...rest] : [selectCol];
  }, [allColumns, visibleColumnKeys]);

  const sortOptions = useMemo(
    () =>
      allColumns
        .filter((c) => c.key !== "action" && c.key !== "_select")
        .map((c) => ({
          value: c.key,
          label: c.header,
        })),
    [allColumns]
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  const exportExcel = useCallback(async () => {
    const cols = visibleColumns;
    const rows = sorted;

    const XLSX = await import("xlsx-js-style");
    const header = cols.map((c) => c.header);
    const data = rows.map((r) =>
      cols.map((c) => {
        if (c.key === "status") {
          return r.status;
        }
        if (c.key === "totalAmount") {
          return r.totalAmount;
        }
        const value = (r as any)[c.key];
        return value == null ? "" : value;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    Object.keys(ws).forEach((addr) => {
      if (addr.startsWith("!")) return;
      const cell = (ws as any)[addr];
      if (!cell) return;
      const prevStyle = cell.s ?? {};
      cell.s = {
        ...prevStyle,
        font: {
          ...(prevStyle.font ?? {}),
          sz: 10,
        },
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "구매오더");
    const fileName = `purchase_orders_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    (XLSX as any).writeFile(wb, fileName);
  }, [sorted, visibleColumns]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="구매오더 현황"
        description="전체 구매오더를 조회하고 상태를 관리합니다."
        actions={
          <Link href="/purchase-orders/create">
            <Button size="sm">
              <FileText className="mr-2 h-4 w-4" />
              신규 구매오더
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              전체 발주 건수
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              진행 중 발주
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              납기 지연 발주
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">
              {delayedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 조건 */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">검색 조건</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* PO번호/공급사명 */}
            <div className="space-y-1">
              <Label className="text-[14px] text-slate-600">PO번호/공급사명</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="검색..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            {/* 공급사 */}
            <div className="space-y-1">
              <Label className="text-[14px] text-slate-600">공급사</Label>
              <Select
                options={[{ value: "", label: "전체" }, ...supplierOptions]}
                value={supplierId}
                onChange={handleSupplierChange}
                className="h-8 text-xs"
              />
            </div>
            {/* 상태 */}
            <div className="space-y-1">
              <Label className="text-[14px] text-slate-600">상태</Label>
              <Select
                options={[{ value: "", label: "전체" }, ...statusOptions]}
                value={status}
                onChange={handleStatusChange}
                className="h-8 text-xs"
              />
            </div>
            {/* 시작일자 */}
            <div className="space-y-1">
              <Label className="text-[14px] text-slate-600">시작일자</Label>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
            {/* 완료일자 */}
            <div className="space-y-1">
              <Label className="text-[14px] text-slate-600">완료일자</Label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleSearch} disabled={loading}>
              <Search className="mr-1.5 h-4 w-4" />
              {loading ? "조회 중..." : "검색"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              필터 초기화
            </Button>
            <p className="text-[11px] text-muted-foreground">
              총 <span className="font-semibold">{filtered.length}</span>건이 조회되었습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          {/* 전체선택 + 입고처리 액션 */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={allPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = somePageSelected && !allPageSelected;
                }}
                onChange={toggleSelectAll}
              />
              현재 페이지 전체선택
            </label>
            {selectedIds.size > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {selectedIds.size}건 선택됨
              </span>
            )}
            {eligibleSelected.length > 0 && (
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setReceiptSheetOpen(true)}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                입고처리 ({eligibleSelected.length}건)
              </Button>
            )}
          </div>
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => {
              setGridSettingsTab("export");
              setGridSettingsOpen(true);
            }}
            onSort={() => {
              setGridSettingsTab("sort");
              setGridSettingsOpen(true);
              toggleSortDir();
            }}
            onColumns={() => {
              setGridSettingsTab("columns");
              setGridSettingsOpen(true);
            }}
            onView={() => {
              setGridSettingsTab("view");
              setGridSettingsOpen(true);
              setStripedRows((v) => !v);
            }}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<PurchaseOrderSummary>
              columns={visibleColumns as unknown as any}
              data={loading ? [] : paginated}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => router.push(`/purchase-orders/${row.id}`)}
              pagination={{
                page,
                pageSize: PAGE_SIZE,
                total: filtered.length,
                onPageChange: setPage,
              }}
              variant={stripedRows ? "striped" : "default"}
              maxHeight="100%"
              emptyMessage={!hasSearched ? "검색 버튼을 클릭하면 조회됩니다." : loading ? "조회 중..." : "조건에 맞는 구매오더가 없습니다."}
              getRowClassName={(_row, index) => {
                const striped =
                  stripedRows && index % 2 === 1
                    ? "bg-slate-50 dark:bg-slate-800/70"
                    : "";
                const density = compactView ? "" : "h-10";
                return [striped, density].filter(Boolean).join(" ");
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={gridSettingsOpen}
        onOpenChange={setGridSettingsOpen}
        position="center"
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">
              내보내기 · 정렬 · 컬럼 · 보기 설정
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={gridSettingsTab === "export" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("export")}
              >
                내보내기
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "sort" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("sort")}
              >
                정렬
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "columns" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("columns")}
              >
                컬럼
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "view" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("view")}
              >
                보기
              </Button>
            </div>

            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  검색/정렬된 전체 구매오더 데이터가 EXCEL 파일(.xlsx)로
                  다운로드됩니다.
                </p>
                <Button size="sm" onClick={() => void exportExcel()}>
                  EXCEL 내보내기
                </Button>
              </div>
            )}

            {gridSettingsTab === "sort" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    정렬 기준
                  </Label>
                  <Select
                    className="h-9 text-xs"
                    value={String(sortKey)}
                    options={sortOptions}
                    onChange={(v) =>
                      setSortKey(v as keyof PurchaseOrderSummary)
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSortDir}>
                    {sortDir === "asc" ? "오름차순" : "내림차순"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    정렬은 즉시 목록에 적용됩니다.
                  </p>
                </div>
              </div>
            )}

            {gridSettingsTab === "columns" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  표시할 컬럼을 선택하세요. (최소 1개 유지)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allColumns.filter((c) => c.key !== "_select").map((c) => {
                    const checked = visibleColumnKeys.includes(c.key);
                    return (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setVisibleColumnKeys((prev) => {
                              if (next)
                                return Array.from(new Set([...prev, c.key]));
                              const filteredKeys = prev.filter(
                                (k) => k !== c.key
                              );
                              return filteredKeys.length > 0
                                ? filteredKeys
                                : prev;
                            });
                          }}
                        />
                        <span className="text-[11px]">{c.header}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    줄무늬 표시
                  </span>
                  <Checkbox
                    checked={stripedRows}
                    onChange={(e) => setStripedRows(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    컴팩트 보기
                  </span>
                  <Checkbox
                    checked={compactView}
                    onChange={(e) => setCompactView(e.target.checked)}
                  />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ReceiptProcessSheet
        open={receiptSheetOpen}
        onClose={() => setReceiptSheetOpen(false)}
        selectedPOs={eligibleSelected}
        onComplete={handleReceiptComplete}
      />
    </div>
  );
}
