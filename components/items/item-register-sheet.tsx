"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ItemRegisterHeader } from "./item-register-header";
import { ItemRegisterBasicInfoCard } from "./item-register-basic-info";
import { ItemRegisterTabs } from "./item-register-tabs";
import {
  defaultItemRegisterState,
  type ItemRegisterState,
  type ItemRegisterBasicInfo,
  type ItemRegisterClassification,
} from "@/types/item-register";
import { suppliers } from "@/lib/mock/suppliers";
import type { SelectOption } from "@/lib/item-register-options";

const supplierOptions: SelectOption[] = suppliers.map((s) => ({
  value: s.id,
  label: s.name,
}));

export interface ItemRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 복사 시 참조할 품목 조회 (품목번호 → 부분 데이터). 없으면 mock으로 동작 */
  getItemByNo?: (itemNo: string) => Partial<ItemRegisterBasicInfo> | null;
  onSave?: (state: ItemRegisterState) => void;
  mode?: "create" | "edit";
  initialState?: ItemRegisterState;
}

export function ItemRegisterSheet({
  open,
  onOpenChange,
  getItemByNo,
  onSave,
  mode = "create",
  initialState,
}: ItemRegisterSheetProps) {
  const computedInitial = useMemo(
    () => initialState ?? defaultItemRegisterState,
    [initialState]
  );
  const [state, setState] = useState<ItemRegisterState>(computedInitial);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      // 신규 등록: 로그인 사업장을 plant 기본값으로 세팅
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          const factory = data?.factory ?? "";
          setState({
            ...computedInitial,
            basicInfo: { ...computedInitial.basicInfo, plant: factory },
          });
        })
        .catch(() => setState(computedInitial));
    } else {
      setState(computedInitial);
    }
  }, [computedInitial, open, mode]);

  const handleReset = useCallback(() => {
    setState(computedInitial);
  }, [computedInitial]);

  const handleSave = useCallback(() => {
    if (onSave) onSave(state);
    else console.log("[Item Register] Save (mock)", state);
    onOpenChange(false);
  }, [state, onSave, onOpenChange]);

  const handleSaveAndAddAnother = useCallback(() => {
    if (onSave) onSave(state);
    else console.log("[Item Register] Save & Add Another (mock)", state);
    setState(defaultItemRegisterState);
  }, [state, onSave]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleCopyFromItemNo = useCallback(
    (itemNo: string) => {
      if (!itemNo.trim()) return;
      const copied = getItemByNo
        ? getItemByNo(itemNo.trim())
        : mockCopyFromItemNo(itemNo.trim());
      if (copied && Object.keys(copied).length > 0) {
        setState((prev) => ({
          ...prev,
          basicInfo: { ...prev.basicInfo, ...(copied as Partial<ItemRegisterBasicInfo>) },
          classification: { ...prev.classification, ...(copied as Partial<ItemRegisterClassification>) },
        }));
      }
    },
    [getItemByNo]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl md:max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ItemRegisterHeader
          title={mode === "edit" ? "품목 수정" : "품목 신규 등록"}
          description={
            mode === "edit"
              ? "선택한 품목의 정보를 수정합니다."
              : "구매·재고·제조 운영에 사용할 품목 마스터를 생성하고 관리합니다."
          }
          onReset={handleReset}
          onSave={handleSave}
          onSaveAndAddAnother={mode === "create" ? handleSaveAndAddAnother : undefined}
          onClose={handleClose}
        />
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const target = e.target as HTMLElement;
            const tag = target.tagName;
            // textarea는 엔터로 줄바꿈 유지, button/submit은 제외
            if (tag === "TEXTAREA" || (tag === "BUTTON" && (target as HTMLButtonElement).type !== "button")) return;
            // input, select, 검색버튼 등 포커스 이동
            const form = e.currentTarget;
            const focusable = Array.from(
              form.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([readonly]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
              )
            ).filter((el) => {
              // 읽기전용 표시 input(bg-muted) 건너뜀
              return !el.classList.contains("bg-muted") && el.offsetParent !== null;
            });
            const idx = focusable.indexOf(target);
            if (idx >= 0 && idx < focusable.length - 1) {
              e.preventDefault();
              focusable[idx + 1].focus();
            }
          }}
        >
          <div className="mx-auto max-w-4xl space-y-6">
            <ItemRegisterBasicInfoCard
              data={state.basicInfo}
              onChange={(data) =>
                setState((prev) => ({ ...prev, basicInfo: data }))
              }
              onCopyFromItemNo={handleCopyFromItemNo}
              supplierOptions={supplierOptions}
            />
            <ItemRegisterTabs
              state={state}
              onChange={setState}
              supplierOptions={supplierOptions}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** 품목번호로 복사 시 mock: 입력한 번호를 규격/도면번호에 반영 */
function mockCopyFromItemNo(itemNo: string): Partial<ItemRegisterClassification> {
  return {
    specification: `복사: ${itemNo}`,
    drawingNo: itemNo ? `DRW-${itemNo.slice(-6)}` : "",
  };
}
