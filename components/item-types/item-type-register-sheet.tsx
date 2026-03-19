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
import type { ItemTypeRecord } from "@/types/item-type";

type ItemTypeDraft = Omit<ItemTypeRecord, "id">;

const defaultDraft: ItemTypeDraft = {
  itemTypeCode: "",
  itemTypeName: "",
};

export interface ItemTypeRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (draft: ItemTypeDraft) => void;
  mode?: "create" | "edit";
  initialDraft?: ItemTypeDraft;
}

export function ItemTypeRegisterSheet({
  open,
  onOpenChange,
  onSave,
  mode = "create",
  initialDraft,
}: ItemTypeRegisterSheetProps) {
  const [draft, setDraft] = useState<ItemTypeDraft>(initialDraft ?? defaultDraft);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
  }, [open, initialDraft]);

  const canSave = useMemo(
    () => draft.itemTypeCode.trim().length > 0 && draft.itemTypeName.trim().length > 0,
    [draft.itemTypeCode, draft.itemTypeName]
  );

  const reset = useCallback(() => setDraft(initialDraft ?? defaultDraft), [initialDraft]);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const formRef = useEnterNavigation();

  const save = useCallback(() => {
    if (!canSave) return;
    onSave?.({
      itemTypeCode: draft.itemTypeCode.trim(),
      itemTypeName: draft.itemTypeName.trim(),
    });
    reset();
    onOpenChange(false);
  }, [canSave, draft, onOpenChange, onSave, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "품목유형 수정" : "품목유형 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 품목유형 기준정보를 수정합니다."
                : "품목유형 기준정보를 등록합니다."}
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
          <div ref={formRef} className="space-y-4">
            <SheetHeader>
              <SheetTitle>기본정보</SheetTitle>
              <SheetDescription className="text-xs">
                품목유형코드, 품목유형명은 필수입니다.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">품목유형코드 *</Label>
                <Input
                  value={draft.itemTypeCode}
                  onChange={(e) => setDraft((p) => ({ ...p, itemTypeCode: e.target.value }))}
                  className="h-9 text-xs"
                  placeholder="예) 01"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">품목유형명 *</Label>
                <Input
                  value={draft.itemTypeName}
                  onChange={(e) => setDraft((p) => ({ ...p, itemTypeName: e.target.value }))}
                  className="h-9 text-xs"
                  placeholder="예) 상품"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
