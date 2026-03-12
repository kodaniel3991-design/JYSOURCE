"use client";

import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterField {
  type: "search" | "select" | "custom";
  placeholder?: string;
  options?: SelectOption[];
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterField[];
  onReset?: () => void;
  className?: string;
  children?: ReactNode;
}

export function FilterBar({
  searchPlaceholder = "검색...",
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  className,
  children,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4",
        className
      )}
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-9"
        />
      </div>
      {filters.map((filter, i) => (
        <div key={i} className="min-w-[140px]">
          {filter.type === "select" && filter.options && (
            <Select
              options={filter.options}
              placeholder={filter.placeholder}
              value={filter.value}
              onChange={filter.onChange}
              className="w-full"
            />
          )}
          {filter.type === "custom" && filter.children}
        </div>
      ))}
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          필터 초기화
        </Button>
      )}
      {children}
    </div>
  );
}
