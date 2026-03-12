import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Medal, PackageSearch, AlertCircle } from "lucide-react";

interface TopSupplier {
  name: string;
  amount: number;
  share: number;
}

interface TopItem {
  itemName: string;
  category: string;
  orderCount: number;
  amount: number;
}

interface PendingAction {
  type: string;
  label: string;
  count: number;
}

interface DashboardSummaryWidgetsProps {
  topSuppliers: TopSupplier[];
  topItems: TopItem[];
  pendingActions: PendingAction[];
}

export function DashboardSummaryWidgets({
  topSuppliers,
  topItems,
  pendingActions,
}: DashboardSummaryWidgetsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4 text-amber-500" />
            핵심 공급사
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {topSuppliers.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5"
            >
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  점유율 {s.share}%
                </p>
              </div>
              <span className="text-xs font-semibold">
                {formatCurrency(s.amount)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageSearch className="h-4 w-4 text-sky-500" />
            핵심 구매 품목
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {topItems.map((i) => (
            <div
              key={i.itemName}
              className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5"
            >
              <div>
                <p className="font-medium text-slate-900">{i.itemName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {i.category} · {i.orderCount}건
                </p>
              </div>
              <span className="text-xs font-semibold">
                {formatCurrency(i.amount)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-indigo-500" />
            처리 필요 작업
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {pendingActions.map((a) => (
            <div
              key={a.type}
              className="flex items-center justify-between rounded-md border px-2 py-1.5"
            >
              <p className="text-slate-800">{a.label}</p>
              <span className="text-xs font-semibold text-indigo-600">
                {a.count}건
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

