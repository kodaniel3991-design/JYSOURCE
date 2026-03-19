 "use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrimaryActionButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        // 기본: 흰 배경 + 연한 테두리
        // 호버: 테마 primary 색상으로 채워짐 (이미지의 업로드 버튼 느낌)
        "border-slate-300 dark:border-slate-600 text-slate-800 hover:bg-primary hover:text-primary-foreground hover:border-primary",
        className
      )}
      {...props}
    />
  );
}

/**
 * 기본은 연한 테두리/흰 배경, 호버 시 약하게 강조.
 * 보조 버튼(예: 닫기, 취소, 양식 다운로드 등)에 사용.
 */
export function SecondaryActionButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "border-slate-300 dark:border-slate-600 text-slate-800 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
}

