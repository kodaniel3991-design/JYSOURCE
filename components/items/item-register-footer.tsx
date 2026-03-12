"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Save, X } from "lucide-react";

interface ItemRegisterFooterProps {
  onReset: () => void;
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
  onClose: () => void;
}

export function ItemRegisterFooter({
  onReset,
  onSave,
  onSaveAndAddAnother,
  onClose,
}: ItemRegisterFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
  );
}
