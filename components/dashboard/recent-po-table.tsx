"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/common/data-table";
import { POStatusBadge } from "@/components/common/status-badge";
import type { PurchaseOrderSummary } from "@/types/purchase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RecentPOTableProps {
  data: PurchaseOrderSummary[];
}

export function RecentPOTable({ data }: RecentPOTableProps) {
  const columns: Column<PurchaseOrderSummary>[] = [
    {
      key: "__no__",
      header: "No",
      className: "w-10 text-center text-muted-foreground",
      cell: (_row, index) => index + 1,
    },
    {
      key: "poNumber",
      header: "PO 번호",
      cell: (row) => (
        <span className="font-medium text-primary">{row.poNumber}</span>
      ),
    },
    { key: "supplierName", header: "공급사" },
    {
      key: "totalAmount",
      header: "총금액",
      cell: (row) => formatCurrency(row.totalAmount),
      className: "text-right",
    },
    {
      key: "dueDate",
      header: "납기일",
      cell: (row) => formatDate(row.dueDate),
    },
    {
      key: "status",
      header: "상태",
      cell: (row) => <POStatusBadge status={row.status} />,
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">최근 구매오더</CardTitle>
          <p className="text-xs text-muted-foreground">최근 5건</p>
        </div>
        <Link href="/purchase-orders">
          <Button variant="ghost" size="sm" className="text-xs">
            전체 보기
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
      </CardContent>
    </Card>
  );
}

