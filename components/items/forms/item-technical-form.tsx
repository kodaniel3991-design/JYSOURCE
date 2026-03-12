"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ItemRegisterTechnical } from "@/types/item-register";
import { salesUnitOptions, warehouseOptions } from "@/lib/item-register-options";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, FileSpreadsheet } from "lucide-react";

interface ItemTechnicalFormProps {
  data: ItemRegisterTechnical;
  onChange: (data: ItemRegisterTechnical) => void;
}

export function ItemTechnicalForm({ data, onChange }: ItemTechnicalFormProps) {
  const update = (key: keyof ItemRegisterTechnical, value: string | File[]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">기술 / 도면</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>도면크기</Label>
              <Input
                value={data.drawingSize}
                onChange={(e) => update("drawingSize", e.target.value)}
                placeholder="A3, A4 등"
              />
            </div>
            <div className="space-y-2">
              <Label>중량(kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={data.weightKg}
                onChange={(e) => update("weightKg", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>고객하지장</Label>
              <Input
                value={data.customerSpec}
                onChange={(e) => update("customerSpec", e.target.value)}
                placeholder="고객 사양"
              />
            </div>
            <div className="space-y-2">
              <Label>H-no(직경)</Label>
              <Input
                value={data.hNo}
                onChange={(e) => update("hNo", e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>L-no(비중)</Label>
              <Input
                value={data.lNo}
                onChange={(e) => update("lNo", e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>보증기간</Label>
              <Input
                value={data.warrantyPeriod}
                onChange={(e) => update("warrantyPeriod", e.target.value)}
                placeholder="예: 12개월"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">판매단위 / 포장</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>판매단위</Label>
              <Select
                options={salesUnitOptions}
                value={data.salesUnit}
                onChange={(v) => update("salesUnit", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>판매단위 변환계수</Label>
              <Input
                value={data.salesUnitConversion}
                onChange={(e) => update("salesUnitConversion", e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>수량</Label>
              <Input
                type="number"
                value={data.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>포장수량</Label>
              <Input
                type="number"
                value={data.packQty}
                onChange={(e) => update("packQty", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>납품용기</Label>
              <Input
                value={data.deliveryContainer}
                onChange={(e) => update("deliveryContainer", e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>출하 창고</Label>
              <Select
                options={warehouseOptions}
                value={data.shipWarehouse}
                onChange={(v) => update("shipWarehouse", v)}
                placeholder="선택"
              />
            </div>
            <div className="space-y-2">
              <Label>출하 저장위치</Label>
              <Input
                value={data.shipStorageLocation}
                onChange={(e) => update("shipStorageLocation", e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">첨부 / 미디어</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>이미지 파일</Label>
              <div className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                <FileImage className="mb-2 h-8 w-8" />
                <span className="mb-2">이미지를 드래그하거나 클릭하여 업로드</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="pointer-events-none"
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  업로드
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>도면 파일</Label>
              <div className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                <FileSpreadsheet className="mb-2 h-8 w-8" />
                <span className="mb-2">도면 파일을 드래그하거나 클릭하여 업로드</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="pointer-events-none"
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  업로드
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
