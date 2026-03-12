"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Save, X } from "lucide-react";

interface ItemRegisterHeaderProps {
  onReset: () => void;
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function ItemRegisterHeader({
  onReset,
  onSave,
  onSaveAndAddAnother,
  onClose,
  title = "품목 신규 등록",
  description = "구매·재고·제조 운영에 사용할 품목 마스터를 생성하고 관리합니다.",
}: ItemRegisterHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            초기화
          </Button>
          {onSaveAndAddAnother && (
            <Button variant="outline" size="sm" onClick={onSaveAndAddAnother}>
              저장 후 추가
            </Button>
          )}
          <Button size="sm" onClick={onSave}>
            <Save className="mr-1.5 h-4 w-4" />
            저장
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" />
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
