"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CrudActions } from "@/components/common/crud-actions";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import type { MasterListGridColumn } from "@/components/common/master-list-grid";
import type { PurchasePriceRecord } from "@/types/purchase-price";
import { PurchasePriceSheet } from "@/components/purchase-prices/purchase-price-sheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, Upload, Download, X } from "lucide-react";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";
import { SearchPanel } from "@/components/common/search-panel";

interface PurchasePriceFilterState {
  itemCode: string;
  itemName: string;
  supplierName: string;
}

interface PurchasePriceChangeLog {
  id: string;
  itemCode: string;
  itemName: string;
  supplierName: string;
  previousUnitPrice: number;
  newUnitPrice: number;
  changedAt: string;
  reason?: string;
}

export default function PurchasePricesPage() {
  const [rows, setRows] = useState<PurchasePriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useEnterNavigation();

  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/purchase-prices");
      const data = await r.json();
      if (data?.ok && Array.isArray(data.items)) {
        setRows(data.items);
      } else {
        setRows([]);
        setLoadError(data?.message ?? "데이터를 불러올 수 없습니다.");
      }
    } catch {
      setRows([]);
      setLoadError("구매단가 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);
  const [filters, setFilters] = useState<PurchasePriceFilterState>({
    itemCode: "",
    itemName: "",
    supplierName: "",
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortMode, setSortMode] = useState<
    "none" | "unitPriceAsc" | "unitPriceDesc"
  >("none");
  const [changeLogs, setChangeLogs] = useState<PurchasePriceChangeLog[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [excelSheetOpen, setExcelSheetOpen] = useState(false);
  const [excelResultMessage, setExcelResultMessage] = useState<string | null>(null);
  const [excelSelectedFile, setExcelSelectedFile] = useState<File | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = <K extends keyof PurchasePriceFilterState>(
    key: K,
    value: PurchasePriceFilterState[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
      itemCode: "",
      itemName: "",
      supplierName: "",
    });
    setSelectedRowId(null);
    setPage(1);
  };

  const filteredList = useMemo(() => {
    const result = rows.filter((row) => {
      if (filters.itemCode && !row.itemCode.includes(filters.itemCode))
        return false;
      if (
        filters.itemName &&
        !row.itemName.toLowerCase().includes(filters.itemName.toLowerCase())
      )
        return false;
      if (
        filters.supplierName &&
        !(row.supplierName ?? row.supplierCode ?? "")
          .toLowerCase()
          .includes(filters.supplierName.toLowerCase())
      )
        return false;
      return true;
    });

    const sorted = [...result];
    if (sortMode === "unitPriceAsc") {
      sorted.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (sortMode === "unitPriceDesc") {
      sorted.sort((a, b) => b.unitPrice - a.unitPrice);
    }

    return sorted;
  }, [filters, rows, sortMode]);

  const total = filteredList.length;
  const start = (page - 1) * pageSize;
  const paged = filteredList.slice(start, start + pageSize);

  const columns = useMemo<MasterListGridColumn<PurchasePriceRecord>[]>(
    () => [
      { key: "itemCode", header: "품목번호", minWidth: 120, maxWidth: 140 },
      { key: "itemName", header: "품목명", minWidth: 160, maxWidth: 200 },
      { key: "itemSpec", header: "품목규격", minWidth: 180, maxWidth: 220 },
      { key: "itemMaterialName", header: "품목재질명", minWidth: 100, maxWidth: 120 },
      { key: "supplierCode", header: "구매처번호", minWidth: 100, maxWidth: 120 },
      { key: "applyDate", header: "적용일자", minWidth: 100, maxWidth: 110 },
      {
        key: "unitPrice",
        header: "구매단가",
        minWidth: 100,
        maxWidth: 110,
        align: "right",
        cellClassName: "text-right",
        cell: (r) => r.unitPrice.toLocaleString("ko-KR"),
      },
      {
        key: "isTempPrice",
        header: "가단가 여부",
        minWidth: 90,
        maxWidth: 90,
        align: "center",
        cellClassName: "text-center",
        cell: (r) => (
          <Checkbox
            checked={!!r.isTempPrice}
            readOnly
            className="pointer-events-none mx-auto"
          />
        ),
      },
      { key: "warehouseCode", header: "창고코드", minWidth: 90, maxWidth: 100 },
      { key: "storageLocationCode", header: "저장위치코드", minWidth: 110, maxWidth: 120 },
      {
        key: "orderRate",
        header: "발주정율",
        minWidth: 90,
        maxWidth: 100,
        align: "right",
        cellClassName: "text-right",
        cell: (r) => (r.orderRate != null ? `${r.orderRate}` : ""),
      },
      {
        key: "priceNotUsed",
        header: "단가사용안함",
        minWidth: 100,
        maxWidth: 100,
        align: "center",
        cellClassName: "text-center",
        cell: (r) => (
          <Checkbox
            checked={!!r.priceNotUsed}
            readOnly
            className="pointer-events-none mx-auto"
          />
        ),
      },
      {
        key: "outsourcingOrderIssue",
        header: "외주오더발행여부",
        minWidth: 120,
        maxWidth: 120,
        align: "center",
        cellClassName: "text-center",
        cell: (r) => (
          <Checkbox
            checked={!!r.outsourcingOrderIssue}
            readOnly
            className="pointer-events-none mx-auto"
          />
        ),
      },
      { key: "outsourcingMethod", header: "외주방법 / 사급구분", minWidth: 120, maxWidth: 140 },
      { key: "outsourcingReceiptItemCode", header: "외주입고품목번호", minWidth: 130, maxWidth: 150 },
      { key: "workOrderNo", header: "작지번호", minWidth: 100, maxWidth: 120 },
      { key: "plant", header: "사업장", minWidth: 100, maxWidth: 120 },
      { key: "validDate", header: "유효일자", minWidth: 100, maxWidth: 110 },
      {
        key: "validDateAdjust",
        header: "유효일자 조정",
        minWidth: 110,
        maxWidth: 110,
        align: "center",
        cellClassName: "text-center",
        cell: (r) => (
          <Checkbox
            checked={!!r.validDateAdjust}
            readOnly
            className="pointer-events-none mx-auto"
          />
        ),
      },
      { key: "currencyCode", header: "통화코드", minWidth: 80, maxWidth: 90 },
    ],
    []
  );

  const handleExport = () => {
    if (filteredList.length === 0) return;

    const header = [
      "품목번호",
      "품목명",
      "품목규격",
      "품목재질명",
      "구매처번호",
      "적용일자",
      "구매단가",
      "가단가 여부",
      "창고코드",
      "저장위치코드",
      "발주정율",
      "단가사용안함",
      "외주오더발행여부",
      "외주방법/사급구분",
      "외주입고품목번호",
      "작지번호",
      "사업장",
      "유효일자",
      "유효일자 조정",
      "통화코드",
    ];

    const rowsCsv = filteredList
      .map((r) =>
        [
          r.itemCode,
          r.itemName,
          r.itemSpec,
          r.itemMaterialName ?? "",
          r.supplierCode,
          r.applyDate,
          r.unitPrice.toString(),
          r.isTempPrice ? "Y" : "N",
          r.warehouseCode ?? "",
          r.storageLocationCode ?? "",
          r.orderRate != null ? r.orderRate.toString() : "",
          r.priceNotUsed ? "Y" : "N",
          r.outsourcingOrderIssue ? "Y" : "N",
          r.outsourcingMethod ?? "",
          r.outsourcingReceiptItemCode ?? "",
          r.workOrderNo ?? "",
          r.plant ?? "",
          r.validDate ?? "",
          r.validDateAdjust ? "Y" : "N",
          r.currencyCode ?? r.currency ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const csv = [header.join(","), rowsCsv].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchase-prices.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleSort = () => {
    setSortMode((prev) =>
      prev === "none"
        ? "unitPriceAsc"
        : prev === "unitPriceAsc"
          ? "unitPriceDesc"
          : "none"
    );
  };

  const handleToggleView = () => {
    setPageSize((prev) => (prev === 10 ? 20 : 10));
    setPage(1);
  };

  const handleExcelFile = useCallback(
    async (file: File) => {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["xlsx", "xls"].includes(ext)) {
          setExcelResultMessage(
            "지원하지 않는 파일 형식입니다. .xlsx 또는 .xls 형식의 EXCEL 파일을 선택해 주세요."
          );
          return;
        }

        const XLSX = await import("xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          setExcelResultMessage("워크북에 시트가 없습니다.");
          return;
        }
        const sheet = workbook.Sheets[firstSheet];
        const rows2D: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (!rows2D.length) {
          setExcelResultMessage("시트에 데이터가 없습니다.");
          return;
        }

        const [rawHeader, ...body] = rows2D as [unknown[], ...unknown[][]];
        if (!body.length) {
          setExcelResultMessage("헤더 행만 있고, 데이터 행이 없습니다.");
          return;
        }

        const normalizeHeader = (h: unknown) =>
          String(h ?? "").replace(/\s+/g, "").toLowerCase();
        const header = (rawHeader as unknown[]).map(normalizeHeader);
        const findIndex = (candidates: string[]) =>
          header.findIndex((h) =>
            candidates.some((c) => normalizeHeader(c) === h)
          );

        const itemCodeIdx = findIndex(["품목번호", "itemcode"]);
        const itemNameIdx = findIndex(["품목명", "itemname"]);
        const supplierNameIdx = findIndex(["구매처명", "suppliername"]);
        const supplierCodeIdx = findIndex(["구매처번호", "suppliercode"]);
        const unitPriceIdx = findIndex(["구매단가", "unitprice"]);
        const applyDateIdx = findIndex(["적용일자", "applydate"]);
        const expireDateIdx = findIndex(["유효일자", "expiredate", "유효기간"]);

        if (itemCodeIdx < 0 || itemNameIdx < 0 || unitPriceIdx < 0) {
          setExcelResultMessage(
            "헤더에서 필수 컬럼을 찾을 수 없습니다. '품목번호', '품목명', '구매단가'를 포함해 주세요."
          );
          return;
        }
        const supplierColIdx = supplierNameIdx >= 0 ? supplierNameIdx : supplierCodeIdx;
        if (supplierColIdx < 0) {
          setExcelResultMessage(
            "헤더에서 '구매처번호' 또는 '구매처명' 컬럼을 찾을 수 없습니다."
          );
          return;
        }

        const itemSpecIdx = findIndex(["규격", "itemspec", "품목규격"]);
        const itemMaterialIdx = findIndex(["품목재질명", "itemmaterialname"]);
        const plantIdx = findIndex(["창고", "plant", "사업장", "창고코드"]);
        const storageIdx = findIndex(["저장위치", "저장위치코드"]);
        const currencyIdx = findIndex(["통화", "currency", "통화코드"]);
        const remarksIdx = findIndex(["참고", "remarks", "비고"]);
        const devUnitPriceIdx = findIndex(["개발단가", "devunitprice"]);
        const discountRateIdx = findIndex(["할인율", "discountrate"]);
        const orderRateIdx = findIndex(["발주정율", "orderrate"]);
        const isTempPriceIdx = findIndex(["가단가", "istempprice"]);
        const priceNotUsedIdx = findIndex(["단가사용안함", "pricenotused"]);
        const outsourcingOrderIdx = findIndex(["외주오더발행여부"]);
        const outsourcingMethodIdx = findIndex(["외주방법", "사급구분", "outsourcingmethod"]);
        const outsourcingReceiptIdx = findIndex(["외주입고품목번호"]);
        const workOrderIdx = findIndex(["작지번호", "workorderno"]);
        const validDateAdjustIdx = findIndex(["유효일자조정", "validdateadjust"]);

        const getString = (row: unknown[], idx: number) => {
          if (idx < 0) return "";
          const v = row[idx];
          if (v instanceof Date) return v.toISOString().slice(0, 10);
          return String(v ?? "").trim();
        };
        const getNum = (row: unknown[], idx: number) => {
          if (idx < 0) return null;
          const v = row[idx];
          if (v == null || v === "") return null;
          const n = Number(v);
          return isNaN(n) ? null : n;
        };

        const items: Array<{
          itemCode: string;
          itemName: string;
          itemSpec?: string;
          supplierName: string;
          plant?: string;
          applyDate: string;
          expireDate: string;
          unitPrice: number;
          devUnitPrice?: number;
          discountRate?: number;
          currency?: string;
          remarks?: string;
        }> = [];
        let invalid = 0;

        body.forEach((row) => {
          const itemCode = getString(row, itemCodeIdx);
          const itemName = getString(row, itemNameIdx);
          const supplierName = getString(row, supplierColIdx);
          const unitPriceVal = getNum(row, unitPriceIdx);
          const applyDate = getString(row, applyDateIdx);
          const expireDate = getString(row, expireDateIdx) || applyDate;

          if (!itemCode || !itemName || !supplierName) {
            invalid++;
            return;
          }
          if (unitPriceVal == null || unitPriceVal < 0) {
            invalid++;
            return;
          }
          const applyD = applyDate ? new Date(applyDate) : null;
          const expireD = expireDate ? new Date(expireDate) : null;
          if (!applyD || isNaN(applyD.getTime()) || !expireD || isNaN(expireD.getTime())) {
            invalid++;
            return;
          }

          items.push({
            itemCode,
            itemName,
            itemSpec: getString(row, itemSpecIdx) || undefined,
            supplierName,
            plant: getString(row, plantIdx) || getString(row, storageIdx) || undefined,
            applyDate: applyD.toISOString().slice(0, 10),
            expireDate: expireD.toISOString().slice(0, 10),
            unitPrice: unitPriceVal,
            devUnitPrice: getNum(row, devUnitPriceIdx) ?? undefined,
            discountRate: getNum(row, discountRateIdx) ?? undefined,
            currency: getString(row, currencyIdx) || "KRW",
            remarks: getString(row, remarksIdx) || undefined,
          });
        });

        if (items.length === 0) {
          setExcelResultMessage(
            `등록 가능한 행이 없습니다. 필수값(품목번호, 품목명, 구매처명, 구매단가, 적용일자)을 확인해 주세요. (누락/오류: ${invalid}행)`
          );
          return;
        }

        const res = await fetch("/api/purchase-prices/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const result = await res.json().catch(() => null);

        if (!res.ok) {
          setExcelResultMessage(
            (result as { message?: string })?.message ?? "DB 저장 중 오류가 발생했습니다."
          );
          return;
        }

        const count = (result as { count?: number })?.count ?? 0;
        const invalidFromApi = (result as { invalid?: number })?.invalid ?? 0;

        const listRes = await fetch("/api/purchase-prices");
        const listData = await listRes.json();
        if (listData?.ok && Array.isArray(listData.items)) {
          setRows(listData.items);
        }

        setExcelSelectedFile(null);
        if (excelFileInputRef.current) excelFileInputRef.current.value = "";
        setExcelResultMessage(
          `업로드 결과\n- 전체 행: ${body.length}행\n- 신규 등록: ${count}행\n- 누락/오류: ${invalid + invalidFromApi}행`
        );
      } catch (err) {
        console.error(err);
        setExcelResultMessage(
          "EXCEL 파일 처리 중 오류가 발생했습니다. 파일 형식과 헤더(품목번호, 품목명, 구매처명, 구매단가, 적용일자 등)를 확인해 주세요."
        );
      }
    },
    []
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      {loadError && (
        <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <PageHeader
        title="구매단가 관리"
        description="품목·구매처별 구매단가 및 유효기간을 관리합니다."
        actions={
          <div className="flex gap-2">
            <CrudActions
              onRegister={() => {
                setCreateOpen(true);
              }}
              onEdit={() => {
                if (!selectedRowId) return;
                setEditOpen(true);
              }}
              onDelete={() => {
                if (!selectedRowId) return;
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return;
                const ok = window.confirm(
                  `선택한 구매단가를 삭제하시겠습니까?\n\n품목번호: ${row.itemCode}\n품목명: ${row.itemName}\n구매처: ${row.supplierName ?? row.supplierCode}`
                );
                if (!ok) return;
                setRows((prev) => prev.filter((r) => r.id !== selectedRowId));
                setSelectedRowId(null);
                setPage(1);
              }}
              editDisabled={!selectedRowId}
              deleteDisabled={!selectedRowId}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-1 flex items-center gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="h-4 w-4" />
              변경이력
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-1 flex items-center gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={() => {
                setExcelSelectedFile(null);
                setExcelResultMessage(null);
                setExcelSheetOpen(true);
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              EXCEL 업로드
            </Button>
          </div>
        }
      />

      <SearchPanel
        description="품목번호·품목명·구매처명으로 구매단가를 조회합니다."
        onSearch={handleSearch}
        onReset={resetFilters}
        totalCountLabel={`총 ${filteredList.length.toLocaleString("ko-KR")}건이 조회되었습니다.`}
      >
        <div ref={searchRef} className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">품목번호</Label>
            <Input
              value={filters.itemCode}
              onChange={(e) => handleFilterChange("itemCode", e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">품목명</Label>
            <Input
              value={filters.itemName}
              onChange={(e) => handleFilterChange("itemName", e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">구매처명</Label>
            <Input
              value={filters.supplierName}
              onChange={(e) =>
                handleFilterChange("supplierName", e.target.value)
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </SearchPanel>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-end space-y-0">
            <DataGridToolbar
            onExport={handleExport}
            onSort={handleToggleSort}
            onView={handleToggleView}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1">
            <MasterListGrid<PurchasePriceRecord>
              columns={columns}
              data={paged}
              keyExtractor={(r) => r.id}
              onRowClick={(row) => setSelectedRowId(row.id)}
              selectedRowId={selectedRowId}
              variant="striped"
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
              }}
              getRowClassName={() => ""}
              maxHeight="100%"
              emptyMessage={loadError ? loadError : !hasSearched ? "검색 버튼을 클릭하면 조회됩니다." : loading ? "조회 중..." : "조건에 맞는 구매단가가 없습니다."}
            />
          </div>
        </CardContent>
      </Card>

      <PurchasePriceSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSave={(draft) => {
          const id = `pp-${Date.now()}`;
          setRows((prev) => [{ id, ...draft }, ...prev]);
          setSelectedRowId(null);
          setPage(1);
        }}
      />

      <PurchasePriceSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialDraft={
          selectedRowId
            ? (() => {
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return undefined;
                const { id, ...rest } = row;
                return rest;
              })()
            : undefined
        }
        onSave={(draft, options) => {
          if (!selectedRowId) return;

          const existing = rows.find((r) => r.id === selectedRowId);
          if (!existing) return;

          // 단가가 변경된 경우 변경이력에 기록
          if (existing.unitPrice !== draft.unitPrice) {
            const now = new Date();
            const changedAt = `${now.getFullYear()}-${String(
              now.getMonth() + 1
            ).padStart(2, "0")}-${String(now.getDate()).padStart(
              2,
              "0"
            )} ${String(now.getHours()).padStart(2, "0")}:${String(
              now.getMinutes()
            ).padStart(2, "0")}`;

            const log: PurchasePriceChangeLog = {
              id: `pp-chg-${Date.now()}`,
              itemCode: existing.itemCode,
              itemName: existing.itemName,
              supplierName: existing.supplierName ?? existing.supplierCode ?? "",
              previousUnitPrice: existing.unitPrice,
              newUnitPrice: draft.unitPrice,
              changedAt,
              reason: options?.editReason,
            };

            setChangeLogs((prev) => [log, ...prev]);
          }

          setRows((prev) =>
            prev.map((r) => (r.id === selectedRowId ? { ...r, ...draft } : r))
          );
        }}
      />

      {/* EXCEL 업로드 시트 */}
      <Sheet
        open={excelSheetOpen}
        onOpenChange={(open) => {
          setExcelSheetOpen(open);
          if (!open) {
            setExcelSelectedFile(null);
            setExcelResultMessage(null);
          }
        }}
        position="center"
      >
        <SheetContent className="sm:max-w-xl flex flex-col bg-white">
          <SheetHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
            <div>
              <SheetTitle className="text-lg">구매단가 EXCEL 업로드</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-1">
                품목번호, 품목명, 구매처명, 구매단가, 적용일자를 포함한 EXCEL 파일을 업로드하여 구매단가를 일괄 등록합니다.
              </SheetDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={async () => {
                const XLSX = await import("xlsx-js-style");
                const wb = XLSX.utils.book_new();
                // DB Table dbo.PurchasePrice 컬럼 순서와 동일: ItemCode, ItemName, ItemSpec, SupplierName, ApplyDate, ExpireDate, UnitPrice, Plant, DevUnitPrice, DiscountRate, Currency, Remarks
                // Data Grid 컬럼과 동일한 항목·순서로 양식 생성
                const headers = columns.map((c) => c.header);
                const ws = XLSX.utils.aoa_to_sheet([headers]);
                const headerColor = "9DC3E6";
                for (let c = 0; c < headers.length; c += 1) {
                  const addr = (XLSX.utils as any).encode_cell({ r: 0, c });
                  const cell = (ws as any)[addr];
                  if (cell) {
                    (cell as any).s = {
                      fill: { patternType: "solid", fgColor: { rgb: headerColor } },
                      font: { bold: true, sz: 8, color: { rgb: "000000" } },
                      alignment: { horizontal: "center", vertical: "center" },
                    };
                  }
                }
                XLSX.utils.book_append_sheet(wb, ws, "구매단가");
                (XLSX as any).writeFile(wb, "구매단가_양식.xlsx");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              양식 다운로드
            </Button>
          </SheetHeader>

          <div className="mt-4 flex-1 overflow-auto text-xs space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">업로드 파일</Label>
              <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50/80">
                <input
                  ref={excelFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setExcelSelectedFile(file);
                    setExcelResultMessage(null);
                  }}
                />
                <Input
                  readOnly
                  value={excelSelectedFile?.name ?? ""}
                  placeholder="파일을 선택하세요"
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => excelFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    setExcelSelectedFile(null);
                    if (excelFileInputRef.current) excelFileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {excelResultMessage && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800 whitespace-pre-wrap">
                {excelResultMessage}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center gap-2 border-t pt-3">
            <Button
              size="sm"
              onClick={() => {
                if (excelSelectedFile) void handleExcelFile(excelSelectedFile);
                else setExcelResultMessage("업로드할 EXCEL 파일을 선택해 주세요.");
              }}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              업로드
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExcelSheetOpen(false)}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              닫기
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 변경이력 모달 */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} position="center">
        <SheetContent className="sm:max-w-3xl sm:h-[70vh] overflow-hidden">
          <SheetHeader>
            <SheetTitle>구매단가 변경이력</SheetTitle>
            <SheetDescription className="text-xs">
              화면에서 수정한 구매단가의 변경 이력을 보여줍니다. (데모: 새로고침
              시 이력은 초기화됩니다.)
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-1 min-h-0 flex-col text-xs">
            {changeLogs.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground">
                아직 기록된 변경이력이 없습니다.
              </div>
            ) : (
              <MasterListGrid<PurchasePriceChangeLog>
                columns={[
                  {
                    key: "seq",
                    header: "순",
                    minWidth: 40,
                    maxWidth: 50,
                    align: "center",
                    cellClassName: "text-center text-muted-foreground",
                    cell: (_row, index) => index + 1,
                  },
                  {
                    key: "itemCode",
                    header: "품목번호",
                    minWidth: 140,
                  },
                  {
                    key: "itemName",
                    header: "품목명",
                    minWidth: 180,
                  },
                  {
                    key: "supplierName",
                    header: "구매처명",
                    minWidth: 140,
                  },
                  {
                    key: "previousUnitPrice",
                    header: "이전 단가",
                    minWidth: 100,
                    align: "right",
                    cellClassName: "text-right text-muted-foreground",
                    cell: (r) =>
                      r.previousUnitPrice.toLocaleString("ko-KR"),
                  },
                  {
                    key: "newUnitPrice",
                    header: "변경 단가",
                    minWidth: 100,
                    align: "right",
                    cellClassName: "text-right font-semibold",
                    cell: (r) => r.newUnitPrice.toLocaleString("ko-KR"),
                  },
                  {
                    key: "changedAt",
                    header: "변경일시",
                    minWidth: 140,
                  },
                  {
                    key: "reason",
                    header: "수정사유",
                    minWidth: 200,
                  },
                ]}
                data={changeLogs}
                keyExtractor={(r) => r.id}
                maxHeight="100%"
                noHorizontalScroll
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

