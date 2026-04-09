"use client";

import { cn } from "@/lib/utils";

interface SortableThProps {
  /** 이 th가 담당하는 정렬 키 */
  sortKey: string;
  /** 현재 활성 정렬 키 */
  currentKey: string | null;
  /** 현재 정렬 방향 */
  sortDir: "asc" | "desc";
  /** 헤더 클릭 시 호출 */
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableTh({
  sortKey,
  currentKey,
  sortDir,
  onSort,
  children,
  className,
}: SortableThProps) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={cn("cursor-pointer select-none hover:bg-muted", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        {isActive ? (
          <span className="text-[10px] text-primary">{sortDir === "asc" ? "▲" : "▼"}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/30">⇅</span>
        )}
      </span>
    </th>
  );
}
