"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchasePriceRecord } from "@/types/purchase-price";

type PurchasePriceDraft = Omit<PurchasePriceRecord, "id">;

const defaultDraft: PurchasePriceDraft = {
  itemCode: "",
  itemName: "",
  itemSpec: "",
  supplierName: "",
  plant: "",
  applyDate: "",
  expireDate: "",
  unitPrice: 0,
  devUnitPrice: 0,
  discountRate: 0,
  currency: "KRW",
  remarks: "",
};

export interface PurchasePriceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialDraft?: PurchasePriceDraft;
  onSave?: (draft: PurchasePriceDraft, options?: { editReason?: string }) => void;
}

export function PurchasePriceSheet({
  open,
  onOpenChange,
  mode = "create",
  initialDraft,
  onSave,
}: PurchasePriceSheetProps) {
  const [draft, setDraft] = useState<PurchasePriceDraft>(
    initialDraft ?? defaultDraft
  );
  const [editReason, setEditReason] = useState("");

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
    setEditReason("");
  }, [open, initialDraft]);

  const canSave = useMemo(
    () =>
      draft.itemCode.trim() !== "" &&
      draft.itemName.trim() !== "" &&
      draft.supplierName.trim() !== "" &&
      (mode !== "edit" || editReason.trim() !== ""),
    [draft.itemCode, draft.itemName, draft.supplierName, mode, editReason]
  );

  const reset = useCallback(() => {
    setDraft(initialDraft ?? defaultDraft);
    setEditReason("");
  }, [initialDraft]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const save = useCallback(() => {
    if (!canSave) return;
    const clean: PurchasePriceDraft = {
      ...draft,
      itemCode: draft.itemCode.trim(),
      itemName: draft.itemName.trim(),
      itemSpec: draft.itemSpec.trim(),
      supplierName: draft.supplierName.trim(),
      plant: draft.plant.trim(),
      applyDate: draft.applyDate.trim(),
      expireDate: draft.expireDate.trim(),
      unitPrice: Number(draft.unitPrice) || 0,
      devUnitPrice: Number(draft.devUnitPrice) || 0,
      discountRate: Number(draft.discountRate) || 0,
      currency: draft.currency.trim() || "KRW",
      remarks: draft.remarks.trim(),
    };
    onSave?.(
      clean,
      mode === "edit" ? { editReason: editReason.trim() } : undefined
    );
    if (mode === "create") {
      setDraft(defaultDraft);
    }
    onOpenChange(false);
  }, [canSave, draft, mode, editReason, onSave, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-2xl flex-col overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "구매단가 수정" : "구매단가 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 구매단가 정보를 수정합니다."
                : "품목·구매처별 구매단가를 등록합니다."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "create" && (
              <Button size="sm" variant="outline" onClick={reset}>
                초기화
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={close}>
              닫기
            </Button>
            <Button size="sm" onClick={save} disabled={!canSave}>
              저장
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">품목번호 *</Label>
              <Input
                value={draft.itemCode}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, itemCode: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">품목명 *</Label>
              <Input
                value={draft.itemName}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, itemName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[12px] text-slate-600">품목규격</Label>
              <Input
                value={draft.itemSpec}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, itemSpec: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">구매처명 *</Label>
              <Input
                value={draft.supplierName}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, supplierName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">사업장</Label>
              <Input
                value={draft.plant}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, plant: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">적용일자</Label>
              <Input
                type="date"
                value={draft.applyDate}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, applyDate: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">유효기간</Label>
              <Input
                type="date"
                value={draft.expireDate}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, expireDate: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">구매단가</Label>
              <Input
                value={draft.unitPrice}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    unitPrice: Number(e.target.value.replace(/,/g, "")) || 0,
                  }))
                }
                className="h-8 text-xs text-right"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">개발단가</Label>
              <Input
                value={draft.devUnitPrice}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    devUnitPrice: Number(e.target.value.replace(/,/g, "")) || 0,
                  }))
                }
                className="h-8 text-xs text-right"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">할인율(%)</Label>
              <Input
                value={draft.discountRate}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    discountRate: Number(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs text-right"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">통화</Label>
              <Input
                value={draft.currency}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, currency: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[12px] text-slate-600">비고</Label>
              <Input
                value={draft.remarks}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, remarks: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            {mode === "edit" && (
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[12px] text-slate-600">
                  수정사유 *
                </Label>
                <Input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="예: 원자재 단가 인상에 따른 조정, 신규 계약 단가 반영 등"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

