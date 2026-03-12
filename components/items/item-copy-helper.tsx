"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import type { ItemRegisterBasicInfo } from "@/types/item-register";

interface ItemCopyHelperProps {
  copyFromItemNo: string;
  onCopyFromChange: (v: string) => void;
  onCopy: () => void;
  disabled?: boolean;
}

export function ItemCopyHelper({
  copyFromItemNo,
  onCopyFromChange,
  onCopy,
  disabled,
}: ItemCopyHelperProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[200px] flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">
          복사할 품목번호 (선택)
        </Label>
        <Input
          placeholder="기존 품목번호 입력 후 복사"
          value={copyFromItemNo}
          onChange={(e) => onCopyFromChange(e.target.value)}
          className="h-9"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={disabled}
      >
        <Copy className="mr-1.5 h-4 w-4" />
        복사
      </Button>
    </div>
  );
}
