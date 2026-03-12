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
  const activeClass =
    "bg-slate-900 text-white hover:bg-slate-800 hover:text-white";
  const hoverClass =
    "hover:bg-slate-200 hover:text-slate-900 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900";

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className ?? ""}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
        disabled={!onExport}
        className={cn(hoverClass, active === "export" && activeClass)}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        내보내기
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSort}
        disabled={!onSort}
        className={cn(hoverClass, active === "sort" && activeClass)}
      >
        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
        정렬
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onColumns}
        disabled={!onColumns}
        className={cn(hoverClass, active === "columns" && activeClass)}
      >
        <Columns3 className="mr-1.5 h-3.5 w-3.5" />
        컬럼
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        disabled={!onView}
        className={cn(hoverClass, active === "view" && activeClass)}
      >
        <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
        보기
      </Button>
    </div>
  );
}

