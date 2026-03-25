"use client";

import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

type SearchPanelProps = {
  /** 카드 제목 (기본: 검색 조건) */
  title?: string;
  /** 부가 설명 텍스트 */
  description?: ReactNode;
  /** 검색 필드 영역 (grid 등 자유롭게 배치) */
  children: ReactNode;
  /** 검색 버튼 클릭 핸들러 */
  onSearch?: () => void;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onReset?: () => void;
  /** 검색 중 로딩 상태 */
  loading?: boolean;
  /** 총 건수 표시 (옵션) */
  totalCountLabel?: string;
  /** 카드 외부에서 gap 등을 조절할 수 있도록 className 허용 */
  className?: string;
  /** 초기 접힘 상태 (기본: false = 펼쳐짐) */
  defaultCollapsed?: boolean;
  /** 접힘 상태 변경 콜백 */
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function SearchPanel({
  title = "검색 조건",
  description,
  children,
  onSearch,
  onReset,
  loading = false,
  totalCountLabel,
  className,
  defaultCollapsed = false,
  onCollapsedChange,
}: SearchPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      onCollapsedChange?.(next);
      return next;
    });
  };

  return (
    <Card className={className}>
      <CardHeader
        className="cursor-pointer select-none pb-2"
        onClick={toggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {!collapsed && description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4 text-xs">
          {children}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {onSearch && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); onSearch(); }}
              >
                <Search className="mr-1.5 h-4 w-4" />
                {loading ? "조회 중..." : "검색"}
              </Button>
            )}
            {onReset && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={(e) => { e.stopPropagation(); onReset(); }}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                필터 초기화
              </Button>
            )}
            {totalCountLabel && (
              <p className="text-[11px] text-muted-foreground">
                {totalCountLabel}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

