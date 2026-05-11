"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GridThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** 이 컬럼의 고유 키 */
  colKey: string;
  /** true이면 드래그 비활성화 (rowSpan 컬럼, 체크박스 등) */
  locked?: boolean;
  /** 현재 드래그 중인 컬럼 키 (외부에서 관리) */
  dragKey?: string | null;
  /** 현재 드롭 타겟 컬럼 키 (외부에서 관리) */
  dropTargetKey?: string | null;
  /** 리사이즈 완료 시 호출 */
  onResizeEnd?: (key: string, width: number) => void;
  /** 드래그 시작 시 호출 */
  onDragStartKey?: (key: string) => void;
  /** 드롭 시 호출 */
  onDropKey?: (fromKey: string, toKey: string) => void;
  /** 드래그 종료 시 호출 */
  onDragEndKey?: () => void;
  /** 드래그 오버 컬럼 키 변경 시 호출 */
  onDragOverKey?: (key: string | null) => void;

  // SortableTh 기능 (선택적)
  sortKey?: string;
  currentSortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;

  children: React.ReactNode;
}

export function GridTh({
  colKey,
  locked = false,
  dragKey,
  dropTargetKey,
  onResizeEnd,
  onDragStartKey,
  onDropKey,
  onDragEndKey,
  onDragOverKey,
  sortKey,
  currentSortKey,
  sortDir,
  onSort,
  children,
  className,
  style,
  onClick,
  ...rest
}: GridThProps) {
  const isActiveDrop = dropTargetKey === colKey && dragKey !== colKey;
  const isDragging = dragKey === colKey;
  const isSorted = sortKey != null && currentSortKey === sortKey;

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest("th") as HTMLTableCellElement;
    const startWidth = th.offsetWidth;
    const startX = e.clientX;

    // drag 중에는 colgroup col을 직접 조작 (React 리렌더 없이 smooth)
    const table = th.closest("table");
    const colIndex = th.cellIndex;

    const onMouseMove = (me: MouseEvent) => {
      const newWidth = Math.max(40, startWidth + (me.clientX - startX));
      if (table) {
        const col = table.querySelectorAll("colgroup col")[colIndex] as HTMLElement | undefined;
        if (col) col.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = (me: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const newWidth = Math.max(40, startWidth + (me.clientX - startX));
      onResizeEnd?.(colKey, newWidth);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (sortKey && onSort) onSort(sortKey);
    onClick?.(e);
  };

  return (
    <th
      {...rest}
      draggable={!locked}
      className={cn(
        "relative select-none",
        !locked && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isActiveDrop && "bg-primary/15 outline outline-2 outline-offset-[-2px] outline-primary/50",
        sortKey && onSort && "hover:bg-muted/60",
        className
      )}
      style={style}
      onClick={handleClick}
      onDragStart={
        !locked
          ? (e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", colKey);
              onDragStartKey?.(colKey);
            }
          : undefined
      }
      onDragOver={
        !locked
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dropTargetKey !== colKey) onDragOverKey?.(colKey);
            }
          : undefined
      }
      onDragLeave={
        !locked
          ? (e) => {
              // 자식 요소로 이동할 때는 무시
              if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
              onDragOverKey?.(null);
            }
          : undefined
      }
      onDrop={
        !locked
          ? (e) => {
              e.preventDefault();
              const fromKey = e.dataTransfer.getData("text/plain");
              onDragOverKey?.(null);
              if (fromKey && fromKey !== colKey) onDropKey?.(fromKey, colKey);
            }
          : undefined
      }
      onDragEnd={
        !locked
          ? () => {
              onDragEndKey?.();
              onDragOverKey?.(null);
            }
          : undefined
      }
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        {sortKey && onSort && (
          isSorted ? (
            <span className="text-[10px] text-primary">{sortDir === "asc" ? "▲" : "▼"}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground/30">⇅</span>
          )
        )}
      </span>
      {/* 리사이즈 핸들 */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 z-10"
        onMouseDown={handleResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </th>
  );
}
