"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  displayLabel?: string; // 선택 후 표시 텍스트 (드롭다운과 다르게 표시할 때)
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, onChange, ...props }, ref) => {
    const hasDisplayLabel = options.some((o) => o.displayLabel !== undefined);

    if (hasDisplayLabel) {
      const selectedOption = options.find((o) => o.value === props.value);
      const displayText = selectedOption
        ? (selectedOption.displayLabel ?? selectedOption.label)
        : placeholder ?? "";

      return (
        <div className="relative">
          {/* 선택값 표시 레이어 */}
          <div
            className={cn(
              "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 pr-8 text-xs pointer-events-none truncate",
              !selectedOption && "text-muted-foreground",
              className
            )}
          >
            {displayText}
          </div>
          {/* 투명 select — 클릭·드롭다운 담당 */}
          <select
            ref={ref}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {/* value=""일 때 첫 번째 옵션이 기본 선택되는 브라우저 동작 방지 */}
            <option value="" disabled hidden>{placeholder ?? ""}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
      );
    }

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
