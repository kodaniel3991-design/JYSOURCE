"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value?: string; // YYYY-MM-DD
  onChange?: (e: { target: { value: string } }) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
function DateInput({ value = "", onChange, onKeyDown, className, disabled, readOnly, autoFocus, id }, ref) {
  const parts = value ? value.split("-") : ["", "", ""];
  const [year, setYear] = useState(parts[0] ?? "");
  const [month, setMonth] = useState(parts[1] ?? "");
  const [day, setDay] = useState(parts[2] ?? "");

  const yearRef  = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef   = useRef<HTMLInputElement>(null);
  // 자신이 마지막으로 emit한 값 — 외부 동기화 루프 방지
  const lastEmittedRef = useRef(value);

  // ref.focus() → 연도 input에 포커스
  useImperativeHandle(ref, () => ({
    ...({} as HTMLInputElement),
    focus: () => yearRef.current?.focus(),
  }));

  // 외부에서 value가 바뀐 경우에만 내부 상태 동기화 (자신이 emit한 값은 무시)
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const [ey = "", em = "", ed = ""] = value ? value.split("-") : [];
    setYear(ey);
    setMonth(em);
    setDay(ed);
  }, [value]);

  const emit = (y: string, m: string, d: string) => {
    if (!onChange) return;
    const val = y.length === 4 && m.length === 2 && d.length === 2
      ? `${y}-${m}-${d}`
      : "";
    lastEmittedRef.current = val;
    onChange({ target: { value: val } });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(v);
    emit(v, month, day);
    if (v.length === 4) { monthRef.current?.focus(); monthRef.current?.select(); }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v.length === 2) {
      const n = parseInt(v, 10);
      if (n < 1) v = "01";
      else if (n > 12) v = "12";
    }
    setMonth(v);
    emit(year, v, day);
    if (v.length === 2) { dayRef.current?.focus(); dayRef.current?.select(); }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v.length === 2) {
      const n = parseInt(v, 10);
      if (n < 1) v = "01";
      else if (n > 31) v = "31";
    }
    setDay(v);
    emit(year, month, v);
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && month === "") { yearRef.current?.focus(); yearRef.current?.select(); }
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && day === "") { monthRef.current?.focus(); monthRef.current?.select(); }
    else if (e.key === "Enter") onKeyDown?.(e);
  };

  return (
    <div
      className={cn(
        "flex h-8 items-center rounded-md border border-input bg-background px-2 text-xs",
        "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        ref={yearRef}
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={year}
        onChange={handleYearChange}
        onKeyDown={onKeyDown}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder="YYYY"
        className="w-10 bg-transparent text-center outline-none placeholder:text-muted-foreground/40"
      />
      <span className="mx-0.5 select-none text-muted-foreground">-</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={month}
        onChange={handleMonthChange}
        onKeyDown={handleMonthKeyDown}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        disabled={disabled}
        readOnly={readOnly}
        placeholder="MM"
        className="w-6 bg-transparent text-center outline-none placeholder:text-muted-foreground/40"
      />
      <span className="mx-0.5 select-none text-muted-foreground">-</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={day}
        onChange={handleDayChange}
        onKeyDown={handleDayKeyDown}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        disabled={disabled}
        readOnly={readOnly}
        placeholder="DD"
        className="w-6 bg-transparent text-center outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
});
DateInput.displayName = "DateInput";
