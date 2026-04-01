"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SupplierPieChart } from "@/components/charts/supplier-pie-chart";

interface SupplierSpendChartProps {
  data: { name: string; value: number; percentage: number }[];
}

export function SupplierSpendChart({ data }: SupplierSpendChartProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">공급사별 구매 비중</CardTitle>
        <p className="text-xs text-muted-foreground">
          당월 구매금액 기준 상위 5개 공급사
        </p>
      </CardHeader>
      <CardContent>
        <SupplierPieChart data={data} />
      </CardContent>
    </Card>
  );
}

