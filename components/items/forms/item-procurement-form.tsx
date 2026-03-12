"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ItemRegisterProcurement } from "@/types/item-register";
import {
  currencyOptions,
  orderPolicyOptions,
  businessUnitOptions,
  managerOptions,
} from "@/lib/item-register-options";
import type { SelectOption } from "@/lib/item-register-options";

interface ItemProcurementFormProps {
  data: ItemRegisterProcurement;
  onChange: (data: ItemRegisterProcurement) => void;
  supplierOptions: SelectOption[];
}

export function ItemProcurementForm({
  data,
  onChange,
  supplierOptions,
}: ItemProcurementFormProps) {
  const update = (key: keyof ItemRegisterProcurement, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">거래정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>거래처</Label>
              <Select
                options={supplierOptions}
                value={data.supplierId}
                onChange={(v) => update("supplierId", v)}
                placeholder="거래처 선택"
              />
            </div>
            <div className="space-y-2">
              <Label>거래처품목번호</Label>
              <Input
                value={data.supplierItemNo}
                onChange={(e) => update("supplierItemNo", e.target.value)}
                placeholder="거래처 품목번호"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">담당자</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>구매담당자</Label>
              <Select
                options={managerOptions}
                value={data.purchaseManager}
                onChange={(v) => update("purchaseManager", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>영업담당자</Label>
              <Select
                options={managerOptions}
                value={data.salesManager}
                onChange={(v) => update("salesManager", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>소요담당자</Label>
              <Select
                options={managerOptions}
                value={data.requirementManager}
                onChange={(v) => update("requirementManager", v)}
                placeholder="선택"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">단가정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>통화코드</Label>
              <Select
                options={currencyOptions}
                value={data.currencyCode}
                onChange={(v) => update("currencyCode", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>구매단가</Label>
              <Input
                type="number"
                value={data.purchaseUnitPrice}
                onChange={(e) => update("purchaseUnitPrice", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>판매단가</Label>
              <Input
                type="number"
                value={data.salesUnitPrice}
                onChange={(e) => update("salesUnitPrice", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>최종입고단가</Label>
              <Input
                type="number"
                value={data.lastReceiptUnitPrice}
                onChange={(e) => update("lastReceiptUnitPrice", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>표준원가</Label>
              <Input
                type="number"
                value={data.standardCost}
                onChange={(e) => update("standardCost", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>사내단가</Label>
              <Input
                type="number"
                value={data.internalPrice}
                onChange={(e) => update("internalPrice", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>발주방침</Label>
              <Select
                options={orderPolicyOptions}
                value={data.orderPolicy}
                onChange={(v) => update("orderPolicy", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>사업장</Label>
              <Select
                options={businessUnitOptions}
                value={data.businessUnit}
                onChange={(v) => update("businessUnit", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>가공업체</Label>
              <Input
                value={data.processor}
                onChange={(e) => update("processor", e.target.value)}
                placeholder="가공업체"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
