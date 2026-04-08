"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader as SheetHdr, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import { SearchPanel } from "@/components/common/search-panel";
import { DateInput } from "@/components/ui/date-input";
import { apiPath } from "@/lib/api-path";

type ReceiptStatusRow = {
  id: string;
  poNumber: string;
  modelCode: string;
  displayGroupLabel?: string;
  itemCode: string;
  itemName: string;
  specification: string;
  unit: string;
  orderQty: number;
  orderAmount: number;
  receiveQty: number;
  receiveAmount: number;
  unreceivedQty: number;
  unreceivedAmount: number;
  receiptRate: number;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  rowKind?: "data" | "subtotal" | "total";
};

export default function PurchaseReceiptStatusPage() {
  type SearchParams = {
    viewMode: "차종별" | "거래처별";
    fromDueDate: string;
    toDueDate: string;
    fromOrderDate: string;
    toOrderDate: string;
  };

  const initialParams: SearchParams = {
    viewMode: "차종별",
    fromDueDate: "",
    toDueDate: "",
    fromOrderDate: "",
    toOrderDate: "",
  };

  const [draft, setDraft] = useState<SearchParams>(initialParams);
  const [criteria, setCriteria] = useState<SearchParams>(initialParams);
  const [rawRows, setRawRows] = useState<ReceiptStatusRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");
  const [stripedRows, setStripedRows] = useState(true);

  const fetchRows = useCallback(async (params: SearchParams) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ viewMode: params.viewMode });
      if (params.fromDueDate)   qs.set("dateFrom",      params.fromDueDate);
      if (params.toDueDate)     qs.set("dateTo",        params.toDueDate);
      if (params.fromOrderDate) qs.set("orderDateFrom", params.fromOrderDate);
      if (params.toOrderDate)   qs.set("orderDateTo",   params.toOrderDate);

      const res  = await fetch(apiPath(`/api/purchase-orders/performance/receipts?${qs}`));
      const data = await res.json();
      if (!data.ok) { setRawRows([]); return; }

      const rows: ReceiptStatusRow[] = (data.items ?? []).map((r: Record<string, unknown>, i: number) => ({
        id:               `${r.poNumber}-${r.specNo}-${i}`,
        poNumber:         String(r.poNumber      ?? ""),
        modelCode:        String(r.vehicleModel  ?? ""),
        itemCode:         String(r.itemCode      ?? ""),
        itemName:         String(r.itemName      ?? ""),
        specification:    String(r.specification ?? ""),
        unit:             String(r.unit          ?? ""),
        orderQty:         Number(r.orderQty      ?? 0),
        orderAmount:      Number(r.orderAmount   ?? 0),
        receiveQty:       Number(r.receiveQty    ?? 0),
        receiveAmount:    Number(r.receiveAmount  ?? 0),
        unreceivedQty:    Number(r.unreceivedQty  ?? 0),
        unreceivedAmount: Number(r.unreceivedAmount ?? 0),
        receiptRate:      Number(r.receiptRate   ?? 0),
        dueDate:          String(r.dueDate       ?? ""),
        supplierId:       String(r.supplierCode  ?? ""),
        supplierName:     String(r.supplierName  ?? ""),
        rowKind:          "data",
      }));
      setRawRows(rows);
    } catch {
      setRawRows([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setCriteria(draft);
    fetchRows(draft);
  }, [draft, fetchRows]);

  const resetFilters = useCallback(() => {
    setDraft(initialParams);
    setCriteria(initialParams);
    setRawRows([]);
    setHasSearched(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayRows = useMemo(() => {
    const mode = criteria.viewMode;

    const getGroupKey = (row: ReceiptStatusRow) =>
      mode === "거래처별" ? row.supplierName || "-" : row.modelCode || "-";

    const byKey = new Map<string, ReceiptStatusRow[]>();
    for (const row of rawRows) {
      const key = getGroupKey(row);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(row);
    }

    const keys = Array.from(byKey.keys()).sort((a, b) => a.localeCompare(b, "ko-KR"));
    const result: ReceiptStatusRow[] = [];

    let grandOrderQty = 0, grandOrderAmt = 0, grandRecvQty = 0;
    let grandRecvAmt = 0, grandUnrecvQty = 0, grandUnrecvAmt = 0;

    for (const key of keys) {
      const groupRows = byKey.get(key)!;
      let groupOrderQty = 0, groupOrderAmt = 0, groupRecvQty = 0;
      let groupRecvAmt = 0, groupUnrecvQty = 0, groupUnrecvAmt = 0;

      groupRows.forEach((row, index) => {
        result.push({ ...row, displayGroupLabel: index === 0 ? key : "", rowKind: "data" });
        groupOrderQty  += row.orderQty;      groupOrderAmt  += row.orderAmount;
        groupRecvQty   += row.receiveQty;    groupRecvAmt   += row.receiveAmount;
        groupUnrecvQty += row.unreceivedQty; groupUnrecvAmt += row.unreceivedAmount;
      });

      grandOrderQty += groupOrderQty; grandOrderAmt += groupOrderAmt;
      grandRecvQty  += groupRecvQty;  grandRecvAmt  += groupRecvAmt;
      grandUnrecvQty += groupUnrecvQty; grandUnrecvAmt += groupUnrecvAmt;

      result.push({
        id: `subtotal-${key}`, poNumber: "", modelCode: mode === "거래처별" ? "" : key,
        displayGroupLabel: "[SUB TOTAL]", itemCode: "", itemName: "", specification: "",
        unit: "", dueDate: "", supplierId: "", supplierName: mode === "거래처별" ? key : "",
        orderQty: groupOrderQty, orderAmount: groupOrderAmt,
        receiveQty: groupRecvQty, receiveAmount: groupRecvAmt,
        unreceivedQty: groupUnrecvQty, unreceivedAmount: groupUnrecvAmt,
        receiptRate: groupOrderAmt === 0 ? 0 : Math.round((groupRecvAmt / groupOrderAmt) * 100),
        rowKind: "subtotal",
      });
    }

    if (rawRows.length > 0) {
      result.push({
        id: "total-all", poNumber: "", modelCode: "", displayGroupLabel: "[TOTAL]",
        itemCode: "", itemName: "", specification: "", unit: "", dueDate: "",
        supplierId: "", supplierName: "",
        orderQty: grandOrderQty, orderAmount: grandOrderAmt,
        receiveQty: grandRecvQty, receiveAmount: grandRecvAmt,
        unreceivedQty: grandUnrecvQty, unreceivedAmount: grandUnrecvAmt,
        receiptRate: grandOrderAmt === 0 ? 0 : Math.round((grandRecvAmt / grandOrderAmt) * 100),
        rowKind: "total",
      });
    }

    return result;
  }, [rawRows, criteria.viewMode]);

  const totalOrdered  = rawRows.reduce((s, r) => s + r.orderAmount,   0);
  const totalReceived = rawRows.reduce((s, r) => s + r.receiveAmount,  0);
  const overallRate   = totalOrdered === 0 ? 0 : Math.round((totalReceived / totalOrdered) * 100);

  const handleExport = () => {
    const dataRows = displayRows.filter((r) => r.rowKind === "data" || !r.rowKind);
    if (dataRows.length === 0) return;
    const header = ["차종/거래처", "품목번호", "품목명", "규격", "단위", "발주량", "발주금액", "입고량", "입고금액", "미입고량", "미입고금액", "입고율(%)"];
    const csvRows = dataRows.map((r) => [
      criteria.viewMode === "거래처별" ? r.supplierName : r.modelCode,
      r.itemCode, r.itemName, r.specification, r.unit,
      String(r.orderQty),    String(r.orderAmount),
      String(r.receiveQty),  String(r.receiveAmount),
      String(r.unreceivedQty), String(r.unreceivedAmount),
      String(r.receiptRate),
    ]);
    const csv = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "receipt-status.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title="발주대비 입고현황"
        description="입고예정일자, 발주일자, 조회기준으로 발주대비 입고현황을 조회합니다."
      />

      <SearchPanel
        onSearch={handleSearch}
        onReset={resetFilters}
        totalCountLabel={
          hasSearched
            ? `발주금액 합계 ${formatCurrency(totalOrdered)}, 입고금액 합계 ${formatCurrency(totalReceived)}, 입고율 ${overallRate}%`
            : ""
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">조회기준</span>
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              value={draft.viewMode}
              onChange={(e) => setDraft((p) => ({ ...p, viewMode: e.target.value as SearchParams["viewMode"] }))}
            >
              <option value="차종별">차종별</option>
              <option value="거래처별">거래처별</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">입고예정일자</span>
            <div className="flex items-center gap-1">
              <DateInput value={draft.fromDueDate}
                onChange={(e) => setDraft((p) => ({ ...p, fromDueDate: e.target.value }))}
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs" />
              <span className="text-[11px] text-muted-foreground">~</span>
              <DateInput value={draft.toDueDate}
                onChange={(e) => setDraft((p) => ({ ...p, toDueDate: e.target.value }))}
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">발주일자</span>
            <div className="flex items-center gap-1">
              <DateInput value={draft.fromOrderDate}
                onChange={(e) => setDraft((p) => ({ ...p, fromOrderDate: e.target.value }))}
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs" />
              <span className="text-[11px] text-muted-foreground">~</span>
              <DateInput value={draft.toOrderDate}
                onChange={(e) => setDraft((p) => ({ ...p, toOrderDate: e.target.value }))}
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs" />
            </div>
          </div>
        </div>
      </SearchPanel>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="px-3 py-2 shrink-0 border-b flex flex-row items-center justify-end">
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
            onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<ReceiptStatusRow>
              columns={[
                {
                  key: "modelCode",
                  header: criteria.viewMode === "거래처별" ? "거래처" : "차종",
                  minWidth: 120,
                  cell: (row) => row.displayGroupLabel ?? (criteria.viewMode === "거래처별" ? row.supplierName : row.modelCode),
                },
                { key: "itemCode",      header: "품목번호", minWidth: 140 },
                { key: "itemName",      header: "품명",     minWidth: 220 },
                { key: "specification", header: "규격",     minWidth: 160 },
                { key: "orderQty",      header: "발주량",   minWidth: 100, align: "right", cellClassName: "text-right",
                  cell: (row) => row.orderQty.toLocaleString("ko-KR") },
                { key: "orderAmount",   header: "발주금액", minWidth: 140, align: "right", cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.orderAmount) },
                { key: "receiveQty",    header: "입고량",   minWidth: 100, align: "right", cellClassName: "text-right",
                  cell: (row) => row.receiveQty.toLocaleString("ko-KR") },
                { key: "receiveAmount", header: "입고금액", minWidth: 140, align: "right", cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.receiveAmount) },
                { key: "unreceivedQty",    header: "미입고량",   minWidth: 100, align: "right", cellClassName: "text-right",
                  cell: (row) => row.unreceivedQty.toLocaleString("ko-KR") },
                { key: "unreceivedAmount", header: "미입고금액", minWidth: 140, align: "right", cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.unreceivedAmount) },
                { key: "receiptRate",   header: "입고율",   minWidth: 80,  align: "right", cellClassName: "text-right",
                  cell: (row) => `${row.receiptRate}%` },
              ]}
              data={loading ? [] : displayRows}
              keyExtractor={(row) => row.id}
              getRowClassName={(row) =>
                row.rowKind === "total"
                  ? "bg-fuchsia-100 dark:bg-fuchsia-900/60 font-semibold"
                  : row.rowKind === "subtotal"
                    ? "bg-amber-50 dark:bg-amber-900/60 font-semibold"
                    : ""
              }
              pagination={
                displayRows.length > 0
                  ? { page: 1, pageSize: displayRows.length, total: displayRows.length, onPageChange: () => {} }
                  : undefined
              }
              emptyMessage={
                !hasSearched ? "검색 버튼을 클릭하면 조회됩니다." :
                loading ? "조회 중..." : "조건에 맞는 발주대비 입고현황이 없습니다."
              }
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
            <Button size="sm" variant={gridSettingsTab === "view"   ? "default" : "outline"} onClick={() => setGridSettingsTab("view")}>보기</Button>
          </div>
          {gridSettingsTab === "export" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">조회된 발주대비 입고현황 데이터를 CSV 파일로 다운로드합니다.</p>
              <Button size="sm" onClick={handleExport} disabled={displayRows.filter((r) => !r.rowKind || r.rowKind === "data").length === 0}>CSV 내보내기</Button>
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
