"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ItemRegisterBasicInfo } from "@/types/item-register";
import { itemStatusOptions } from "@/lib/item-register-options";
import { ItemCopyHelper } from "./item-copy-helper";

interface ItemRegisterBasicInfoProps {
  data: ItemRegisterBasicInfo;
  onChange: (data: ItemRegisterBasicInfo) => void;
  onCopyFromItemNo: (itemNo: string) => void;
}

export function ItemRegisterBasicInfoCard({
  data,
  onChange,
  onCopyFromItemNo,
}: ItemRegisterBasicInfoProps) {
  const update = (key: keyof ItemRegisterBasicInfo, value: string) => {
    onChange({ ...data, [key]: value });
  };

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
              onChange={(e) => update("itemNo", e.target.value)}
              placeholder="품목번호"
              className="h-9 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              품목명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={data.itemName}
              onChange={(e) => update("itemName", e.target.value)}
              placeholder="품목명"
              className="h-9 font-medium"
            />
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
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">
              규격 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={data.specification}
              onChange={(e) => update("specification", e.target.value)}
              placeholder="규격"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">도면번호</Label>
            <Input
              value={data.drawingNo}
              onChange={(e) => update("drawingNo", e.target.value)}
              placeholder="도면번호"
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
