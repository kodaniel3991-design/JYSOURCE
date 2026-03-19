"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ItemTypeCodeRecord } from "@/types/item-type-code";

type ItemTypeCodeDraft = Omit<ItemTypeCodeRecord, "id">;

const defaultDraft: ItemTypeCodeDraft = {
  itemTypeCode: "",
  itemTypeName: "",
  procurementType: "",
  salesAccount: "",
  salesAccountName: "",
  salesCounterAccount: "",
  salesCounterAccountName: "",
  purchaseAccount: "",
  purchaseAccountName: "",
  purchaseCounterAccount: "",
  purchaseCounterAccountName: "",
};

export interface ItemTypeCodeRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (draft: ItemTypeCodeDraft) => void;
  mode?: "create" | "edit";
  initialDraft?: ItemTypeCodeDraft;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[12px] text-slate-600">
        {label}
        {required && " *"}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ItemTypeCodeRegisterSheet({
  open,
  onOpenChange,
  onSave,
  mode = "create",
  initialDraft,
}: ItemTypeCodeRegisterSheetProps) {
  const [draft, setDraft] = useState<ItemTypeCodeDraft>(initialDraft ?? defaultDraft);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
  }, [open, initialDraft]);

  const canSave = useMemo(
    () => draft.itemTypeCode.trim().length > 0 && draft.itemTypeName.trim().length > 0,
    [draft.itemTypeCode, draft.itemTypeName]
  );

  const set = <K extends keyof ItemTypeCodeDraft>(key: K, value: ItemTypeCodeDraft[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const reset = useCallback(() => setDraft(initialDraft ?? defaultDraft), [initialDraft]);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const formRef = useEnterNavigation();

  const save = useCallback(() => {
    if (!canSave) return;
    const trimmed: ItemTypeCodeDraft = {
      itemTypeCode: draft.itemTypeCode.trim(),
      itemTypeName: draft.itemTypeName.trim(),
      procurementType: draft.procurementType.trim(),
      salesAccount: draft.salesAccount.trim(),
      salesAccountName: draft.salesAccountName.trim(),
      salesCounterAccount: draft.salesCounterAccount.trim(),
      salesCounterAccountName: draft.salesCounterAccountName.trim(),
      purchaseAccount: draft.purchaseAccount.trim(),
      purchaseAccountName: draft.purchaseAccountName.trim(),
      purchaseCounterAccount: draft.purchaseCounterAccount.trim(),
      purchaseCounterAccountName: draft.purchaseCounterAccountName.trim(),
    };
    onSave?.(trimmed);
    reset();
    onOpenChange(false);
  }, [canSave, draft, onOpenChange, onSave, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-2xl flex-col overflow-hidden p-0 sm:max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "품목형태코드 수정" : "품목형태코드 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 품목형태코드 기준정보를 수정합니다."
                : "품목형태코드 기준정보를 등록합니다."}
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

        {/* 폼 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
          <div ref={formRef} className="space-y-6">
            {/* 기본정보 */}
            <div className="space-y-3">
              <SheetHeader>
                <SheetTitle>기본정보</SheetTitle>
                <SheetDescription className="text-xs">
                  형태코드, 품목형태명은 필수입니다.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  label="형태코드"
                  value={draft.itemTypeCode}
                  onChange={(v) => set("itemTypeCode", v)}
                  placeholder="예) 0"
                  required
                />
                <FormField
                  label="품목형태명"
                  value={draft.itemTypeName}
                  onChange={(v) => set("itemTypeName", v)}
                  placeholder="예) 외주품"
                  required
                />
                <FormField
                  label="조달구분"
                  value={draft.procurementType}
                  onChange={(v) => set("procurementType", v)}
                  placeholder="예) 상품"
                />
              </div>
            </div>

            {/* 매출 계정 */}
            <div className="space-y-3">
              <SheetHeader>
                <SheetTitle>매출 계정</SheetTitle>
              </SheetHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="매출계정"
                  value={draft.salesAccount}
                  onChange={(v) => set("salesAccount", v)}
                  placeholder="예) 40700"
                />
                <FormField
                  label="매출계정명"
                  value={draft.salesAccountName}
                  onChange={(v) => set("salesAccountName", v)}
                  placeholder="예) 외주품매출"
                />
                <FormField
                  label="매출상대계정"
                  value={draft.salesCounterAccount}
                  onChange={(v) => set("salesCounterAccount", v)}
                  placeholder="예) 10800"
                />
                <FormField
                  label="매출상대계정명"
                  value={draft.salesCounterAccountName}
                  onChange={(v) => set("salesCounterAccountName", v)}
                  placeholder="예) 외상매출금"
                />
              </div>
            </div>

            {/* 매입 계정 */}
            <div className="space-y-3">
              <SheetHeader>
                <SheetTitle>매입 계정</SheetTitle>
              </SheetHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="매입계정"
                  value={draft.purchaseAccount}
                  onChange={(v) => set("purchaseAccount", v)}
                  placeholder="예) 15000"
                />
                <FormField
                  label="매입계정명"
                  value={draft.purchaseAccountName}
                  onChange={(v) => set("purchaseAccountName", v)}
                  placeholder="예) 외주품"
                />
                <FormField
                  label="매입상대계정"
                  value={draft.purchaseCounterAccount}
                  onChange={(v) => set("purchaseCounterAccount", v)}
                  placeholder="예) 25100"
                />
                <FormField
                  label="매입상대계정명"
                  value={draft.purchaseCounterAccountName}
                  onChange={(v) => set("purchaseCounterAccountName", v)}
                  placeholder="예) 외상매입금"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
