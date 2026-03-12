"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  supplierName: string;
  amount: number;
}

interface BarSpendChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
}

export function BarSpendChart({ data, title, className }: BarSpendChartProps) {
  return (
    <div className={className}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${(v / 100000000).toFixed(1)}억`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="supplierName"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number) => [formatCurrency(value), "구매금액"]}
          />
          <Bar
            dataKey="amount"
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
