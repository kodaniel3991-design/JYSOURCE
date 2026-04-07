"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import type { PurchasePriceRecord } from "@/types/purchase-price";
import { apiPath } from "@/lib/api-path";

/** 품목 검색용 API 응답 행 */
interface ItemSearchRow {
  ItemId: number;
  ItemNo: string;
  ItemName: string;
  Specification: string;
  Material: string;
}

/** 구매처 검색용 API 응답 행 (구매처 관리) */
interface SupplierSearchRow {
  Id: number;
  PurchaserNo: string;
  PurchaserName: string;
  TransactionType?: string;
  BusinessNo?: string;
}

type PurchasePriceDraft = Omit<PurchasePriceRecord, "id">;

const defaultDraft: PurchasePriceDraft = {
  itemCode: "",
  itemName: "",
  itemSpec: "",
  itemMaterialName: "",
  supplierCode: "",
  supplierName: "",
  applyDate: "",
  unitPrice: 0,
  isTempPrice: false,
  warehouseCode: "",
  storageLocationCode: "",
  orderRate: undefined,
  priceNotUsed: false,
  outsourcingOrderIssue: false,
  outsourcingMethod: "",
  outsourcingReceiptItemCode: "",
  workOrderNo: "",
  plant: "",
  validDate: "",
  validDateAdjust: false,
  currencyCode: "KRW",
  expireDate: "",
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
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemList, setItemList] = useState<ItemSearchRow[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierList, setSupplierList] = useState<SupplierSearchRow[]>([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaultDraft);
    setEditReason("");
  }, [open, initialDraft]);

  useEffect(() => {
    if (!itemSearchOpen) return;
    setItemSearchQuery("");
    fetch(apiPath("/api/items"))
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          setItemList(
            data.items.map((it: any) => ({
              ItemId: it.ItemId,
              ItemNo: it.ItemNo ?? "",
              ItemName: it.ItemName ?? "",
              Specification: it.Specification ?? "",
              Material: it.Material ?? "",
            }))
          );
        } else {
          setItemList([]);
        }
      })
      .catch(() => setItemList([]));
  }, [itemSearchOpen]);

  useEffect(() => {
    if (!supplierSearchOpen) return;
    setSupplierSearchQuery("");
    fetch(apiPath("/api/purchasers"))
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          setSupplierList(
            data.items.map((p: any) => ({
              Id: p.Id,
              PurchaserNo: p.PurchaserNo ?? "",
              PurchaserName: p.PurchaserName ?? "",
              TransactionType: p.TransactionType,
              BusinessNo: p.BusinessNo,
            }))
          );
        } else {
          setSupplierList([]);
        }
      })
      .catch(() => setSupplierList([]));
  }, [supplierSearchOpen]);

  const canSave = useMemo(
    () =>
      draft.itemCode.trim() !== "" &&
      draft.itemName.trim() !== "" &&
      (draft.supplierCode?.trim() !== "" || draft.supplierName?.trim() !== "") &&
      (mode !== "edit" || editReason.trim() !== ""),
    [draft.itemCode, draft.itemName, draft.supplierCode, draft.supplierName, mode, editReason]
  );

  const reset = useCallback(() => {
    setDraft(initialDraft ?? defaultDraft);
    setEditReason("");
  }, [initialDraft]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return itemList;
    const q = itemSearchQuery.trim().toLowerCase();
    return itemList.filter(
      (it) =>
        (it.ItemNo ?? "").toLowerCase().includes(q) ||
        (it.ItemName ?? "").toLowerCase().includes(q) ||
        (it.Specification ?? "").toLowerCase().includes(q) ||
        (it.Material ?? "").toLowerCase().includes(q)
    );
  }, [itemList, itemSearchQuery]);

  const applySelectedItem = useCallback((it: ItemSearchRow) => {
    setDraft((p) => ({
      ...p,
      itemCode: it.ItemNo ?? "",
      itemName: it.ItemName ?? "",
      itemSpec: it.Specification ?? "",
      itemMaterialName: it.Material ?? "",
    }));
    setItemSearchOpen(false);
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return supplierList;
    const q = supplierSearchQuery.trim().toLowerCase();
    return supplierList.filter(
      (p) =>
        (p.PurchaserNo ?? "").toLowerCase().includes(q) ||
        (p.PurchaserName ?? "").toLowerCase().includes(q) ||
        (p.BusinessNo ?? "").toLowerCase().includes(q)
    );
  }, [supplierList, supplierSearchQuery]);

  const applySelectedSupplier = useCallback((p: SupplierSearchRow) => {
    setDraft((prev) => ({
      ...prev,
      supplierCode: p.PurchaserNo ?? "",
      supplierName: p.PurchaserName ?? "",
    }));
    setSupplierSearchOpen(false);
  }, []);

  const formRef = useEnterNavigation();

  const save = useCallback(() => {
    if (!canSave) return;
    const clean: PurchasePriceDraft = {
      ...draft,
      itemCode: draft.itemCode.trim(),
      itemName: draft.itemName.trim(),
      itemSpec: draft.itemSpec?.trim() ?? "",
      itemMaterialName: draft.itemMaterialName?.trim(),
      supplierCode: (draft.supplierCode ?? draft.supplierName ?? "").trim() || (draft.supplierName ?? "").trim(),
      supplierName: draft.supplierName?.trim(),
      applyDate: draft.applyDate.trim(),
      unitPrice: Number(draft.unitPrice) || 0,
      isTempPrice: !!draft.isTempPrice,
      warehouseCode: draft.warehouseCode?.trim(),
      storageLocationCode: draft.storageLocationCode?.trim(),
      orderRate: draft.orderRate != null ? Number(draft.orderRate) : undefined,
      priceNotUsed: !!draft.priceNotUsed,
      outsourcingOrderIssue: !!draft.outsourcingOrderIssue,
      outsourcingMethod: draft.outsourcingMethod?.trim(),
      outsourcingReceiptItemCode: draft.outsourcingReceiptItemCode?.trim(),
      workOrderNo: draft.workOrderNo?.trim(),
      plant: draft.plant?.trim(),
      validDate: draft.validDate?.trim(),
      validDateAdjust: !!draft.validDateAdjust,
      currencyCode: (draft.currencyCode ?? draft.currency ?? "KRW").trim() || "KRW",
      currency: (draft.currency ?? draft.currencyCode ?? "KRW").trim() || "KRW",
      expireDate: draft.expireDate?.trim(),
      devUnitPrice: Number(draft.devUnitPrice) || 0,
      discountRate: Number(draft.discountRate) || 0,
      remarks: draft.remarks?.trim(),
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
      <SheetContent className="flex h-full w-full max-w-4xl flex-col p-0 sm:max-w-4xl">
        <div className="flex items-center justify-between border-b pl-8 pr-5 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              {mode === "edit" ? "구매단가 수정" : "구매단가 등록"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "edit"
                ? "기존 구매단가 정보를 수정합니다."
                : "품목·구매처별 구매단가를 등록합니다. (Data Grid 항목 기준)"}
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

        <div ref={formRef} className="flex flex-col flex-1 min-h-0 pl-8 pr-5 py-4 text-xs">
          <Tabs defaultValue="item" className="flex flex-col flex-1 min-h-0 min-w-0">
            <TabsList className="w-full justify-start h-9 rounded-lg bg-muted/60 p-1 min-w-0">
              <TabsTrigger value="item" className="text-xs px-3">품목 정보</TabsTrigger>
              <TabsTrigger value="supplier" className="text-xs px-3">구매처·단가</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs px-3">재고·발주</TabsTrigger>
              <TabsTrigger value="outsource" className="text-xs px-3">외주·기타</TabsTrigger>
              {mode === "edit" && (
                <TabsTrigger value="editInfo" className="text-xs px-3">수정 정보</TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 mt-3">
              <TabsContent value="item" className="mt-0">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-[12px] text-slate-600 shrink-0">품목번호 *</Label>
                      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setItemSearchOpen(true)}>
                        <Search className="h-3.5 w-3.5 mr-1" /> 검색
                      </Button>
                    </div>
                    <Input value={draft.itemCode} onChange={(e) => setDraft((p) => ({ ...p, itemCode: e.target.value }))} className="h-8 text-xs" placeholder="직접 입력 또는 검색으로 선택" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">품목명 *</Label>
                    <Input value={draft.itemName} onChange={(e) => setDraft((p) => ({ ...p, itemName: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">품목규격</Label>
                    <Input value={draft.itemSpec ?? ""} onChange={(e) => setDraft((p) => ({ ...p, itemSpec: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">품목재질명</Label>
                    <Input value={draft.itemMaterialName ?? ""} onChange={(e) => setDraft((p) => ({ ...p, itemMaterialName: e.target.value }))} className="h-8 text-xs" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="supplier" className="mt-0">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-[12px] text-slate-600 shrink-0">구매처번호 *</Label>
                      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setSupplierSearchOpen(true)}>
                        <Search className="h-3.5 w-3.5 mr-1" /> 검색
                      </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input value={draft.supplierCode ?? ""} onChange={(e) => setDraft((p) => ({ ...p, supplierCode: e.target.value }))} className="h-8 text-xs w-28 shrink-0" placeholder="직접 입력 또는 검색" />
                      <span className="text-xs text-muted-foreground truncate min-w-0 flex-1" title={draft.supplierName ?? ""}>{draft.supplierName ? draft.supplierName : "—"}</span>
                    </div>
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">적용일자</Label>
                    <DateInput value={draft.applyDate} onChange={(e) => setDraft((p) => ({ ...p, applyDate: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">구매단가</Label>
                    <Input value={draft.unitPrice === 0 ? "" : draft.unitPrice} onChange={(e) => setDraft((p) => ({ ...p, unitPrice: Number(e.target.value.replace(/,/g, "")) || 0 }))} className="h-8 text-xs text-right" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox id="isTempPrice" checked={!!draft.isTempPrice} onChange={(e) => setDraft((p) => ({ ...p, isTempPrice: e.target.checked }))} />
                      <Label htmlFor="isTempPrice" className="text-[12px] text-slate-600 cursor-pointer">가단가 여부</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="mt-0">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">창고코드</Label>
                    <Input value={draft.warehouseCode ?? ""} onChange={(e) => setDraft((p) => ({ ...p, warehouseCode: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">저장위치코드</Label>
                    <Input value={draft.storageLocationCode ?? ""} onChange={(e) => setDraft((p) => ({ ...p, storageLocationCode: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">발주정율</Label>
                    <Input type="number" min={0} max={100} step={0.1} value={draft.orderRate ?? ""} onChange={(e) => setDraft((p) => ({ ...p, orderRate: e.target.value === "" ? undefined : Number(e.target.value) }))} className="h-8 text-xs text-right" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox id="priceNotUsed" checked={!!draft.priceNotUsed} onChange={(e) => setDraft((p) => ({ ...p, priceNotUsed: e.target.checked }))} />
                      <Label htmlFor="priceNotUsed" className="text-[12px] text-slate-600 cursor-pointer">단가사용안함</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="outsource" className="mt-0">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="min-h-[3.25rem] flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox id="outsourcingOrderIssue" checked={!!draft.outsourcingOrderIssue} onChange={(e) => setDraft((p) => ({ ...p, outsourcingOrderIssue: e.target.checked }))} />
                      <Label htmlFor="outsourcingOrderIssue" className="text-[12px] text-slate-600 cursor-pointer">외주오더발행여부</Label>
                    </div>
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">외주방법 / 사급구분</Label>
                    <Input value={draft.outsourcingMethod ?? ""} onChange={(e) => setDraft((p) => ({ ...p, outsourcingMethod: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">외주입고품목번호</Label>
                    <Input value={draft.outsourcingReceiptItemCode ?? ""} onChange={(e) => setDraft((p) => ({ ...p, outsourcingReceiptItemCode: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">작지번호</Label>
                    <Input value={draft.workOrderNo ?? ""} onChange={(e) => setDraft((p) => ({ ...p, workOrderNo: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">사업장</Label>
                    <Input value={draft.plant ?? ""} onChange={(e) => setDraft((p) => ({ ...p, plant: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">유효일자</Label>
                    <DateInput value={draft.validDate ?? ""} onChange={(e) => setDraft((p) => ({ ...p, validDate: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox id="validDateAdjust" checked={!!draft.validDateAdjust} onChange={(e) => setDraft((p) => ({ ...p, validDateAdjust: e.target.checked }))} />
                      <Label htmlFor="validDateAdjust" className="text-[12px] text-slate-600 cursor-pointer">유효일자 조정</Label>
                    </div>
                  </div>
                  <div className="min-h-[3.25rem] flex flex-col justify-end gap-1">
                    <Label className="text-[12px] text-slate-600">통화코드</Label>
                    <Input value={draft.currencyCode ?? ""} onChange={(e) => setDraft((p) => ({ ...p, currencyCode: e.target.value }))} className="h-8 text-xs" placeholder="KRW" />
                  </div>
                </div>
              </TabsContent>

              {mode === "edit" && (
                <TabsContent value="editInfo" className="mt-0">
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="min-h-[3.25rem] flex flex-col justify-end gap-1 sm:col-span-2">
                      <Label className="text-[12px] text-slate-600">수정사유 *</Label>
                      <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="예: 원자재 단가 인상에 따른 조정, 신규 계약 단가 반영 등" className="h-8 text-xs" />
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* 품목 검색 모달 */}
        {itemSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg bg-background shadow-lg border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">등록된 품목 검색</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setItemSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 border-b flex gap-2">
                <Input
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  placeholder="품목번호, 품목명, 규격, 재질로 검색"
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setItemSearchQuery("")}
                >
                  초기화
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">품목번호</th>
                      <th className="px-3 py-2 text-left font-medium">품목명</th>
                      <th className="px-3 py-2 text-left font-medium">규격</th>
                      <th className="px-3 py-2 text-left font-medium">재질</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((it) => (
                      <tr
                        key={it.ItemId}
                        className="border-t cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => applySelectedItem(it)}
                      >
                        <td className="px-3 py-1.5">{it.ItemNo}</td>
                        <td className="px-3 py-1.5">{it.ItemName}</td>
                        <td className="px-3 py-1.5">{it.Specification || "-"}</td>
                        <td className="px-3 py-1.5">{it.Material || "-"}</td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                          {itemList.length === 0
                            ? "품목을 불러오는 중이거나 등록된 품목이 없습니다."
                            : "조건에 맞는 품목이 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 구매처 검색 모달 */}
        {supplierSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg bg-background shadow-lg border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">등록된 구매처 검색</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSupplierSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 border-b flex gap-2">
                <Input
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  placeholder="구매처번호, 구매처명, 사업자번호로 검색"
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setSupplierSearchQuery("")}
                >
                  초기화
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">구매처번호</th>
                      <th className="px-3 py-2 text-left font-medium">구매처명</th>
                      <th className="px-3 py-2 text-left font-medium">거래유형</th>
                      <th className="px-3 py-2 text-left font-medium">사업자번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((p) => (
                      <tr
                        key={p.Id}
                        className="border-t cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => applySelectedSupplier(p)}
                      >
                        <td className="px-3 py-1.5">{p.PurchaserNo}</td>
                        <td className="px-3 py-1.5">{p.PurchaserName}</td>
                        <td className="px-3 py-1.5">{p.TransactionType || "-"}</td>
                        <td className="px-3 py-1.5">{p.BusinessNo || "-"}</td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                          {supplierList.length === 0
                            ? "구매처를 불러오는 중이거나 등록된 구매처가 없습니다."
                            : "조건에 맞는 구매처가 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

