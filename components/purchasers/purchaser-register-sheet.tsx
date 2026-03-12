"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaserRecord } from "@/types/purchaser";

type PurchaserDraft = Omit<PurchaserRecord, "id">;

const defaultDraft: PurchaserDraft = {
  purchaserNo: "",
  purchaserName: "",
  phoneNo: "",
  faxNo: "",
  contactPerson: "",
  contactDept: "",
  transactionType: "",
  representativeName: "",
  businessNo: "",
  postalCode: "",
  address: "",
  suspensionDate: "",
  suspensionReason: "거래중",
  registrant: "",
  modifier: "",
};

export interface PurchaserRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialDraft?: PurchaserDraft;
  onSave?: (draft: PurchaserDraft) => void;
}

export function PurchaserRegisterSheet({
  open,
  onOpenChange,
  mode = "create",
  initialDraft,
  onSave,
}: PurchaserRegisterSheetProps) {
  const [draft, setDraft] = useState<PurchaserDraft>(initialDraft ?? defaultDraft);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
  }, [open, initialDraft]);

  const canSave = useMemo(
    () => draft.purchaserNo.trim() !== "" && draft.purchaserName.trim() !== "",
    [draft.purchaserNo, draft.purchaserName]
  );

  const reset = useCallback(() => {
    setDraft(initialDraft ?? defaultDraft);
  }, [initialDraft]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const save = useCallback(() => {
    if (!canSave) return;
    onSave?.({
      ...draft,
      purchaserNo: draft.purchaserNo.trim(),
      purchaserName: draft.purchaserName.trim(),
      businessNo: draft.businessNo.trim(),
      address: draft.address.trim(),
    });
    if (mode === "create") {
      setDraft(defaultDraft);
    }
    onOpenChange(false);
  }, [canSave, draft, mode, onSave, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-xl flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "구매처 수정" : "구매처 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 구매처 기준정보를 수정합니다."
                : "구매처(매입처) 기준정보를 등록합니다."}
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
              <Label className="text-[12px] text-slate-600">구매처번호 *</Label>
              <Input
                value={draft.purchaserNo}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, purchaserNo: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">구매처명 *</Label>
              <Input
                value={draft.purchaserName}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, purchaserName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">사업자번호</Label>
              <Input
                value={draft.businessNo}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, businessNo: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">대표자성명</Label>
              <Input
                value={draft.representativeName}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, representativeName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[12px] text-slate-600">주소</Label>
              <Input
                value={draft.address}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, address: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">전화번호</Label>
              <Input
                value={draft.phoneNo}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, phoneNo: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-slate-600">거래형태</Label>
              <Input
                value={draft.transactionType}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, transactionType: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

