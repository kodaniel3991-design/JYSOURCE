"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchPopupColumn<T> {
  key: keyof T;
  header: string;
  width?: number;
}

interface SearchPopupProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  columns: SearchPopupColumn<T>[];
  /** API URL 또는 초기 데이터 */
  apiUrl?: string;
  data?: T[];
  searchKeys: (keyof T)[];
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string;
  /** 팝업 열릴 때 첫 번째 검색필드 초기값 */
  initialSearchCode?: string;
}

export function SearchPopup<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  columns,
  apiUrl,
  data: externalData,
  searchKeys,
  onSelect,
  keyExtractor,
  initialSearchCode,
}: SearchPopupProps<T>) {
  const [allItems, setAllItems] = useState<T[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSearchCode(initialSearchCode ?? "");
    setSearchName("");
    setSelectedKey(null);
    setTimeout(() => codeInputRef.current?.focus(), 100);

    if (externalData) {
      setAllItems(externalData);
      return;
    }
    if (!apiUrl) return;

    setLoading(true);
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) setAllItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, apiUrl, externalData, initialSearchCode]);

  const filtered = allItems.filter((item) => {
    const codeKey = searchKeys[0];
    const nameKey = searchKeys[1] ?? searchKeys[0];
    const codeVal = String(item[codeKey] ?? "").toLowerCase();
    const nameVal = String(item[nameKey] ?? "").toLowerCase();
    if (searchCode && !codeVal.includes(searchCode.toLowerCase())) return false;
    if (searchName && !nameVal.includes(searchName.toLowerCase())) return false;
    return true;
  });

  const handleSelect = (item: T) => {
    onSelect(item);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (filtered.length === 1) handleSelect(filtered[0]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} position="center">
      <SheetContent className="sm:max-w-lg sm:h-[80vh] overflow-hidden flex flex-col p-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              setSearchCode("");
              setSearchName("");
            }}>
              초기화
            </Button>
            <Button size="sm" onClick={() => {
              if (filtered.length === 1) handleSelect(filtered[0]);
            }}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              조회
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              닫기
            </Button>
          </div>
        </div>

        {/* 검색 조건 */}
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{columns[0]?.header}</label>
              <Input
                ref={codeInputRef}
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-xs"
                placeholder={columns[0]?.header}
              />
            </div>
            {columns[1] && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{columns[1].header}</label>
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs"
                  placeholder={columns[1].header}
                />
              </div>
            )}
          </div>
        </div>

        {/* 결과 테이블 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    조회 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const key = keyExtractor(item);
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "cursor-pointer border-b hover:bg-muted",
                        selectedKey === key && "bg-sky-100 dark:bg-sky-500/20 dark:text-foreground ring-1 ring-inset ring-sky-300 dark:ring-sky-500/40"
                      )}
                      onClick={() => setSelectedKey(key)}
                      onDoubleClick={() => handleSelect(item)}
                    >
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-3 py-1.5 whitespace-nowrap">
                          {String(item[col.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 건수 */}
        <div className="shrink-0 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span className="font-semibold">{filtered.length.toLocaleString("ko-KR")}</span>건의 자료가 검색되었습니다.
        </div>
      </SheetContent>
    </Sheet>
  );
}
