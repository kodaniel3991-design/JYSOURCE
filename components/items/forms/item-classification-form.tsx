"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import type { ItemRegisterClassification } from "@/types/item-register";
import {
  itemFormOptions,
  itemTypeOptions,
  valueCategoryOptions,
  itemUserCategoryOptions,
  itemUsageClassificationOptions,
  materialOptions,
  manufacturerOptions,
} from "@/lib/item-register-options";

interface ItemClassificationFormProps {
  data: ItemRegisterClassification;
  onChange: (data: ItemRegisterClassification) => void;
}

export function ItemClassificationForm({
  data,
  onChange,
}: ItemClassificationFormProps) {
  const update = (key: keyof ItemRegisterClassification, value: string | boolean) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">분류 / 속성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>품목형태</Label>
              <Select
                options={itemFormOptions}
                value={data.itemForm}
                onChange={(v) => update("itemForm", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>품목유형</Label>
              <Select
                options={itemTypeOptions}
                value={data.itemType}
                onChange={(v) => update("itemType", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>제품모델</Label>
              <Input
                value={data.productModel}
                onChange={(e) => update("productModel", e.target.value)}
                placeholder="차종/모델"
              />
            </div>
            <div className="space-y-2">
              <Label>가치분류</Label>
              <Select
                options={valueCategoryOptions}
                value={data.valueCategory}
                onChange={(v) => update("valueCategory", v)}
                placeholder="선택"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2">
              <Checkbox
                checked={data.jitFlag}
                onChange={(e) => update("jitFlag", (e.target as HTMLInputElement).checked)}
              />
              <span className="text-sm">JIT 구분</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <Checkbox
                checked={data.exportFlag}
                onChange={(e) => update("exportFlag", (e.target as HTMLInputElement).checked)}
              />
              <span className="text-sm">수출구분</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <Checkbox
                checked={data.importFlag}
                onChange={(e) => update("importFlag", (e.target as HTMLInputElement).checked)}
              />
              <span className="text-sm">수입구분</span>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>품목사용자분류코드</Label>
              <Select
                options={itemUserCategoryOptions}
                value={data.itemUserCategoryCode}
                onChange={(v) => update("itemUserCategoryCode", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>품목사용자구분코드</Label>
              <Select
                options={itemUsageClassificationOptions}
                value={data.itemUsageClassificationCode}
                onChange={(v) => update("itemUsageClassificationCode", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>상거래 상품ID</Label>
              <Input
                value={data.commerceProductId}
                onChange={(e) => update("commerceProductId", e.target.value)}
                placeholder="상품 ID"
              />
            </div>
            <div className="space-y-2">
              <Label>재질</Label>
              <Select
                options={materialOptions}
                value={data.material}
                onChange={(v) => update("material", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>제조사</Label>
              <Select
                options={manufacturerOptions}
                value={data.manufacturer}
                onChange={(v) => update("manufacturer", v)}
                placeholder="선택"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
