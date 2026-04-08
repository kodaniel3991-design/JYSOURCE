"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { formatCurrency } from "@/lib/utils";
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
import { apiPath } from "@/lib/api-path";

// ── 날짜 헬퍼 ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const firstOfMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};

// ── 타입 ──────────────────────────────────────────────────────────────────────
type RawItem = {
  supplierCode: string;
  supplierName: string;
  itemCode: string;
  itemName: string;
  vehicleModel: string;
  form: string;
  inputQty: number;
  inputAmount: number;
  taxAmount: number;
  totalWithTax: number;
  inputDate: string;
};

type RowKind = "data" | "subtotal_form" | "subtotal_model" | "total_form" | "total_model" | "total_all";

type ClosingRow = Omit<RawItem, "inputQty"> & {
  inputQty?: number;
  id: string;
  rowKind: RowKind;
  mergeKey: string;
  firstInGroup: boolean;
  subtotalFormKind?: string;
  isFirstFormSubtotalForModel?: boolean;
  totalAmount: number;
  itemCount?: number;
};

export default function ClosingStatusPage() {
  // 사업장
  const [factoryCode, setFactoryCode] = useCachedState("closing/factoryCode", "");
  const [factoryName, setFactoryName] = useCachedState("closing/factoryName", "");

  // 검색 조건
  const [dateFrom, setDateFrom] = useCachedState("closing/dateFrom", firstOfMonthStr());
  const [dateTo,   setDateTo]   = useCachedState("closing/dateTo",   todayStr());

  // 데이터
  const [rawItems, setRawItems]   = useCachedState<RawItem[]>("closing/rawItems", []);
  const [loading,  setLoading]    = useState(false);

  // 그리드 설정
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab,  setGridSettingsTab]  = useState<"export" | "sort" | "columns" | "view">("export");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);

  // ── 로그인 사업장 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (factoryCode) return; // 캐시 있으면 스킵
    fetch(apiPath("/api/auth/me"))
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.ok || !d.factory) return;
        setFactoryCode(d.factory);
        // 사업장명 조회
        const fr = await fetch(apiPath("/api/factories"));
        const fd = await fr.json();
        if (fd.ok && Array.isArray(fd.factories)) {
          const match = fd.factories.find(
            (f: { FactoryCode: string; FactoryName: string }) => f.FactoryCode === d.factory
          );
          if (match) setFactoryName(match.FactoryName);
        }
      })
      .catch(() => {});
  }, []);

  // ── 조회 ────────────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    const p = new URLSearchParams();
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo)   p.set("dateTo",   dateTo);
    setLoading(true);
    fetch(apiPath(`/api/purchase-inputs/closing?${p}`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRawItems(d.items ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  // ── 디스플레이 행 생성 ───────────────────────────────────────────────────────
  const displayRows: ClosingRow[] = useMemo(() => {
    if (rawItems.length === 0) return [];

    // ── 1단계: (차종, 형태, 업체) 기준으로 집계 → 대표품목 외 N건 ──────────────
    type GroupedItem = Omit<RawItem, "itemCode" | "inputQty"> & {
      itemCode: string;
      itemCount: number; // 해당 그룹의 총 건수
    };

    const supplierGroupMap = new Map<string, {
      first: RawItem;
      count: number;
      inputAmount: number;
      taxAmount: number;
      totalWithTax: number;
    }>();

    rawItems.forEach((item) => {
      const key = `${item.vehicleModel}||${item.form}||${item.supplierCode}`;
      if (!supplierGroupMap.has(key)) {
        supplierGroupMap.set(key, {
          first: item,
          count: 0,
          inputAmount: 0,
          taxAmount: 0,
          totalWithTax: 0,
        });
      }
      const g = supplierGroupMap.get(key)!;
      g.count        += 1;
      g.inputAmount  += item.inputAmount;
      g.taxAmount    += item.taxAmount;
      g.totalWithTax += item.totalWithTax;
    });

    const groupedItems: GroupedItem[] = Array.from(supplierGroupMap.values()).map(({ first, count, inputAmount, taxAmount, totalWithTax }) => ({
      ...first,
      itemName:     count > 1 ? `${first.itemName} 외 ${count - 1}건` : first.itemName,
      itemCount:    count,
      inputAmount,
      taxAmount,
      totalWithTax,
    }));

    // ── 2단계: 차종 → 형태 → 업체 순 그룹화 ──────────────────────────────────
    const byModel = new Map<string, Map<string, GroupedItem[]>>();
    groupedItems.forEach((item) => {
      if (!byModel.has(item.vehicleModel)) byModel.set(item.vehicleModel, new Map());
      const byForm = byModel.get(item.vehicleModel)!;
      if (!byForm.has(item.form)) byForm.set(item.form, []);
      byForm.get(item.form)!.push(item);
    });

    const modelKeys = Array.from(byModel.keys()).sort((a, b) => a.localeCompare(b, "ko-KR"));
    const result: ClosingRow[] = [];
    let grandTotal = 0;
    let rowSeq = 0;

    for (const modelCode of modelKeys) {
      const byForm = byModel.get(modelCode)!;
      const formKeys = Array.from(byForm.keys()).sort((a, b) => a.localeCompare(b, "ko-KR"));
      let modelTotal = 0;
      let isFirstFormSubtotal = true;

      let isFirstRowInModel = true;

      for (const formKey of formKeys) {
        const items = byForm.get(formKey)!;
        // 업체코드 기준 정렬
        items.sort((a, b) => a.supplierCode.localeCompare(b.supplierCode));
        let formTotal = 0;

        items.forEach((item) => {
          const mergeKey = `${modelCode}||${formKey}||${item.supplierCode}`;
          const amt = item.totalWithTax;
          formTotal  += amt;
          modelTotal += amt;
          grandTotal += amt;
          result.push({
            ...item,
            id: `data-${rowSeq++}`,
            rowKind: "data",
            mergeKey,
            firstInGroup: isFirstRowInModel, // 차종 내 첫 번째 데이터 행만 true
            totalAmount: amt,
          });
          isFirstRowInModel = false;
        });

        // 형태별 SUB TOTAL
        const rep = items[0];
        result.push({
          ...rep,
          id: `subtotal-form-${modelCode}-${formKey}`,
          rowKind: "subtotal_form",
          mergeKey: `subtotal-form-${modelCode}-${formKey}`,
          firstInGroup: false,
          subtotalFormKind: formKey,
          isFirstFormSubtotalForModel: isFirstFormSubtotal,
          totalAmount: formTotal,
        });
        isFirstFormSubtotal = false;
      }

      // 차종별 SUB TOTAL
      const repModel = byForm.get(formKeys[0])![0];
      result.push({
        ...repModel,
        id: `subtotal-model-${modelCode}`,
        rowKind: "subtotal_model",
        mergeKey: `subtotal-model-${modelCode}`,
        firstInGroup: false,
        totalAmount: modelTotal,
      });
    }

    if (modelKeys.length === 0) return result;

    const rep0 = byModel.get(modelKeys[0])!.values().next().value![0];

    // ── TOTAL 구역 1: 용도별 합계 (전체 차종 통합, 용도 단위) ────────────────
    const totalByForm = new Map<string, number>();
    groupedItems.forEach((item) => {
      totalByForm.set(item.form, (totalByForm.get(item.form) ?? 0) + item.totalWithTax);
    });
    const formTotalKeys = Array.from(totalByForm.keys()).sort((a, b) => a.localeCompare(b, "ko-KR"));
    formTotalKeys.forEach((formKey, idx) => {
      result.push({
        ...rep0,
        id: `total-form-${formKey}`,
        rowKind: "total_form",
        mergeKey: `total-form-${formKey}`,
        firstInGroup: idx === 0,
        subtotalFormKind: formKey,
        totalAmount: totalByForm.get(formKey)!,
      });
    });

    // ── TOTAL 구역 2: 차종별 합계 (전체 용도 통합, 차종 단위) ────────────────
    const totalByModel = new Map<string, number>();
    groupedItems.forEach((item) => {
      totalByModel.set(item.vehicleModel, (totalByModel.get(item.vehicleModel) ?? 0) + item.totalWithTax);
    });
    modelKeys.forEach((modelCode, idx) => {
      result.push({
        ...rep0,
        vehicleModel: modelCode,
        id: `total-model-${modelCode}`,
        rowKind: "total_model",
        mergeKey: `total-model-${modelCode}`,
        firstInGroup: idx === 0,
        totalAmount: totalByModel.get(modelCode)!,
      });
    });

    // ── TOTAL 구역 3: 최종 합계 ────────────────────────────────────────────
    result.push({
      ...rep0,
      id: "total-all",
      rowKind: "total_all",
      mergeKey: "total-all",
      firstInGroup: false,
      totalAmount: grandTotal,
    });

    return result;
  }, [rawItems]);

  // ── 엑셀 내보내기 ────────────────────────────────────────────────────────────
  const exportExcel = useCallback(async () => {
    if (displayRows.length === 0) return;
    const XLSX = await import("xlsx-js-style");
    const header = ["차종", "업체코드", "업체명", "용도", "품명", "입고금액", "VAT금액", "합계금액"];
    const data = displayRows.map((row) => {
      let formLabel = "";
      if (row.rowKind === "data") {
        formLabel = `[ ${row.form} ]`;
      } else if (row.rowKind === "subtotal_form") {
        formLabel = `[${row.vehicleModel}] ${row.subtotalFormKind} SUB TOTAL`;
      } else if (row.rowKind === "subtotal_model") {
        formLabel = `[${row.vehicleModel}] 차 종 SUB TOTAL`;
      } else if (row.rowKind === "total_form") {
        formLabel = `[ ${row.subtotalFormKind} ]`;
      } else if (row.rowKind === "total_model") {
        formLabel = `[${row.vehicleModel}]`;
      } else {
        formLabel = "[ TOTAL ]";
      }
      const isData = row.rowKind === "data";
      const isSub = row.rowKind === "subtotal_form" || row.rowKind === "subtotal_model";
      const isTotalSub = row.rowKind === "total_form" || row.rowKind === "total_model";
      const vat = isData ? row.taxAmount : 0;
      const net = isData ? row.inputAmount : 0;
      return [
        isData || isSub ? row.vehicleModel : "[ TOTAL ]",
        isData ? row.supplierCode : "",
        isData ? row.supplierName : "",
        formLabel,
        isData ? row.itemName : "",
        net,
        vat,
        row.totalAmount,
      ];
    });
    const ws = (XLSX as any).utils.aoa_to_sheet([header, ...data]);
    Object.keys(ws).forEach((addr) => {
      if (addr.startsWith("!")) return;
      const cell = (ws as any)[addr];
      if (!cell) return;
      cell.s = { ...(cell.s ?? {}), font: { ...(cell.s?.font ?? {}), sz: 10 } };
    });
    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, "마감현황");
    (XLSX as any).writeFile(wb, `closing_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [displayRows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="차종별 / 용도별 마감현황"
        description="회계처리 완료된 매입 실적을 차종 및 용도별로 집계합니다."
      />

      <SearchPanel onSearch={loadData} onReset={() => {}}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 사업장 (로그인 고정) */}
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">사업장</span>
            <input
              readOnly
              value={factoryCode ? `${factoryCode} - ${factoryName}` : "로딩 중..."}
              className="h-8 w-full rounded-md border border-input bg-muted px-2 text-xs text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* 입고일자 */}
          <div className="space-y-1">
            <span className="text-[12px] text-slate-600">입고일자</span>
            <div className="flex items-center gap-1">
              <DateInput
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground">~</span>
              <DateInput
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </SearchPanel>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            차종별 / 용도별 마감현황
            {loading && <span className="ml-2 text-xs text-blue-500">조회 중...</span>}
          </span>
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
            onSort={() => { setGridSettingsTab("sort"); setGridSettingsOpen(true); }}
            onColumns={() => { setGridSettingsTab("columns"); setGridSettingsOpen(true); }}
            onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<ClosingRow>
              columns={[
                {
                  key: "vehicleModel",
                  header: "차종",
                  minWidth: 120,
                  cell: (row) => {
                    if (row.rowKind === "data") return row.firstInGroup ? row.vehicleModel : "";
                    if (row.rowKind === "subtotal_form" && !row.isFirstFormSubtotalForModel) return "";
                    if (row.rowKind === "subtotal_form" || row.rowKind === "subtotal_model") return "[SUB TOTAL]";
                    // TOTAL 구역: total_form 첫 행, total_model 첫 행, total_all — 모두 "[ TOTAL ]" (rowSpan으로 병합)
                    if (row.rowKind === "total_form"  && row.firstInGroup) return "[ TOTAL ]";
                    if (row.rowKind === "total_model" && row.firstInGroup) return "[ TOTAL ]";
                    if (row.rowKind === "total_all") return "[ TOTAL ]";
                    return "";
                  },
                  rowSpan: (row, index, allRows) => {
                    // total_form 첫 행: 용도별 행 개수만큼 병합
                    if (row.rowKind === "total_form" && row.firstInGroup) {
                      let count = 0;
                      for (let i = index; i < allRows.length; i++) {
                        if ((allRows[i] as ClosingRow).rowKind === "total_form") count++;
                        else break;
                      }
                      return count;
                    }
                    // total_model 첫 행: 차종별 행 개수만큼 병합
                    if (row.rowKind === "total_model" && row.firstInGroup) {
                      let count = 0;
                      for (let i = index; i < allRows.length; i++) {
                        if ((allRows[i] as ClosingRow).rowKind === "total_model") count++;
                        else break;
                      }
                      return count;
                    }
                    return 1;
                  },
                },
                {
                  key: "supplierCode",
                  header: "업체코드",
                  minWidth: 110,
                  cell: (row) => {
                    if (row.rowKind === "data") return row.supplierCode;
                    if (row.rowKind === "subtotal_form") return row.isFirstFormSubtotalForModel ? "[ 용도별 ]" : "";
                    if (row.rowKind === "subtotal_model") return "[ 차  종 ]";
                    if (row.rowKind === "total_form"  && row.firstInGroup) return "[ 용도별 ]";
                    if (row.rowKind === "total_model" && row.firstInGroup) return "[ 차  종 ]";
                    if (row.rowKind === "total_all")   return "[ TOTAL ]";
                    return "";
                  },
                  rowSpan: (row, index, allRows) => {
                    if (row.rowKind === "total_form" && row.firstInGroup) {
                      let count = 0;
                      for (let i = index; i < allRows.length; i++) {
                        if ((allRows[i] as ClosingRow).rowKind === "total_form") count++;
                        else break;
                      }
                      return count;
                    }
                    if (row.rowKind === "total_model" && row.firstInGroup) {
                      let count = 0;
                      for (let i = index; i < allRows.length; i++) {
                        if ((allRows[i] as ClosingRow).rowKind === "total_model") count++;
                        else break;
                      }
                      return count;
                    }
                    return 1;
                  },
                },
                {
                  key: "supplierName",
                  header: "업체명",
                  minWidth: 160,
                  cell: (row) => (row.rowKind === "data" ? row.supplierName : ""),
                },
                {
                  key: "form",
                  header: "용도",
                  minWidth: 110,
                  cell: (row) => {
                    if (row.rowKind === "data") return `[ ${row.form} ]`;
                    if (row.rowKind === "subtotal_form") return `[${row.vehicleModel}] ${row.subtotalFormKind}`;
                    if (row.rowKind === "subtotal_model") return `[${row.vehicleModel}]`;
                    if (row.rowKind === "total_form")  return `[ ${row.subtotalFormKind} ]`;
                    if (row.rowKind === "total_model") return `[${row.vehicleModel}]`;
                    if (row.rowKind === "total_all")   return "[ TOTAL ]";
                    return "";
                  },
                },
                {
                  key: "itemName",
                  header: "품명",
                  minWidth: 220,
                  cell: (row) => (row.rowKind === "data" ? row.itemName : ""),
                },
                {
                  key: "inputAmount",
                  header: "입고금액",
                  minWidth: 130,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => (row.rowKind === "data" ? formatCurrency(row.inputAmount) : ""),
                },
                {
                  key: "taxAmount",
                  header: "VAT금액",
                  minWidth: 110,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => (row.rowKind === "data" ? formatCurrency(row.taxAmount) : ""),
                },
                {
                  key: "totalAmount",
                  header: "합계금액",
                  minWidth: 130,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.totalAmount),
                },
              ]}
              data={displayRows}
              keyExtractor={(row) => row.id}
              maxHeight="100%"
              emptyMessage="조회 버튼을 눌러 데이터를 불러오세요."
              getRowClassName={(row, index) => {
                const d = compactView ? "" : "h-10";
                if (row.rowKind === "total_all") {
                  return ["bg-pink-100 dark:bg-pink-900/60 font-bold", d].filter(Boolean).join(" ");
                }
                if (row.rowKind === "total_form" || row.rowKind === "total_model") {
                  return ["bg-pink-50 dark:bg-pink-900/40 font-semibold", d].filter(Boolean).join(" ");
                }
                if (row.rowKind === "subtotal_form" || row.rowKind === "subtotal_model") {
                  return ["bg-sky-100 dark:bg-sky-900/60 font-semibold", d].filter(Boolean).join(" ");
                }
                const striped = stripedRows && index % 2 === 1 ? "bg-slate-50 dark:bg-slate-800/70" : "";
                return [striped, d].filter(Boolean).join(" ");
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

      <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">내보내기 · 정렬 · 컬럼 · 보기 설정</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              {(["export", "sort", "columns", "view"] as const).map((tab) => (
                <Button key={tab} size="sm"
                  variant={gridSettingsTab === tab ? "default" : "outline"}
                  onClick={() => setGridSettingsTab(tab)}>
                  {{ export: "내보내기", sort: "정렬", columns: "컬럼", view: "보기" }[tab]}
                </Button>
              ))}
            </div>
            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  현재 조회된 차종별/용도별 마감현황 데이터를 EXCEL 파일(.xlsx)로 다운로드합니다.
                </p>
                <Button size="sm" onClick={() => void exportExcel()}>EXCEL 내보내기</Button>
              </div>
            )}
            {gridSettingsTab === "sort" && (
              <p className="text-[11px] text-muted-foreground">
                이 화면은 차종/용도 단위 집계용으로 별도 정렬 설정을 제공하지 않습니다.
              </p>
            )}
            {gridSettingsTab === "columns" && (
              <p className="text-[11px] text-muted-foreground">
                현재 버전에서는 컬럼 표시 설정을 변경할 수 없습니다.
              </p>
            )}
            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                  <Checkbox checked={stripedRows} onChange={(e) => setStripedRows(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">컴팩트 보기</span>
                  <Checkbox checked={compactView} onChange={(e) => setCompactView(e.target.checked)} />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
