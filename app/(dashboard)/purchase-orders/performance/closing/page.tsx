"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchaseOrderSummaries, poStatusLabels } from "@/lib/mock/purchase-orders";
import type { PurchaseOrderSummary, POStatus } from "@/types/purchase";
import { Search, RotateCcw } from "lucide-react";

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
          rowKind: "data",
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
        po.status === "partial_receipt"
    )
    .reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="마감현황"
        description="기간·공급사·상태 기준으로 구매오더의 마감 현황을 조회합니다. (데모)"
      />

      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            검색 조건
          </span>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setCriteria(draft);
                }}
                className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <Search className="mr-1.5 h-4 w-4" />
                검색
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(initialParams);
                  setCriteria(initialParams);
                }}
                className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            구매오더 마감현황
          </span>
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
                  return "bg-pink-100 dark:bg-pink-900/60 font-semibold";
                }
                if (
                  row.rowKind === "subtotal_usage" ||
                  row.rowKind === "subtotal_model"
                ) {
                  return "bg-sky-100 dark:bg-sky-900/60 font-semibold";
                }
                // 일반 데이터 행은 옅은 줄무늬로 가독성 향상
                return index % 2 === 1
                  ? "bg-slate-50 dark:bg-slate-800/70"
                  : "";
              }}
              pagination={{
                pageSize: displayRows.length === 0 ? 10 : displayRows.length,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

