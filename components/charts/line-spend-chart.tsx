"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  month: string;
  amount: number;
  orderCount?: number;
}

interface LineSpendChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
}

export function LineSpendChart({ data, title, className }: LineSpendChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  const displayData = safeData.map((d) => ({
    ...d,
    displayMonth: (d.month ?? "").slice(0, 7).replace("-", "/"),
  }));

  return (
    <div className={className}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="displayMonth"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatCurrency(value), "금액"]}
            labelFormatter={(label) => `월: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
