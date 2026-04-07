"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiPath } from "@/lib/api-path";
import { Loader2, PackageCheck } from "lucide-react";
import type { PurchaseOrder, PurchaseOrderSummary, POStatus } from "@/types/purchase";

interface ReceiptItemRow {
  poId: string;
  poNumber: string;
  supplierName: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderQty: number;
  unitPrice: number;
  receiveQty: number;
  receiveDate: string;
  included: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  selectedPOs: PurchaseOrderSummary[];
  onComplete: (updatedIds: string[], newStatus: POStatus) => void;
}

export function ReceiptProcessSheet({ open, onClose, selectedPOs, onComplete }: Props) {
  const [rows, setRows] = useState<ReceiptItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!open || selectedPOs.length === 0) {
      setRows([]);
      setDone(false);
      return;
    }

    setLoading(true);
    Promise.all(
      selectedPOs.map((po) =>
        fetch(apiPath(`/api/purchase-orders/${po.id}`))
          .then((r) => r.json())
          .then((d) => d.data as PurchaseOrder)
      )
    )
      .then((details) => {
        const newRows: ReceiptItemRow[] = [];
        for (const po of details) {
          for (const item of po.items) {
            newRows.push({
              poId: po.id,
              poNumber: po.poNumber,
              supplierName: po.supplierName,
              itemId: item.id,
              itemCode: item.itemCode,
              itemName: item.itemName,
              orderQty: item.quantity,
              unitPrice: item.unitPrice,
              receiveQty: item.quantity,
              receiveDate: today,
              included: true,
            });
          }
        }
        setRows(newRows);
      })
      .finally(() => setLoading(false));
  }, [open, selectedPOs, today]);

  const updateRow = (idx: number, patch: Partial<ReceiptItemRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const toggleAllPO = (poId: string, included: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.poId === poId ? { ...r, included } : r))
    );
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // 포함된 행만 처리
    const includedRows = rows.filter((r) => r.included);
    // PO별로 모든 품목이 전량 입고됐는지 확인 → received vs partial
    const poIds = Array.from(new Set(includedRows.map((r) => r.poId)));
    const updatedIds = poIds.filter((id) => {
      const poRows = rows.filter((r) => r.poId === id);
      const includedPoRows = poRows.filter((r) => r.included);
      return includedPoRows.length > 0;
    });
    // 전량 입고 여부: 포함된 행의 receiveQty >= orderQty
    const allFull = includedRows.every((r) => r.receiveQty >= r.orderQty);
    const newStatus: POStatus = allFull ? "received" : "partial";

    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      onComplete(updatedIds, newStatus);
    }, 800);
  };

  // PO별 그룹
  const poGroups = Array.from(new Set(rows.map((r) => r.poId))).map((poId) => ({
    poId,
    poNumber: rows.find((r) => r.poId === poId)!.poNumber,
    supplierName: rows.find((r) => r.poId === poId)!.supplierName,
    items: rows.filter((r) => r.poId === poId),
  }));

  const includedCount = rows.filter((r) => r.included).length;
  const totalReceiveAmount = rows
    .filter((r) => r.included)
    .reduce((sum, r) => sum + r.receiveQty * r.unitPrice, 0);

  return (
    <Sheet open={open} onOpenChange={onClose} position="right">
      <SheetContent className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-primary" />
            입고처리
          </SheetTitle>
          <SheetDescription>
            선택한 구매오더 {selectedPOs.length}건의 품목별 입고수량과 입고일자를 확인 후 처리합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-xs">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              품목 정보를 불러오는 중...
            </div>
          )}

          {!loading && done && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <PackageCheck className="h-12 w-12 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-600">입고처리가 완료됐습니다.</p>
              <p className="text-[11px] text-muted-foreground">
                총 {includedCount}개 품목 / {formatCurrency(totalReceiveAmount)}
              </p>
              <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
                닫기
              </Button>
            </div>
          )}

          {!loading && !done && poGroups.map((group) => {
            const allIncluded = group.items.every((r) => r.included);
            const someIncluded = group.items.some((r) => r.included);
            return (
              <div key={group.poId} className="rounded-lg border">
                {/* PO 헤더 */}
                <div className="flex items-center gap-2 rounded-t-lg bg-muted/50 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer"
                    checked={allIncluded}
                    ref={(el) => {
                      if (el) el.indeterminate = someIncluded && !allIncluded;
                    }}
                    onChange={(e) => toggleAllPO(group.poId, e.target.checked)}
                  />
                  <span className="font-semibold text-primary">{group.poNumber}</span>
                  <span className="text-muted-foreground">· {group.supplierName}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {group.items.filter((r) => r.included).length}/{group.items.length}품목 선택
                  </span>
                </div>

                {/* 품목 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/20 text-[11px] text-muted-foreground">
                        <th className="w-8 px-2 py-1.5 text-center"></th>
                        <th className="px-2 py-1.5 text-left">품목코드</th>
                        <th className="px-2 py-1.5 text-left">품명</th>
                        <th className="px-2 py-1.5 text-right">발주량</th>
                        <th className="px-2 py-1.5 text-right">입고수량</th>
                        <th className="px-2 py-1.5 text-right">입고금액</th>
                        <th className="px-2 py-1.5 text-center">입고일자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((row, i) => {
                        const rowIdx = rows.findIndex(
                          (r) => r.poId === row.poId && r.itemId === row.itemId
                        );
                        return (
                          <tr
                            key={row.itemId}
                            className={`border-b last:border-0 ${!row.included ? "opacity-40" : ""} ${i % 2 === 1 ? "bg-slate-50" : ""}`}
                          >
                            <td className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 cursor-pointer"
                                checked={row.included}
                                onChange={(e) =>
                                  updateRow(rowIdx, { included: e.target.checked })
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5 font-mono text-[11px]">{row.itemCode}</td>
                            <td className="px-2 py-1.5">{row.itemName}</td>
                            <td className="px-2 py-1.5 text-right">
                              {row.orderQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <input
                                type="number"
                                min={0}
                                max={row.orderQty}
                                value={row.receiveQty}
                                disabled={!row.included}
                                onChange={(e) =>
                                  updateRow(rowIdx, {
                                    receiveQty: Math.min(
                                      row.orderQty,
                                      Math.max(0, Number(e.target.value))
                                    ),
                                  })
                                }
                                className="h-7 w-20 rounded border border-input bg-background px-1.5 text-right text-xs disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {formatCurrency(row.receiveQty * row.unitPrice)}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <DateInput
                                value={row.receiveDate}
                                disabled={!row.included}
                                onChange={(e) =>
                                  updateRow(rowIdx, { receiveDate: e.target.value })
                                }
                                className="h-7 rounded border border-input bg-background px-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {!loading && !done && rows.length > 0 && (
            <>
              {/* 합계 */}
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5 text-[11px]">
                <span className="text-muted-foreground">
                  선택 품목 <span className="font-semibold text-foreground">{includedCount}</span>건
                </span>
                <span className="text-muted-foreground">
                  총 입고금액{" "}
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(totalReceiveAmount)}
                  </span>
                </span>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  취소
                </Button>
                <Button
                  size="sm"
                  disabled={includedCount === 0 || submitting}
                  onClick={handleSubmit}
                >
                  {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  입고처리 확인 ({includedCount}건)
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
