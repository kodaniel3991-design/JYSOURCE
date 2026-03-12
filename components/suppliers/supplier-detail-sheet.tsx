"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierStatusBadge } from "@/components/common/status-badge";
import { SupplierGradeBadge } from "@/components/common/status-badge";
import { formatCurrency } from "@/lib/utils";
import type { SupplierDetail } from "@/types/supplier";
import { Badge } from "@/components/ui/badge";

interface SupplierDetailSheetProps {
  supplier: SupplierDetail | null;
  onClose?: () => void;
  className?: string;
}

export function SupplierDetailSheet({
  supplier,
  onClose,
  className,
}: SupplierDetailSheetProps) {
  if (!supplier) return null;

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{supplier.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {supplier.contactName} · {supplier.contactEmail}
            </p>
            <div className="mt-2 flex gap-2">
              <SupplierStatusBadge status={supplier.status} />
              <SupplierGradeBadge grade={supplier.grade} />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">기본정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">국가</span>
              <span>{supplier.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">연락처</span>
              <span>{supplier.contactPhone}</span>
            </div>
            {supplier.address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">주소</span>
                <span className="text-right">{supplier.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">누적 거래금액</span>
              <span className="font-medium">{formatCurrency(supplier.totalSpend)}</span>
            </div>
          </CardContent>
        </Card>

        {supplier.evaluation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">평가정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">품질</p>
                  <p className="text-lg font-semibold">{supplier.evaluation.quality}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">납기</p>
                  <p className="text-lg font-semibold">{supplier.evaluation.delivery}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">가격</p>
                  <p className="text-lg font-semibold">{supplier.evaluation.price}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">종합</p>
                  <p className="text-lg font-semibold">{supplier.evaluation.overall}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {supplier.recentOrders && supplier.recentOrders.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">최근 발주이력</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {supplier.recentOrders.map((order, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{order.poNumber}</span>
                    <span>{formatCurrency(order.amount)}</span>
                    <span className="text-muted-foreground">{order.date}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {supplier.suppliedItems && supplier.suppliedItems.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">공급 품목</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {supplier.suppliedItems.map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item.itemCode} · {item.itemName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
