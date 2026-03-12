"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  percentage?: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 33%, 45%)",
  "hsl(217, 33%, 55%)",
  "hsl(217, 33%, 65%)",
  "hsl(217, 20%, 75%)",
];

interface SupplierPieChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
}

export function SupplierPieChart({ data, title, className }: SupplierPieChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  const chartData = safeData.map((d) => ({
    name: d.name,
    value: d.value,
    percentage: d.percentage,
  }));

  return (
    <div className={className}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number, name: string, props: { payload?: { percentage?: number } }) => [
              `${formatCurrency(value)}${props.payload?.percentage != null ? ` (${props.payload.percentage}%)` : ""}`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
