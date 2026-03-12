"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  /** 총 건수 표시 (옵션) */
  totalCountLabel?: string;
  /** 카드 외부에서 gap 등을 조절할 수 있도록 className 허용 */
  className?: string;
};

export function SearchPanel({
  title = "검색 조건",
  description,
  children,
  onSearch,
  onReset,
  totalCountLabel,
  className,
}: SearchPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {children}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {onSearch && (
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={onSearch}
            >
              검색
            </Button>
          )}
          {onReset && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={onReset}
            >
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
    </Card>
  );
}

