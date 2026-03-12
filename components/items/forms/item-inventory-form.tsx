"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import type { ItemRegisterInventory } from "@/types/item-register";
import { warehouseOptions } from "@/lib/item-register-options";

interface ItemInventoryFormProps {
  data: ItemRegisterInventory;
  onChange: (data: ItemRegisterInventory) => void;
}

export function ItemInventoryForm({ data, onChange }: ItemInventoryFormProps) {
  const update = (key: keyof ItemRegisterInventory, value: string | boolean) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">재고정책</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>단위생산량</Label>
              <Input
                type="number"
                value={data.unitProductionQty}
                onChange={(e) => update("unitProductionQty", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>발주간격</Label>
              <Input
                value={data.orderInterval}
                onChange={(e) => update("orderInterval", e.target.value)}
                placeholder="일"
              />
            </div>
            <div className="space-y-2">
              <Label>최소LOT</Label>
              <Input
                type="number"
                value={data.minLot}
                onChange={(e) => update("minLot", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>표준LOT</Label>
              <Input
                type="number"
                value={data.standardLot}
                onChange={(e) => update("standardLot", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>안전재고</Label>
              <Input
                type="number"
                value={data.safetyStock}
                onChange={(e) => update("safetyStock", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>불량율(%)</Label>
              <Input
                type="number"
                value={data.defectRate}
                onChange={(e) => update("defectRate", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>조달기간(일)</Label>
              <Input
                type="number"
                value={data.leadTimeDays}
                onChange={(e) => update("leadTimeDays", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>재발주점</Label>
              <Input
                type="number"
                value={data.reorderPoint}
                onChange={(e) => update("reorderPoint", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>실사주기</Label>
              <Input
                value={data.cycleCountPeriod}
                onChange={(e) => update("cycleCountPeriod", e.target.value)}
                placeholder="일"
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2">
            <Checkbox
              checked={data.receiptToShipImmediate}
              onChange={(e) =>
                update("receiptToShipImmediate", (e.target as HTMLInputElement).checked)
              }
            />
            <span className="text-sm">입고즉시출고 여부</span>
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">창고 / 저장위치</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label>저장위치</Label>
              <Input
                value={data.storageLocation}
                onChange={(e) => update("storageLocation", e.target.value)}
                placeholder="저장위치"
              />
            </div>
            <div className="space-y-2">
              <Label>출고창고</Label>
              <Select
                options={warehouseOptions}
                value={data.shipWarehouse}
                onChange={(v) => update("shipWarehouse", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>출고 저장위치</Label>
              <Input
                value={data.shipStorageLocation}
                onChange={(e) => update("shipStorageLocation", e.target.value)}
                placeholder="저장위치"
              />
            </div>
            <div className="space-y-2">
              <Label>최소LOT(우측)</Label>
              <Input
                type="number"
                value={data.minLotRight}
                onChange={(e) => update("minLotRight", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>납입용기</Label>
              <Input
                value={data.deliveryContainer}
                onChange={(e) => update("deliveryContainer", e.target.value)}
                placeholder="용기"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
