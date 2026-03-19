"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 컬럼 정의: 헤더, 셀 렌더, 최소/최대 너비, 추가 클래스 */
export interface MasterListGridColumn<T> {
  key: string;
  header: string;
  minWidth?: string | number;
  maxWidth?: string | number;
  /** 셀 렌더. 미제공 시 row[key] 사용 */
  cell?: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** 헤더 정렬 (기본 왼쪽) */
  align?: "left" | "right" | "center";
}

export type MasterListGridVariant = "default" | "striped";

export interface MasterListGridProps<T> {
  columns: MasterListGridColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** 선택된 행 ID (keyExtractor 결과). 지정 시 공용 선택 하이라이트 적용 */
  selectedRowId?: string | null;
  /** 선택된 행에 적용할 클래스 (미지정 시 기본 밝은 강조) */
  selectedRowClassName?: string;
  /** 행별 추가 클래스 (줄무늬, 선택 하이라이트 등) */
  getRowClassName?: (row: T, index: number) => string;
  emptyMessage?: React.ReactNode;
  /** 스크롤 영역 최대 높이 (기본 65vh) */
  maxHeight?: string;
  /** true이면 가로 스크롤 비활성화 (overflow-x-hidden) */
  noHorizontalScroll?: boolean;
  /** 페이지네이션 영역 표시 (첨부 이미지 영역) */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
  /** 공통 프리셋 (줄무늬 등) */
  variant?: MasterListGridVariant;
  /** 자동 페이지네이션 시 페이지 크기 (기본 10) */
  pageSize?: number;
}

const defaultEmptyMessage = "조회된 데이터가 없습니다.";

/**
 * 품목 마스터 목록 등에 사용하는 공통 그리드.
 * - 최대 높이 제한 + 스크롤, 고정 헤더, 컴팩트 행(h-8, text-xs)을 시스템 전체 동일 적용.
 */
export function MasterListGrid<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedRowId,
  selectedRowClassName,
  getRowClassName,
  emptyMessage = defaultEmptyMessage,
  maxHeight = "65vh",
  noHorizontalScroll = false,
  pagination,
  className,
  variant = "default",
  pageSize: pageSizeProp,
}: MasterListGridProps<T>) {
  const colCount = columns.length;
  const autoPageSize = pageSizeProp ?? 10;
  const shouldAutoPaginate = !pagination && data.length > autoPageSize;
  const [internalPage, setInternalPage] = React.useState(1);

  React.useEffect(() => {
    if (shouldAutoPaginate) setInternalPage(1);
  }, [shouldAutoPaginate, data]);

  const effectivePagination = pagination
    ? pagination
    : shouldAutoPaginate
      ? {
          page: internalPage,
          pageSize: autoPageSize,
          total: data.length,
          onPageChange: setInternalPage,
        }
      : undefined;

  const totalPages = effectivePagination
    ? Math.max(1, Math.ceil(effectivePagination.total / effectivePagination.pageSize))
    : 1;

  const start = effectivePagination
    ? (effectivePagination.page - 1) * effectivePagination.pageSize
    : 0;

  const rangeStart = effectivePagination
    ? effectivePagination.total === 0
      ? 0
      : start + 1
    : 0;

  const rangeEnd = effectivePagination
    ? Math.min(start + effectivePagination.pageSize, effectivePagination.total)
    : 0;

  const rowsToRender = shouldAutoPaginate
    ? data.slice(start, start + autoPageSize)
    : data;

  const selectedClass =
    selectedRowClassName ??
    // 라이트 모드에서는 약간 더 진하게, 다크 모드는 매우 옅게
    "bg-sky-100/80 ring-1 ring-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:ring-sky-600 dark:hover:bg-sky-500/25";

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      style={maxHeight === "100%" ? { height: "100%" } : undefined}
    >
      <div
        className={cn(
          "flex-1 rounded-lg border",
          noHorizontalScroll ? "overflow-x-hidden overflow-y-auto" : "overflow-auto"
        )}
        style={{
          ...(maxHeight === "100%" ? undefined : { maxHeight }),
        }}
      >
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-muted/80 [&_th]:shadow-[0_1px_0_0_hsl(var(--border))]">
            <TableRow className="h-8 border-b hover:bg-transparent">
              {columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "";
                const minWidth =
                  col.minWidth == null
                    ? undefined
                    : typeof col.minWidth === "number"
                      ? `${col.minWidth}px`
                      : col.minWidth;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "h-8 whitespace-nowrap px-3 py-1.5 text-xs",
                      alignClass,
                      col.headerClassName
                    )}
                    style={minWidth ? { minWidth } : undefined}
                  >
                    {col.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsToRender.map((row, index) => (
              <TableRow
                key={keyExtractor(row)}
                className={cn(
                  "h-8 whitespace-nowrap",
                  onRowClick &&
                    "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/40",
                  variant === "striped" &&
                    index % 2 === 1 &&
                    // 라이트 모드: 살짝 더 진한 회색, 다크 모드: 옅은 회색
                    "bg-slate-100 dark:bg-slate-700/20",
                  selectedRowId && keyExtractor(row) === selectedRowId && selectedClass,
                  getRowClassName?.(row, index)
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const content = col.cell
                    ? col.cell(row, index)
                    : (row as Record<string, unknown>)[col.key] as React.ReactNode;
                  const maxWidth =
                    col.maxWidth == null
                      ? undefined
                      : typeof col.maxWidth === "number"
                        ? `${col.maxWidth}px`
                        : col.maxWidth;
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-3 py-1.5 text-xs",
                        maxWidth && "truncate",
                        col.cellClassName
                      )}
                      style={maxWidth ? { maxWidth } : undefined}
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {rowsToRender.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="py-10 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {effectivePagination && totalPages > 1 && (
        <div className="shrink-0 flex flex-col items-start justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
          <span>
            <span className="font-semibold">
              {rangeStart}~{rangeEnd}
            </span>
            / <span className="font-semibold">{effectivePagination.total}</span>건
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.page <= 1}
              onClick={() =>
                effectivePagination.onPageChange(Math.max(1, effectivePagination.page - 1))
              }
            >
              이전
            </Button>
            <span>
              <span className="font-semibold">{effectivePagination.page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span> 페이지
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePagination.page >= totalPages}
              onClick={() =>
                effectivePagination.onPageChange(
                  Math.min(totalPages, effectivePagination.page + 1)
                )
              }
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
