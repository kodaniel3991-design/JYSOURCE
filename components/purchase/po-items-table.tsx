"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { POItem } from "@/types/purchase";

interface POItemsTableProps {
  items: POItem[];
  className?: string;
}

export function POItemsTable({ items = [], className }: POItemsTableProps) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">품목 리스트</h3>
        <span className="text-xs text-muted-foreground">{safeItems.length}건</span>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>품목코드</TableHead>
              <TableHead>품목명</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">단가</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>납기</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.itemCode}</TableCell>
                <TableCell>{item.itemName}</TableCell>
                <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.dueDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
