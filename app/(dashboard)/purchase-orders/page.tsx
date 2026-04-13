"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { POStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { poStatusLabels } from "@/lib/mock/purchase-orders";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { FileText, MoreHorizontal, PackageCheck, RotateCcw, Search, X } from "lucide-react";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { useSupplierAutoFill } from "@/lib/hooks/use-supplier-list";
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
import { apiPath } from "@/lib/api-path";

const statusOptions: SelectOption[] = Object.entries(poStatusLabels).map(
  ([value, label]) => ({ value, label })
);

const PAGE_SIZE = 20;

function todayDefaults() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    first: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
    today: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  };
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [list, setList] = useCachedState<PurchaseOrderSummary[]>("po-list/list", []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useCachedState<boolean>("po-list/hasSearched", false);
  const [search, setSearch] = useCachedState<string>("po-list/search", "");
  const [supplierCode, setSupplierCode] = useCachedState<string>("po-list/supplierCode", "");
  const [supplierName, setSupplierName] = useCachedState<string>("po-list/supplierName", "");

  useSupplierAutoFill(supplierCode, setSupplierName);
  const [status, setStatus] = useCachedState<string>("po-list/status", "");
  const defaults = todayDefaults();
  const [fromDate, setFromDate] = useCachedState<string>("po-list/fromDate", defaults.first);
  const [toDate, setToDate] = useCachedState<string>("po-list/toDate", defaults.today);
  const [itemCode, setItemCode] = useCachedState<string>("po-list/itemCode", "");
  const [itemName, setItemName] = useCachedState<string>("po-list/itemName", "");
  const [model, setModel] = useCachedState<string>("po-list/model", "");
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isModelPopupOpen, setIsModelPopupOpen] = useState(false);
  const [modelList, setModelList] = useState<string[]>([]);
  const [modelSubSearch, setModelSubSearch] = useState("");
  const [modelSubIdx, setModelSubIdx] = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);
  const refDateFrom     = useRef<HTMLInputElement>(null);
  const refDateTo       = useRef<HTMLInputElement>(null);
  const refItemCode     = useRef<HTMLInputElement>(null);
  const refSupplierCode = useRef<HTMLInputElement>(null);
  const refModel        = useRef<HTMLInputElement>(null);
  const refSearchBtn    = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useCachedState<number>("po-list/page", 1);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);

  useEffect(() => { modelSubRowRef.current?.scrollIntoView({ block: "nearest" }); }, [modelSubIdx]);

  const filteredModelList = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, modelList]);

  // 모델 목록 로드
  useEffect(() => {
    fetch(apiPath("/api/items"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const s = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.items.forEach((x: any) => { if (x.VehicleModel) s.add((x.VehicleModel as string).toUpperCase()); });
        setModelList(Array.from(s).sort());
      })
      .catch(() => {});
  }, []);
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim())        params.set("poNumber",     search.trim());
      if (supplierCode.trim())  params.set("supplierCode", supplierCode.trim());
      if (status)               params.set("status",       status);
      if (fromDate)             params.set("dateFrom",     fromDate);
      if (toDate)               params.set("dateTo",       toDate);
      if (itemCode.trim())      params.set("itemCode",     itemCode.trim());
      if (model.trim())         params.set("model",        model.trim());
      const res = await fetch(apiPath(`/api/purchase-orders?${params.toString()}`));
      const data = await res.json();
      setList(data?.items && Array.isArray(data.items) ? data.items : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, [search, supplierCode, status, fromDate, toDate, itemCode, model]);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useState<keyof PurchaseOrderSummary>("poNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [stripedRows, setStripedRows] = useCachedState<boolean>("po-list/stripedRows", true);
  const [compactView, setCompactView] = useCachedState<boolean>("po-list/compactView", true);

  // 서버에서 필터링된 결과를 그대로 사용
  const filtered = list;

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
  }, [sorted, page, PAGE_SIZE]);

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
    const d = todayDefaults();
    setSearch("");
    setSupplierCode("");
    setSupplierName("");
    setStatus("");
    setFromDate(d.first);
    setToDate(d.today);
    setItemCode("");
    setItemName("");
    setModel("");
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
      <Card className="shrink-0">
        <CardContent className="p-3">
          {/* 조건 행 */}
          <div className="flex flex-wrap items-end gap-3 mb-3">
            {/* 발주일자 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">발주일자</label>
              <div className="flex gap-1 items-center">
                <DateInput
                  ref={refDateFrom}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refDateTo.current?.focus(); } }}
                  className="h-8 text-xs w-[130px]"
                />
                <span className="text-xs text-muted-foreground shrink-0">~</span>
                <DateInput
                  ref={refDateTo}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refSupplierCode.current?.focus(); } }}
                  className="h-8 text-xs w-[130px]"
                />
              </div>
            </div>

            {/* 구매처 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">구매처</label>
              <div className="flex gap-1">
                <Input
                  ref={refSupplierCode}
                  value={supplierCode}
                  onChange={(e) => { setSupplierCode(e.target.value); setSupplierName(""); }}
                  placeholder="코드"
                  className="h-8 text-xs w-32"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (supplierCode.trim()) { setIsSupplierPopupOpen(true); } else { refItemCode.current?.focus(); } } }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-8 w-7 shrink-0" onClick={() => setIsSupplierPopupOpen(true)}>
                  <Search className="h-3 w-3" />
                </Button>
                <Input value={supplierName} readOnly placeholder="구매처명"
                  className="h-8 text-xs w-44 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 상태 */}
            <div className="flex flex-col gap-1 shrink-0 w-44">
              <label className="text-xs font-medium text-muted-foreground">상태</label>
              <Select
                options={[{ value: "", label: "전체" }, ...statusOptions]}
                value={status}
                onChange={handleStatusChange}
                className="h-8 text-xs"
              />
            </div>

            {/* 품목번호 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">품목번호</label>
              <div className="flex gap-1">
                <Input
                  ref={refItemCode}
                  value={itemCode}
                  onChange={(e) => { setItemCode(e.target.value); setItemName(""); }}
                  placeholder="품목번호"
                  className="h-8 text-xs w-32"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (itemCode.trim()) setIsItemModalOpen(true); else refModel.current?.focus(); } }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-8 w-7 shrink-0" onClick={() => setIsItemModalOpen(true)}>
                  <Search className="h-3 w-3" />
                </Button>
                <Input value={itemName} readOnly placeholder="품목명"
                  className="h-8 text-xs w-44 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 모델 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">모델</label>
              <div className="flex gap-1">
                <Input
                  ref={refModel}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="모델"
                  className="h-8 text-xs w-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (model.trim()) { setModelSubSearch(model); setModelSubIdx(-1); setIsModelPopupOpen(true); }
                      else { refSearchBtn.current?.focus(); }
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-8 w-7 shrink-0"
                  onClick={() => { setModelSubSearch(model); setModelSubIdx(-1); setIsModelPopupOpen(true); }}>
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* 버튼 행 */}
          <div className="flex items-center gap-2 pt-2.5 border-t">
            <Button
              ref={refSearchBtn}
              type="button"
              size="sm"
              onClick={() => void handleSearch()}
              disabled={loading}
              className="h-8 px-4"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleSearch(); } }}
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              검색
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="h-8 px-3"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              필터 초기화
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              총 <span className="font-semibold text-foreground">{filtered.length.toLocaleString("ko-KR")}</span>건이 조회되었습니다.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 모델 팝업 */}
      {isModelPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => { if (e.key === "Escape") { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); } }}>
          <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">모델 선택</h3>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={modelSubSearch}
              onChange={(e) => { setModelSubSearch(e.target.value); setModelSubIdx(-1); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setModelSubIdx((p) => Math.min(p + 1, filteredModelList.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setModelSubIdx((p) => Math.max(p - 1, -1)); }
                else if (e.key === "Enter") {
                  e.preventDefault();
                  const target = modelSubIdx >= 0 ? filteredModelList[modelSubIdx]
                    : filteredModelList.length === 1 ? filteredModelList[0] : null;
                  if (target) { setModel(target); setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }
                }
              }}
              placeholder="모델명 검색"
              className="h-8 text-xs mb-2"
              autoFocus
            />
            <div className="h-[260px] rounded border overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr><th className="px-3 py-1.5 text-left">모델</th></tr>
                </thead>
                <tbody>
                  {filteredModelList.length === 0 ? (
                    <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                  ) : filteredModelList.map((m, idx) => (
                    <tr
                      key={m}
                      ref={idx === modelSubIdx ? modelSubRowRef : null}
                      className={`cursor-pointer border-t ${idx === modelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40" : "hover:bg-muted"}`}
                      onClick={() => { setModel(m); setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }}
                    >
                      <td className="px-3 py-1.5">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 구매처 팝업 */}
      <SupplierSelectPopup
        open={isSupplierPopupOpen}
        onOpenChange={setIsSupplierPopupOpen}
        initialSearch={supplierCode}
        onSelect={(code, name) => { setSupplierCode(code); setSupplierName(name); setIsSupplierPopupOpen(false); }}
      />
      {/* 품목 선택 모달 */}
      <ItemSelectModal
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        initialSearch={itemCode}
        onSelect={(item) => { setItemCode(item.itemCode); setItemName(item.itemName); }}
      />

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
                  <p className="text-[11px] text-muted-foreground">정렬 기준</p>
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
