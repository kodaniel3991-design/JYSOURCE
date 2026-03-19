"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaserRecord } from "@/types/purchaser";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";

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
  email: "",
  businessTypeName: "",
  businessItemName: "",
  mobileNo: "",
};

export interface PurchaserRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialDraft?: PurchaserDraft;
  onSave?: (draft: PurchaserDraft) => void | Promise<void>;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[12px] text-slate-600">
        {label}
        {required && " *"}
      </Label>
      <Input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
        placeholder={placeholder}
      />
    </div>
  );
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

  const set = <K extends keyof PurchaserDraft>(key: K, value: PurchaserDraft[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const reset = useCallback(() => setDraft(initialDraft ?? defaultDraft), [initialDraft]);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const formRef = useEnterNavigation();

  const save = useCallback(() => {
    if (!canSave) return;
    onSave?.({ ...draft, purchaserNo: draft.purchaserNo.trim(), purchaserName: draft.purchaserName.trim() });
    if (mode === "create") setDraft(defaultDraft);
    onOpenChange(false);
  }, [canSave, draft, mode, onSave, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-2xl flex-col overflow-hidden p-0 sm:max-w-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "구매처 수정" : "구매처 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit" ? "기존 구매처 기준정보를 수정합니다." : "구매처(매입처) 기준정보를 등록합니다."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "create" && (
              <Button size="sm" variant="outline" onClick={reset}>초기화</Button>
            )}
            <Button size="sm" variant="outline" onClick={close}>닫기</Button>
            <Button size="sm" onClick={save} disabled={!canSave}>저장</Button>
          </div>
        </div>

        {/* 탭 폼 */}
        <div ref={formRef} className="flex flex-1 flex-col overflow-hidden px-5 py-4 text-xs">
          <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-lg bg-muted/60 p-1 shrink-0">
              <TabsTrigger value="basic" className="text-xs px-4">기본정보</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs px-4">연락처</TabsTrigger>
              <TabsTrigger value="manager" className="text-xs px-4">담당자 / 거래형태</TabsTrigger>
              <TabsTrigger value="status" className="text-xs px-4">거래상태 / 관리정보</TabsTrigger>
            </TabsList>

            <div className="mt-4 flex-1 overflow-y-auto">

              {/* 탭 1: 기본정보 */}
              <TabsContent value="basic" className="mt-0 space-y-3">
                <p className="text-[11px] text-muted-foreground">구매처번호, 구매처명은 필수입니다.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="구매처번호" value={draft.purchaserNo} onChange={(v) => set("purchaserNo", v)} required placeholder="예) 001" />
                  <FormField label="구매처명" value={draft.purchaserName} onChange={(v) => set("purchaserName", v)} required placeholder="예) (주)한국부품" />
                  <FormField label="사업자번호" value={draft.businessNo} onChange={(v) => set("businessNo", v)} placeholder="예) 123-45-67890" />
                  <FormField label="대표자성명" value={draft.representativeName} onChange={(v) => set("representativeName", v)} />
                  <FormField label="업태명" value={draft.businessTypeName ?? ""} onChange={(v) => set("businessTypeName", v)} placeholder="예) 제조업" />
                  <FormField label="종목명" value={draft.businessItemName ?? ""} onChange={(v) => set("businessItemName", v)} placeholder="예) 자동차부품" />
                </div>
              </TabsContent>

              {/* 탭 2: 연락처 */}
              <TabsContent value="contact" className="mt-0 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="전화번호" value={draft.phoneNo} onChange={(v) => set("phoneNo", v)} placeholder="예) 02-1234-5678" />
                  <FormField label="팩스번호" value={draft.faxNo} onChange={(v) => set("faxNo", v)} placeholder="예) 02-1234-5679" />
                  <FormField label="휴대폰번호" value={draft.mobileNo ?? ""} onChange={(v) => set("mobileNo", v)} placeholder="예) 010-1234-5678" />
                  <FormField label="E-MAIL" value={draft.email ?? ""} onChange={(v) => set("email", v)} type="email" placeholder="예) contact@example.com" />
                  <FormField label="우편번호" value={draft.postalCode} onChange={(v) => set("postalCode", v)} placeholder="예) 12345" />
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[12px] text-slate-600">주소</Label>
                    <Input
                      value={draft.address}
                      onChange={(e) => set("address", e.target.value)}
                      className="h-8 text-xs"
                      placeholder="예) 서울시 강남구 테헤란로 123"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 탭 3: 담당자 / 거래형태 */}
              <TabsContent value="manager" className="mt-0 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="담당자" value={draft.contactPerson} onChange={(v) => set("contactPerson", v)} />
                  <FormField label="담당부서" value={draft.contactDept} onChange={(v) => set("contactDept", v)} />
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[12px] text-slate-600">거래형태</Label>
                    <select
                      value={draft.transactionType}
                      onChange={(e) => set("transactionType", e.target.value)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">선택</option>
                      <option value="구매처">구매처</option>
                      <option value="고객">고객</option>
                      <option value="고객 및 구매처">고객 및 구매처</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* 탭 4: 거래상태 / 관리정보 */}
              <TabsContent value="status" className="mt-0 space-y-5">
                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-slate-600">거래상태</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="거래종지일자" value={draft.suspensionDate} onChange={(v) => set("suspensionDate", v)} type="date" />
                    <FormField label="종지사유" value={draft.suspensionReason} onChange={(v) => set("suspensionReason", v)} placeholder="예) 거래중" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-slate-600">관리정보</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="등록자" value={draft.registrant} onChange={(v) => set("registrant", v)} />
                    <FormField label="변경자" value={draft.modifier} onChange={(v) => set("modifier", v)} />
                  </div>
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>

      </SheetContent>
    </Sheet>
  );
}
