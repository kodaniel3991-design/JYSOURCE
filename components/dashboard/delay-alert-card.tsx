"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DelayAlert {
  poNumber: string;
  supplierName: string;
  itemName: string;
  dueDate: string;
  delayDays: number;
  severity: "low" | "medium" | "high";
}

interface DelayAlertCardProps {
  items: DelayAlert[];
}

const severityColor: Record<DelayAlert["severity"], string> = {
  low: "text-amber-500",
  medium: "text-amber-600",
  high: "text-red-600",
};

export function DelayAlertCard({ items }: DelayAlertCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          납기지연 알림
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-xs">
          {items.map((d, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {d.poNumber} · {d.supplierName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {d.itemName} · 납기 {d.dueDate}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold ${severityColor[d.severity]}`}
              >
                {d.delayDays}일 지연
              </span>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-xs text-muted-foreground">
              현재 지연 중인 발주가 없습니다.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

