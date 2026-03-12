"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { ItemRegisterContacts } from "@/types/item-register";
import {
  managerOptions,
  businessUnitOptions,
  warehouseOptions,
  manufacturerOptions,
} from "@/lib/item-register-options";

interface ItemContactsFormProps {
  data: ItemRegisterContacts;
  onChange: (data: ItemRegisterContacts) => void;
}

export function ItemContactsForm({ data, onChange }: ItemContactsFormProps) {
  const update = (key: keyof ItemRegisterContacts, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">담당자 / 조직</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="space-y-2">
              <Label>사업장</Label>
              <Select
                options={businessUnitOptions}
                value={data.businessUnit}
                onChange={(v) => update("businessUnit", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>창고</Label>
              <Select
                options={warehouseOptions}
                value={data.warehouse}
                onChange={(v) => update("warehouse", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>가공업체</Label>
              <Input
                value={data.processor}
                onChange={(e) => update("processor", e.target.value)}
                placeholder="가공업체"
              />
            </div>
            <div className="space-y-2">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">운영 / 이력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>최근 수정자</Label>
              <Input
                value={data.lastModifiedBy}
                onChange={(e) => update("lastModifiedBy", e.target.value)}
                placeholder="자동 입력"
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>최근 수정일</Label>
              <Input
                type="datetime-local"
                value={data.lastModifiedAt}
                onChange={(e) => update("lastModifiedAt", e.target.value)}
                placeholder="자동 입력"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>비고 (내부 메모)</Label>
            <Textarea
              value={data.internalNote}
              onChange={(e) => update("internalNote", e.target.value)}
              placeholder="내부 메모"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
