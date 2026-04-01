import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * 필드 에러 메시지 — LUON AI Design System `.error-msg` 기준
 * display:flex + icon + text, 12px, error color
 */
export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-[12px] font-medium text-destructive",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}
