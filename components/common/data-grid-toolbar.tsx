"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Columns3, Download, LayoutGrid, SlidersHorizontal } from "lucide-react";

export type DataGridToolbarActiveKey = "export" | "sort" | "columns" | "view";

export interface DataGridToolbarProps {
  onExport?: () => void;
  onSort?: () => void;
  onColumns?: () => void;
  onView?: () => void;
  active?: DataGridToolbarActiveKey;
  className?: string;
}

/**
 * 데이터 그리드 카드 상단 공통 툴바.
 * - 내보내기 / 정렬 / 컬럼 / 보기 버튼을 동일 UI로 재사용.
 */
export function DataGridToolbar({
  onExport,
  onSort,
  onColumns,
  onView,
  active,
  className,
}: DataGridToolbarProps) {
  const baseClass =
    "border border-slate-300 dark:border-slate-600 rounded-md text-slate-800";
  const activeClass =
    "bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground";
  const hoverClass =
    "hover:bg-primary hover:text-primary-foreground hover:border-primary data-[state=open]:bg-primary data-[state=open]:text-primary-foreground";

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className ?? ""}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={!onExport}
        className={cn(baseClass, hoverClass, active === "export" && activeClass)}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        내보내기
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSort}
        disabled={!onSort}
        className={cn(baseClass, hoverClass, active === "sort" && activeClass)}
      >
        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
        정렬
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onColumns}
        disabled={!onColumns}
        className={cn(baseClass, hoverClass, active === "columns" && activeClass)}
      >
        <Columns3 className="mr-1.5 h-3.5 w-3.5" />
        컬럼
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onView}
        disabled={!onView}
        className={cn(baseClass, hoverClass, active === "view" && activeClass)}
      >
        <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
        보기
      </Button>
    </div>
  );
}

