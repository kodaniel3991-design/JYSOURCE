import { KPICard } from "@/components/common/kpi-card";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  ClipboardList,
  PackageOpen,
  AlertTriangle,
} from "lucide-react";

interface DashboardKPICardsProps {
  monthlySpend: number;
  orderCount: number;
  pendingReceipt: number;
  delayedCount: number;
}

export function DashboardKPICards({
  monthlySpend,
  orderCount,
  pendingReceipt,
  delayedCount,
}: DashboardKPICardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="이번달 구매금액"
        value={formatCurrency(monthlySpend)}
        subtitle="전월 대비 +3.2% (mock)"
        icon={FileText}
      />
      <KPICard
        title="발주 건수"
        value={`${orderCount.toLocaleString()}건`}
        subtitle="이번 달 생성된 구매오더"
        icon={ClipboardList}
      />
      <KPICard
        title="미입고 건수"
        value={`${pendingReceipt.toLocaleString()}건`}
        subtitle="입고 대기 또는 부분입고"
        icon={PackageOpen}
      />
      <KPICard
        title="납기지연 건수"
        value={`${delayedCount.toLocaleString()}건`}
        subtitle="주의 필요 발주"
        icon={AlertTriangle}
        className="border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-900/20"
      />
    </section>
  );
}

