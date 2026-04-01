"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import type { ItemRegisterBasicInfo } from "@/types/item-register";
import {
  itemStatusOptions,
  salesUnitOptions,
  currencyOptions,
} from "@/lib/item-register-options";
import type { SelectOption } from "@/lib/item-register-options";
import { ItemCopyHelper } from "./item-copy-helper";
import { SearchPopup } from "@/components/common/search-popup";

interface ItemRegisterBasicInfoProps {
  data: ItemRegisterBasicInfo;
  onChange: (data: ItemRegisterBasicInfo) => void;
  onCopyFromItemNo: (itemNo: string) => void;
  supplierOptions: SelectOption[];
}

interface ModelCodeItem {
  id: string;
  ModelCode: string;
  ModelName: string;
  [key: string]: unknown;
}

interface PurchaserItem {
  Id: string;
  PurchaserNo: string;
  PurchaserName: string;
  [key: string]: unknown;
}

interface ItemTypeCodeItem {
  Id: string;
  ItemTypeCode: string;
  ItemTypeName: string;
  [key: string]: unknown;
}

interface ItemTypeItem {
  Id: string;
  ItemTypeCode: string;
  ItemTypeName: string;
  [key: string]: unknown;
}

interface WarehouseItem {
  WarehouseCode: string;
  WarehouseName: string;
  [key: string]: unknown;
}

interface StorageLocationItem {
  WarehouseCode: string;
  StorageLocationCode: string;
  StorageLocationName: string;
  [key: string]: unknown;
}

export function ItemRegisterBasicInfoCard({
  data,
  onChange,
  onCopyFromItemNo,
}: ItemRegisterBasicInfoProps) {
  const [modelPopupOpen, setModelPopupOpen] = useState(false);
  const [purchaserPopupOpen, setPurchaserPopupOpen] = useState(false);
  const [itemFormPopupOpen, setItemFormPopupOpen] = useState(false);
  const [itemTypePopupOpen, setItemTypePopupOpen] = useState(false);
  const [warehousePopupOpen, setWarehousePopupOpen] = useState(false);
  const [storageLocationPopupOpen, setStorageLocationPopupOpen] = useState(false);

  const [plantOptions, setPlantOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    fetch("/api/common-codes?category=plant")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok)
          setPlantOptions(data.items.map((c: { Code: string; Name: string }) => ({ value: c.Code, label: c.Name })));
      })
      .catch(() => {});
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof ItemRegisterBasicInfo, string>>>({});

  const clearError = (key: keyof ItemRegisterBasicInfo) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /** Tab/Enter 시 필수값 체크. 비어있으면 이동 차단 + 에러 표시 후 true 반환 */
  const blockIfEmpty = (
    e: React.KeyboardEvent,
    key: keyof ItemRegisterBasicInfo,
    value: string
  ) => {
    if ((e.key === "Tab" || e.key === "Enter") && !value.trim()) {
      e.preventDefault();
      e.stopPropagation();
      setErrors((prev) => ({ ...prev, [key]: "필수 입력 항목입니다." }));
      return true;
    }
    return false;
  };

  const update = (key: keyof ItemRegisterBasicInfo, value: string) => {
    onChange({ ...data, [key]: value });
  };

  /** 코드 input onChange 시 API 조회 후 정확히 매칭되면 자동 세팅 (debounce 300ms) */
  const confirmCode = useCallback(
    async <T extends Record<string, unknown>>(
      apiUrl: string,
      code: string,
      codeKey: keyof T,
      nameKey: keyof T,
      apply: (code: string, name: string) => void
    ) => {
      if (!code.trim()) return;
      try {
        const res = await fetch(apiUrl);
        const json = await res.json();
        const items: T[] = json?.ok && Array.isArray(json.items) ? json.items : [];
        const match = items.find(
          (item) => String(item[codeKey]).toLowerCase() === code.trim().toLowerCase()
        );
        if (match) apply(String(match[codeKey]), String(match[nameKey]));
      } catch {}
    },
    []
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <ItemCopyHelper
          copyFromItemNo={data.copyFromItemNo}
          onCopyFromChange={(v) => update("copyFromItemNo", v)}
          onCopy={() => onCopyFromItemNo(data.copyFromItemNo)}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              품목번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={data.itemNo}
              onChange={(e) => { update("itemNo", e.target.value); clearError("itemNo"); }}
              onKeyDown={(e) => blockIfEmpty(e, "itemNo", data.itemNo)}
              placeholder="품목번호"
              className="h-9 font-medium"
            />
            {errors.itemNo && <FieldError message={errors.itemNo} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              품목명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={data.itemName}
              onChange={(e) => { update("itemName", e.target.value); clearError("itemName"); }}
              onKeyDown={(e) => blockIfEmpty(e, "itemName", data.itemName)}
              placeholder="품목명"
              className="h-9 font-medium"
            />
            {errors.itemName && <FieldError message={errors.itemName} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              품목상황 <span className="text-destructive">*</span>
            </Label>
            <Select
              options={itemStatusOptions}
              value={data.itemStatusCategory}
              onChange={(v) => update("itemStatusCategory", v)}
            />
          </div>

          {/* 품목형태 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">품목형태 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.itemForm}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, itemForm: v, itemFormName: "" });
                  clearError("itemForm");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    confirmCode<ItemTypeCodeItem>("/api/item-type-codes", v, "ItemTypeCode", "ItemTypeName",
                      (code, name) => onChange({ ...dataRef.current, itemForm: code, itemFormName: name }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "itemForm", data.itemForm)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    confirmCode<ItemTypeCodeItem>("/api/item-type-codes", data.itemForm, "ItemTypeCode", "ItemTypeName",
                      (code, name) => onChange({ ...dataRef.current, itemForm: code, itemFormName: name }));
                  }
                }}
                placeholder="형태코드"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setItemFormPopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.itemFormName}
                readOnly
                placeholder="품목형태명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.itemForm && <FieldError message={errors.itemForm} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">재고단위 <span className="text-destructive">*</span></Label>
            <Select
              options={salesUnitOptions}
              value={data.stockUnit}
              onChange={(v) => update("stockUnit", v)}
              placeholder="선택"
            />
          </div>

          {/* 품목유형 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">품목유형 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.itemType}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, itemType: v, itemTypeName: "" });
                  clearError("itemType");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    confirmCode<ItemTypeItem>("/api/item-types", v, "ItemTypeCode", "ItemTypeName",
                      (code, name) => onChange({ ...dataRef.current, itemType: code, itemTypeName: name }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "itemType", data.itemType)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    confirmCode<ItemTypeItem>("/api/item-types", data.itemType, "ItemTypeCode", "ItemTypeName",
                      (code, name) => onChange({ ...dataRef.current, itemType: code, itemTypeName: name }));
                  }
                }}
                placeholder="유형코드"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setItemTypePopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.itemTypeName}
                readOnly
                placeholder="품목유형명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.itemType && <FieldError message={errors.itemType} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">판매단위 <span className="text-destructive">*</span></Label>
            <Select
              options={salesUnitOptions}
              value={data.salesUnit}
              onChange={(v) => update("salesUnit", v)}
              placeholder="선택"
            />
          </div>

          {/* 제품모델 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">제품모델 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.productModel}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, productModel: v, productModelName: "" });
                  clearError("productModel");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    confirmCode<ModelCodeItem>("/api/model-codes", v, "ModelCode", "ModelName",
                      (code, name) => onChange({ ...dataRef.current, productModel: code, productModelName: name }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "productModel", data.productModel)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    confirmCode<ModelCodeItem>("/api/model-codes", data.productModel, "ModelCode", "ModelName",
                      (code, name) => onChange({ ...dataRef.current, productModel: code, productModelName: name }));
                  }
                }}
                placeholder="모델코드"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setModelPopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.productModelName}
                readOnly
                placeholder="모델명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.productModel && <FieldError message={errors.productModel} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">구매단가 <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              value={data.purchaseUnitPrice}
              onChange={(e) => { update("purchaseUnitPrice", e.target.value); clearError("purchaseUnitPrice"); }}
              onKeyDown={(e) => blockIfEmpty(e, "purchaseUnitPrice", data.purchaseUnitPrice)}
              placeholder="0"
              className="h-9"
            />
            {errors.purchaseUnitPrice && <FieldError message={errors.purchaseUnitPrice} />}
          </div>

          {/* 거래처 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">거래처 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.supplierId}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, supplierId: v, supplierName: "" });
                  clearError("supplierId");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    confirmCode<PurchaserItem>("/api/purchasers", v, "PurchaserNo", "PurchaserName",
                      (code, name) => onChange({ ...dataRef.current, supplierId: code, supplierName: name }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "supplierId", data.supplierId)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    confirmCode<PurchaserItem>("/api/purchasers", data.supplierId, "PurchaserNo", "PurchaserName",
                      (code, name) => onChange({ ...dataRef.current, supplierId: code, supplierName: name }));
                  }
                }}
                placeholder="구매처번호"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setPurchaserPopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.supplierName}
                readOnly
                placeholder="구매처명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.supplierId && <FieldError message={errors.supplierId} />}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">통화코드 <span className="text-destructive">*</span></Label>
            <Select
              options={currencyOptions}
              value={data.currencyCode}
              onChange={(v) => update("currencyCode", v)}
            />
          </div>

          {/* 창고 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">창고 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.warehouse}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, warehouse: v, warehouseName: "", storageLocation: "", storageLocationName: "" });
                  clearError("warehouse");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    confirmCode<WarehouseItem>("/api/warehouses", v, "WarehouseCode", "WarehouseName",
                      (code, name) => onChange({ ...dataRef.current, warehouse: code, warehouseName: name, storageLocation: "", storageLocationName: "" }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "warehouse", data.warehouse)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    confirmCode<WarehouseItem>("/api/warehouses", data.warehouse, "WarehouseCode", "WarehouseName",
                      (code, name) => onChange({ ...dataRef.current, warehouse: code, warehouseName: name, storageLocation: "", storageLocationName: "" }));
                  }
                }}
                placeholder="창고코드"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setWarehousePopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.warehouseName}
                readOnly
                placeholder="창고명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.warehouse && <FieldError message={errors.warehouse} />}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">사업장 <span className="text-destructive">*</span></Label>
            <Select
              options={plantOptions}
              value={data.plant}
              onChange={(v) => update("plant", v)}
              placeholder="선택"
            />
          </div>
          {/* 저장위치 - 팝업 검색 */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">저장위치 <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              <Input
                value={data.storageLocation}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...dataRef.current, storageLocation: v, storageLocationName: "" });
                  clearError("storageLocation");
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    const apiUrl = dataRef.current.warehouse
                      ? `/api/storage-locations?warehouseCode=${dataRef.current.warehouse}`
                      : `/api/storage-locations`;
                    confirmCode<StorageLocationItem>(apiUrl, v, "StorageLocationCode", "StorageLocationName",
                      (code, name) => onChange({ ...dataRef.current, storageLocation: code, storageLocationName: name }));
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (blockIfEmpty(e, "storageLocation", data.storageLocation)) return;
                  if (e.key === "Enter") {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    const apiUrl = data.warehouse
                      ? `/api/storage-locations?warehouseCode=${data.warehouse}`
                      : `/api/storage-locations`;
                    confirmCode<StorageLocationItem>(apiUrl, data.storageLocation, "StorageLocationCode", "StorageLocationName",
                      (code, name) => onChange({ ...dataRef.current, storageLocation: code, storageLocationName: name }));
                  }
                }}
                placeholder="저장위치코드"
                className="h-9 w-36 shrink-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setStorageLocationPopupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Input
                value={data.storageLocationName}
                readOnly
                placeholder="저장위치명"
                className="h-9 flex-1 bg-muted text-muted-foreground"
              />
            </div>
            {errors.storageLocation && <FieldError message={errors.storageLocation} />}
          </div>
        </div>

        {/* 품목형태 팝업 */}
        <SearchPopup<ItemTypeCodeItem>
          open={itemFormPopupOpen}
          onOpenChange={setItemFormPopupOpen}
          title="품목형태"
          apiUrl="/api/item-type-codes"
          columns={[
            { key: "ItemTypeCode", header: "형태코드", width: 120 },
            { key: "ItemTypeName", header: "품목형태명" },
          ]}
          searchKeys={["ItemTypeCode", "ItemTypeName"]}
          keyExtractor={(item) => item.Id}
          initialSearchCode={data.itemForm}
          onSelect={(item) => {
            onChange({ ...data, itemForm: item.ItemTypeCode, itemFormName: item.ItemTypeName });
          }}
        />

        {/* 품목유형 팝업 */}
        <SearchPopup<ItemTypeItem>
          open={itemTypePopupOpen}
          onOpenChange={setItemTypePopupOpen}
          title="품목유형"
          apiUrl="/api/item-types"
          columns={[
            { key: "ItemTypeCode", header: "유형코드", width: 120 },
            { key: "ItemTypeName", header: "품목유형명" },
          ]}
          searchKeys={["ItemTypeCode", "ItemTypeName"]}
          keyExtractor={(item) => item.Id}
          initialSearchCode={data.itemType}
          onSelect={(item) => {
            onChange({ ...data, itemType: item.ItemTypeCode, itemTypeName: item.ItemTypeName });
          }}
        />

        {/* 제품모델 팝업 */}
        <SearchPopup<ModelCodeItem>
          open={modelPopupOpen}
          onOpenChange={setModelPopupOpen}
          title="모델 코드"
          apiUrl="/api/model-codes"
          columns={[
            { key: "ModelCode", header: "모델코드", width: 150 },
            { key: "ModelName", header: "모델명" },
          ]}
          searchKeys={["ModelCode", "ModelName"]}
          keyExtractor={(item) => item.id}
          initialSearchCode={data.productModel}
          onSelect={(item) => {
            onChange({ ...data, productModel: item.ModelCode, productModelName: item.ModelName });
          }}
        />

        {/* 거래처 팝업 */}
        <SearchPopup<PurchaserItem>
          open={purchaserPopupOpen}
          onOpenChange={setPurchaserPopupOpen}
          title="구매처"
          apiUrl="/api/purchasers"
          columns={[
            { key: "PurchaserNo", header: "구매처번호", width: 120 },
            { key: "PurchaserName", header: "구매처명" },
          ]}
          searchKeys={["PurchaserNo", "PurchaserName"]}
          keyExtractor={(item) => item.Id}
          initialSearchCode={data.supplierId}
          onSelect={(item) => {
            onChange({ ...data, supplierId: item.PurchaserNo, supplierName: item.PurchaserName });
          }}
        />

        {/* 창고 팝업 */}
        <SearchPopup<WarehouseItem>
          open={warehousePopupOpen}
          onOpenChange={setWarehousePopupOpen}
          title="창고"
          apiUrl="/api/warehouses"
          columns={[
            { key: "WarehouseCode", header: "창고코드", width: 120 },
            { key: "WarehouseName", header: "창고명" },
          ]}
          searchKeys={["WarehouseCode", "WarehouseName"]}
          keyExtractor={(item) => String(item.WarehouseCode)}
          initialSearchCode={data.warehouse}
          onSelect={(item) => {
            onChange({
              ...data,
              warehouse: item.WarehouseCode,
              warehouseName: item.WarehouseName,
              storageLocation: "",
              storageLocationName: "",
            });
          }}
        />

        {/* 저장위치 팝업 */}
        <SearchPopup<StorageLocationItem>
          open={storageLocationPopupOpen}
          onOpenChange={setStorageLocationPopupOpen}
          title="저장위치"
          apiUrl={data.warehouse ? `/api/storage-locations?warehouseCode=${data.warehouse}` : `/api/storage-locations`}
          columns={[
            { key: "WarehouseCode", header: "창고코드", width: 100 },
            { key: "StorageLocationCode", header: "저장위치코드", width: 120 },
            { key: "StorageLocationName", header: "저장위치명" },
          ]}
          searchKeys={["StorageLocationCode", "StorageLocationName"]}
          keyExtractor={(item) => `${item.WarehouseCode}-${item.StorageLocationCode}`}
          initialSearchCode={data.storageLocation}
          onSelect={(item) => {
            onChange({
              ...data,
              storageLocation: item.StorageLocationCode,
              storageLocationName: item.StorageLocationName,
            });
          }}
        />


      </CardContent>
    </Card>
  );
}
