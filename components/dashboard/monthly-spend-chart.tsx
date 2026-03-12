"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineSpendChart } from "@/components/charts/line-spend-chart";

interface MonthlySpendChartProps {
  data: { month: string; amount: number }[];
}

export function MonthlySpendChart({ data }: MonthlySpendChartProps) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-base">월별 구매금액 추이</CardTitle>
        <p className="text-xs text-muted-foreground">
          최근 6개월 기준, 단위: 원
        </p>
      </CardHeader>
      <CardContent>
        <LineSpendChart data={data} />
      </CardContent>
    </Card>
  );
}

