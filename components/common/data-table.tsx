"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  resultCount?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  resultCount,
  emptyMessage = "No data found.",
  emptyIcon,
  pagination,
  className,
}: DataTableProps<T>) {
  const safeData = Array.isArray(data) ? data : [];
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  if (safeData.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center",
          className
        )}
      >
        {emptyIcon}
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </p>
      )}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeData.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell
                      ? col.cell(row)
                      : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
