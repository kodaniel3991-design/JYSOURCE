import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { POStatusBadge } from "@/components/common/status-badge";
import type { PurchaseOrder } from "@/types/purchase";

interface POSummaryCardsProps {
  po: PurchaseOrder;
  className?: string;
}

export function POSummaryCards({ po, className }: POSummaryCardsProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
      <Card>
        <CardHeader className="pb-2">
          <span className="text-xs font-medium text-muted-foreground">공급사</span>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{po.supplierName}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <span className="text-xs font-medium text-muted-foreground">총금액</span>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{formatCurrency(po.totalAmount, po.currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <span className="text-xs font-medium text-muted-foreground">납기일</span>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{formatDate(po.dueDate)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <span className="text-xs font-medium text-muted-foreground">상태</span>
        </CardHeader>
        <CardContent>
          <POStatusBadge status={po.status} />
        </CardContent>
      </Card>
    </div>
  );
}
