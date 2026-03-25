"use client";

import { useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { formatCurrency } from "@/lib/utils";
import { purchaseOrderSummaries } from "@/lib/mock/purchase-orders";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { SearchPanel } from "@/components/common/search-panel";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

type SearchParams = {
  plant: string;
  fromDueDate: string;
  toDueDate: string;
};

const initialParams: SearchParams = {
  plant: "",
  fromDueDate: "",
  toDueDate: "",
};

type RowKind = "data" | "subtotal_usage" | "subtotal_model" | "total";

type ClosingRow = PurchaseOrderSummary & {
  mergeKey: string;
  firstInGroup: boolean;
  rowKind: RowKind;
  /** SUB TOTAL(용도별) 행에서 어떤 용도 집계인지 표시 */
  usageKindForSubtotal?: "outsourced" | "raw";
  /** 같은 차종 내에서 용도별 SUB TOTAL 그룹의 첫 행 여부 (병합 효과용) */
  isFirstUsageSubtotalForModel?: boolean;
};

export default function ClosingStatusPage() {
  const [draft, setDraft] = useState<SearchParams>(initialParams);
  const [criteria, setCriteria] = useState<SearchParams>(initialParams);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("export");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);

  const getUsageKind = (row: { poNumber: string }): "outsourced" | "raw" => {
    const lastChar = row.poNumber.slice(-1);
    const code = lastChar.charCodeAt(0);
    return code % 2 === 0 ? "outsourced" : "raw";
  };

  const filtered: ClosingRow[] = useMemo(() => {
    const base = purchaseOrderSummaries.filter((po) => {
      const dueDate = new Date(po.dueDate);
      const matchFrom =
        !criteria.fromDueDate || dueDate >= new Date(criteria.fromDueDate);
      const matchTo =
        !criteria.toDueDate || dueDate <= new Date(criteria.toDueDate);

      // plant 는 데모용으로 UI에만 사용 (현재 데이터에는 사업장 정보 없음)
      return matchFrom && matchTo;
    });

    // 차종(PO 앞 3자리) + 업체코드 + 업체명 기준으로 병합 키 생성 후 정렬
    const withKey: ClosingRow[] = base
      .map((po) => {
        const modelCode = po.poNumber.slice(0, 3);
        const mergeKey = `${modelCode}||${po.supplierId}||${po.supplierName}`;
        return {
          ...po,
          mergeKey,
          firstInGroup: false,
          rowKind: "data" as const,
        };
      })
      .sort((a, b) => a.mergeKey.localeCompare(b.mergeKey, "ko-KR"));

    let prevKey = "";
    return withKey.map((row) => {
      const firstInGroup = row.mergeKey !== prevKey;
      prevKey = row.mergeKey;
      return { ...row, firstInGroup };
    });
  }, [criteria]);

  const displayRows: ClosingRow[] = useMemo(() => {
    const byModel = new Map<string, ClosingRow[]>();
    filtered.forEach((row) => {
      const modelCode = row.poNumber.slice(0, 3);
      if (!byModel.has(modelCode)) byModel.set(modelCode, []);
      byModel.get(modelCode)!.push(row);
    });

    const modelKeys = Array.from(byModel.keys()).sort((a, b) =>
      a.localeCompare(b, "ko-KR")
    );

    const result: ClosingRow[] = [];
    let grandTotal = 0;

    for (const modelCode of modelKeys) {
      const rows = byModel.get(modelCode)!;
      const usageTotals = new Map<"outsourced" | "raw", number>();
      let groupTotal = 0;

      rows.forEach((r) => {
        result.push(r);
        grandTotal += r.totalAmount;
        groupTotal += r.totalAmount;

        const usageKind = getUsageKind(r);
        usageTotals.set(
          usageKind,
          (usageTotals.get(usageKind) ?? 0) + r.totalAmount
        );
      });

      // 용도별 SUB TOTAL (외주품 / 원자재 각각)
      let isFirstUsageSubtotal = true;
      usageTotals.forEach((amount, usageKind) => {
        result.push({
          ...rows[0],
          id: `subtotal-usage-${modelCode}-${usageKind}`,
          mergeKey: `subtotal-usage-${modelCode}-${usageKind}`,
          firstInGroup: false,
          rowKind: "subtotal_usage",
          totalAmount: amount,
          usageKindForSubtotal: usageKind,
          isFirstUsageSubtotalForModel: isFirstUsageSubtotal,
        });
        isFirstUsageSubtotal = false;
      });

      // 차종별 SUB TOTAL
      result.push({
        ...rows[0],
        id: `subtotal-model-${modelCode}`,
        mergeKey: `subtotal-model-${modelCode}`,
        firstInGroup: false,
        rowKind: "subtotal_model",
        totalAmount: groupTotal,
      });
    }

    if (modelKeys.length > 0) {
      result.push({
        ...byModel.get(modelKeys[0])![0],
        id: "total-all",
        mergeKey: "total-all",
        firstInGroup: false,
        rowKind: "total",
        totalAmount: grandTotal,
      });
    }

    return result;
  }, [filtered]);

  const totalCount = filtered.length;
  const closedCount = filtered.filter((po) => po.status === "closed").length;
  const closedRate =
    totalCount === 0 ? 0 : Math.round((closedCount / totalCount) * 100);

  const closedAmount = filtered
    .filter((po) => po.status === "closed")
    .reduce((sum, po) => sum + po.totalAmount, 0);

  const openAmount = filtered
    .filter(
      (po) =>
        po.status === "draft" ||
        po.status === "approved" ||
        po.status === "issued" ||
        po.status === "confirmed" ||
        po.status === "partial" ||
        po.status === "received"
    )
    .reduce((sum, po) => sum + po.totalAmount, 0);

  const exportExcel = useCallback(async () => {
    if (displayRows.length === 0) return;

    const XLSX = await import("xlsx-js-style");
    const header = ["차종", "업체코드", "업체명", "용도/구분", "합계금액"];
    const data = displayRows.map((row) => {
      const modelCode = row.poNumber.slice(0, 3);

      let usageLabel = "";
      if (row.rowKind === "data") {
        const kind = getUsageKind(row);
        usageLabel = kind === "outsourced" ? "외주품" : "원자재";
      } else if (row.rowKind === "subtotal_usage") {
        usageLabel =
          row.usageKindForSubtotal === "outsourced"
            ? `${modelCode} 외주품 SUB TOTAL`
            : `${modelCode} 원자재 SUB TOTAL`;
      } else if (row.rowKind === "subtotal_model") {
        usageLabel = `${modelCode} 차종별 SUB TOTAL`;
      } else {
        usageLabel = "TOTAL";
      }

      return [
        modelCode,
        row.supplierId,
        row.supplierName,
        usageLabel,
        row.totalAmount,
      ];
    });

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
    XLSX.utils.book_append_sheet(wb, ws, "마감현황");
    const fileName = `po_closing_${new Date().toISOString().slice(0, 10)}.xlsx`;
    (XLSX as any).writeFile(wb, fileName);
  }, [displayRows, getUsageKind]);

  const handleSearch = useCallback(() => {
    setCriteria(draft);
  }, [draft]);

  const resetFilters = useCallback(() => {
    setDraft(initialParams);
    setCriteria(initialParams);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="마감현황"
        description="기간·공급사·상태 기준으로 구매오더의 마감 현황을 조회합니다. (데모)"
      />

      <SearchPanel
        onSearch={handleSearch}
        onReset={resetFilters}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">사업장</span>
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              value={draft.plant}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  plant: e.target.value,
                }))
              }
            >
              <option value="">전체</option>
              <option value="gimhae">김해공장</option>
              <option value="ulsan">울산공장</option>
              <option value="pyeongtaek">평택공장</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">납기일자</span>
            <div className="flex items-center gap-1">
              <input
                type="date"
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                value={draft.fromDueDate}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    fromDueDate: e.target.value,
                  }))
                }
              />
              <span className="text-[11px] text-muted-foreground">~</span>
              <input
                type="date"
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                value={draft.toDueDate}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    toDueDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* 네 번째 칼럼은 비워두어 2개 조건 중심의 단순한 레이아웃 유지 */}
        </div>
      </SearchPanel>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            구매오더 마감현황
          </span>
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => {
              setGridSettingsTab("export");
              setGridSettingsOpen(true);
            }}
            onSort={() => {
              setGridSettingsTab("sort");
              setGridSettingsOpen(true);
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
            <MasterListGrid<ClosingRow>
              columns={[
                {
                  key: "modelCode",
                  header: "차종",
                  minWidth: 120,
                  cell: (row) => {
                    const modelCode = row.poNumber.slice(0, 3);
                    if (row.rowKind === "data") {
                      return row.firstInGroup ? modelCode : "";
                    }
                    if (row.rowKind === "total") {
                      return "[ TOTAL ]";
                    }
                    // SUB TOTAL 행: 동일 차종 내 용도별 SUB TOTAL이 여러 개일 경우
                    // 첫 번째 용도별 SUB TOTAL과 차종별 SUB TOTAL에서만 "[SUB TOTAL]" 표시
                    if (
                      row.rowKind === "subtotal_usage" &&
                      !row.isFirstUsageSubtotalForModel
                    ) {
                      return "";
                    }
                    return "[SUB TOTAL]";
                  },
                },
                {
                  key: "supplierId",
                  header: "업체코드",
                  minWidth: 120,
                  cell: (row) => {
                    if (row.rowKind === "data") {
                      return row.firstInGroup ? row.supplierId : "";
                    }
                    if (row.rowKind === "subtotal_usage") {
                      // 같은 차종 내 여러 용도별 SUB TOTAL 중 첫 번째 행에만 "[용도별]" 표시
                      return row.isFirstUsageSubtotalForModel ? "[용도별]" : "";
                    }
                    if (row.rowKind === "subtotal_model") {
                      return "[차종별]";
                    }
                    return "[합 계]";
                  },
                },
                {
                  key: "supplierName",
                  header: "업체명",
                  minWidth: 180,
                  cell: (row) => {
                    if (row.rowKind === "data") {
                      return row.firstInGroup ? row.supplierName : "";
                    }
                    // SUB TOTAL / TOTAL 행에서는 업체명 컬럼은 공백으로 두고,
                    // (차종) 용도 표시는 '용도' 컬럼에서 처리한다.
                    return "";
                  },
                },
                {
                  key: "usage",
                  header: "용도",
                  minWidth: 120,
                  cell: (row) => {
                    const modelCode = row.poNumber.slice(0, 3);
                    if (row.rowKind === "data") {
                      // 데모용 용도 더미 데이터: PO 번호를 기준으로
                      // 짝수/홀수에 따라 외주품/원자재를 번갈아 표시
                      const kind = getUsageKind(row);
                      return kind === "outsourced" ? "[ 외주품 ]" : "[ 원자재 ]";
                    }
                    if (row.rowKind === "subtotal_usage") {
                      // 데모: 차종별 용도 집계 라벨 (외주품 / 원자재 각각)
                      if (row.usageKindForSubtotal === "outsourced") {
                        return `[${modelCode}] 외주품`;
                      }
                      if (row.usageKindForSubtotal === "raw") {
                        return `[${modelCode}] 원자재`;
                      }
                      return `[${modelCode}] 용도별`;
                    }
                    if (row.rowKind === "subtotal_model") {
                      // 데모: 차종별 집계 라벨
                      return `[${modelCode}]`;
                    }
                    // TOTAL 행
                    return "[ TOTAL ]";
                  },
                },
                {
                  key: "itemName",
                  header: "품명",
                  minWidth: 260,
                  cell: (row) => {
                    if (row.rowKind !== "data") return "";
                    const modelCode = row.poNumber.slice(0, 3);
                    switch (modelCode) {
                      case "AR2":
                        return "AR2-INSULATION BODY SIDE 내 외주판";
                      case "LJL":
                        return "TRIM-RR RH WHL HOUSE";
                      case "P32":
                      case "P32R":
                        return "SPCR 외장 P32R 외장간";
                      case "X81":
                      case "X81C":
                        return "RR CTR 외주판";
                      default:
                        return `${modelCode} 관련 부품`;
                    }
                  },
                },
                {
                  key: "receiveAmount",
                  header: "입고금액",
                  minWidth: 140,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => {
                    const vat = Math.round(row.totalAmount * 0.1);
                    const net = row.totalAmount - vat;
                    return formatCurrency(net);
                  },
                },
                {
                  key: "vatAmount",
                  header: "VAT금액",
                  minWidth: 120,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => {
                    const vat = Math.round(row.totalAmount * 0.1);
                    return formatCurrency(vat);
                  },
                },
                {
                  key: "totalAmount",
                  header: "합계금액",
                  minWidth: 140,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.totalAmount),
                },
              ]}
              data={displayRows}
              keyExtractor={(row) => row.id}
              maxHeight="100%"
              emptyMessage="조건에 맞는 마감 현황이 없습니다."
              getRowClassName={(row, index) => {
                if (row.rowKind === "total") {
                  const density = compactView ? "" : "h-10";
                  return [
                    "bg-pink-100 dark:bg-pink-900/60 font-semibold",
                    density,
                  ]
                    .filter(Boolean)
                    .join(" ");
                }
                if (
                  row.rowKind === "subtotal_usage" ||
                  row.rowKind === "subtotal_model"
                ) {
                  const density = compactView ? "" : "h-10";
                  return [
                    "bg-sky-100 dark:bg-sky-900/60 font-semibold",
                    density,
                  ]
                    .filter(Boolean)
                    .join(" ");
                }
                const striped =
                  stripedRows && index % 2 === 1
                    ? "bg-slate-50 dark:bg-slate-800/70"
                    : "";
                const density = compactView ? "" : "h-10";
                return [striped, density].filter(Boolean).join(" ");
              }}
              pagination={{
                page: 1,
                pageSize: displayRows.length === 0 ? 10 : displayRows.length,
                total: displayRows.length,
                onPageChange: () => {},
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
                  현재 검색된 구매오더 마감현황 데이터가 EXCEL 파일(.xlsx)로
                  다운로드됩니다.
                </p>
                <Button size="sm" onClick={() => void exportExcel()}>
                  EXCEL 내보내기
                </Button>
              </div>
            )}

            {gridSettingsTab === "sort" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  이 화면은 차종/업체 단위 집계용으로 설계되어 별도의 정렬
                  설정을 제공하지 않습니다.
                </p>
              </div>
            )}

            {gridSettingsTab === "columns" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  현재 버전에서는 컬럼 표시 설정을 변경할 수 없습니다.
                </p>
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
    </div>
  );
}

