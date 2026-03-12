"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrudActions } from "@/components/common/crud-actions";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { purchasePrices } from "@/lib/mock/purchase-prices";
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
import { History } from "lucide-react";
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
  const [rows, setRows] = useState<PurchasePriceRecord[]>(purchasePrices);
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
  const [showDevUnitPrice, setShowDevUnitPrice] = useState(true);
  const [showDiscountRate, setShowDiscountRate] = useState(true);
  const [changeLogs, setChangeLogs] = useState<PurchasePriceChangeLog[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

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
        !row.supplierName
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

  const columns = useMemo(() => {
    const base = [
      {
        key: "itemCode",
        header: "품목번호",
        minWidth: 140,
        maxWidth: 140,
      },
      {
        key: "itemName",
        header: "품목명",
        minWidth: 180,
        maxWidth: 200,
      },
      {
        key: "itemSpec",
        header: "품목규격",
        minWidth: 200,
        maxWidth: 220,
      },
      {
        key: "supplierName",
        header: "구매처명",
        minWidth: 140,
        maxWidth: 160,
      },
      {
        key: "applyDate",
        header: "적용일자",
        minWidth: 110,
        maxWidth: 110,
      },
      {
        key: "expireDate",
        header: "유효기간",
        minWidth: 110,
        maxWidth: 110,
      },
      {
        key: "unitPrice",
        header: "구매단가",
        minWidth: 110,
        maxWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (r: PurchasePriceRecord) => r.unitPrice.toLocaleString("ko-KR"),
      },
    ] as const;

    const dynamic: any[] = [...base];

    if (showDevUnitPrice) {
      dynamic.push({
        key: "devUnitPrice",
        header: "개발단가",
        minWidth: 110,
        maxWidth: 110,
        align: "right" as const,
        cellClassName: "text-right text-muted-foreground",
        cell: (r: PurchasePriceRecord) =>
          r.devUnitPrice.toLocaleString("ko-KR"),
      });
    }

    if (showDiscountRate) {
      dynamic.push({
        key: "discountRate",
        header: "할인율(%)",
        minWidth: 90,
        maxWidth: 90,
        align: "right" as const,
        cellClassName: "text-right",
      });
    }

    dynamic.push({
      key: "currency",
      header: "통화",
      minWidth: 70,
      maxWidth: 70,
    });

    return dynamic;
  }, [showDevUnitPrice, showDiscountRate]);

  const handleExport = () => {
    if (filteredList.length === 0) return;

    const header = [
      "품목번호",
      "품목명",
      "품목규격",
      "구매처명",
      "공장",
      "적용일자",
      "유효기간",
      "구매단가",
      "개발단가",
      "할인율(%)",
      "통화",
      "비고",
    ];

    const rowsCsv = filteredList
      .map((r) =>
        [
          r.itemCode,
          r.itemName,
          r.itemSpec,
          r.supplierName,
          r.plant,
          r.applyDate,
          r.expireDate,
          r.unitPrice.toString(),
          r.devUnitPrice.toString(),
          r.discountRate.toString(),
          r.currency,
          r.remarks ?? "",
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

  const handleToggleColumns = () => {
    setShowDevUnitPrice((prev) => !prev);
    setShowDiscountRate((prev) => !prev);
  };

  const handleToggleView = () => {
    setPageSize((prev) => (prev === 10 ? 20 : 10));
    setPage(1);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
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
                  `선택한 구매단가를 삭제하시겠습니까?\n\n품목번호: ${row.itemCode}\n품목명: ${row.itemName}\n구매처: ${row.supplierName}`
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
          </div>
        }
      />

      <SearchPanel
        description="품목번호·품목명·구매처명으로 구매단가를 조회합니다."
        onSearch={() => {
          // 현재는 입력 변경 시 실시간 필터링이므로 검색 버튼은 시각적 역할만 수행
          // 실제 검색 버튼 동작이 필요해지면 draft/criteria 패턴으로 확장 가능합니다.
        }}
        onReset={resetFilters}
        totalCountLabel={`총 ${filteredList.length.toLocaleString("ko-KR")}건이 조회되었습니다.`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
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
            onColumns={handleToggleColumns}
            onView={handleToggleView}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
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
              emptyMessage="조회된 구매단가가 없습니다. 검색 조건을 조정해 보세요."
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
              supplierName: existing.supplierName,
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

