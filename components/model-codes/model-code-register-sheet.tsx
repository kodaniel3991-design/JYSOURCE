"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModelCodeRecord } from "@/types/model-code";

type ModelCodeRegisterDraft = Omit<ModelCodeRecord, "id">;

const defaultDraft: ModelCodeRegisterDraft = {
  modelCode: "",
  modelName: "",
  primaryCustomerCode: "",
  primaryCustomerName: "",
};

export interface ModelCodeRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (draft: ModelCodeRegisterDraft) => void;
  mode?: "create" | "edit";
  initialDraft?: ModelCodeRegisterDraft;
}

export function ModelCodeRegisterSheet({
  open,
  onOpenChange,
  onSave,
  mode = "create",
  initialDraft,
}: ModelCodeRegisterSheetProps) {
  const [draft, setDraft] = useState<ModelCodeRegisterDraft>(
    initialDraft ?? defaultDraft
  );

  // 팝업이 열릴 때마다 초기값으로 리셋
  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
  }, [open, initialDraft]);

  const canSave = useMemo(() => {
    return draft.modelCode.trim().length > 0 && draft.modelName.trim().length > 0;
  }, [draft.modelCode, draft.modelName]);

  const reset = useCallback(
    () => setDraft(initialDraft ?? defaultDraft),
    [initialDraft]
  );

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const save = useCallback(() => {
    if (!canSave) return;
    onSave?.({
      modelCode: draft.modelCode.trim(),
      modelName: draft.modelName.trim(),
      primaryCustomerCode: draft.primaryCustomerCode.trim(),
      primaryCustomerName: draft.primaryCustomerName.trim(),
    });
    reset();
    onOpenChange(false);
  }, [canSave, draft, onOpenChange, onSave, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-xl flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "모델코드 수정" : "모델코드 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 모델코드 기준정보를 수정합니다."
                : "모델코드 기준정보를 등록합니다."}
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
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>기본정보</SheetTitle>
              <SheetDescription className="text-xs">
                모델코드/모델명은 필수입니다.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">모델코드 *</Label>
                <Input
                  value={draft.modelCode}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, modelCode: e.target.value }))
                  }
                  className="h-9 text-xs"
                  placeholder="예) AR1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">모델명 *</Label>
                <Input
                  value={draft.modelName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, modelName: e.target.value }))
                  }
                  className="h-9 text-xs"
                  placeholder="예) AR1"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">주요고객코드</Label>
                <Input
                  value={draft.primaryCustomerCode}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, primaryCustomerCode: e.target.value }))
                  }
                  className="h-9 text-xs"
                  placeholder="예) CUST-001"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px] text-slate-600">주요고객명</Label>
                <Input
                  value={draft.primaryCustomerName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, primaryCustomerName: e.target.value }))
                  }
                  className="h-9 text-xs"
                  placeholder="예) 현대자동차"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

