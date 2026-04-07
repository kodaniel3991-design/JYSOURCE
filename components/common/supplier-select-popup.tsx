"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { PurchaserRecord } from "@/types/purchaser";
import { apiPath } from "@/lib/api-path";

interface SupplierSelectPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (purchaserNo: string, purchaserName: string) => void;
  initialSearch?: string;
}

export function SupplierSelectPopup({
  open,
  onOpenChange,
  onSelect,
  initialSearch = "",
}: SupplierSelectPopupProps) {
  const [purchasers, setPurchasers] = useState<PurchaserRecord[]>([]);
  const [search, setSearch]         = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);

  // 구매처 목록 최초 1회 로드
  useEffect(() => {
    fetch(apiPath("/api/purchasers"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPurchasers(data.items.map((x: any) => ({
          id:                  String(x.Id),
          purchaserNo:         x.PurchaserNo   ?? "",
          purchaserName:       x.PurchaserName ?? "",
          phoneNo:             x.PhoneNo       ?? "",
          faxNo:               x.FaxNo         ?? "",
          contactPerson:       x.ContactPerson ?? "",
          contactDept:         x.ContactDept   ?? "",
          transactionType:     x.TransactionType ?? "",
          representativeName:  x.RepresentativeName ?? "",
          businessNo:          x.BusinessNo    ?? "",
          postalCode:          x.PostalCode    ?? "",
          address:             x.Address       ?? "",
          suspensionDate:      x.SuspensionDate ?? "",
          suspensionReason:    x.SuspensionReason ?? "",
          registrant:          x.Registrant    ?? "",
          modifier:            x.Modifier      ?? "",
        })));
      })
      .catch(() => {});
  }, []);

  // 팝업 열릴 때 초기값 세팅 + 포커스
  useEffect(() => {
    if (!open) return;
    setSearch(initialSearch);
    setHighlightIdx(-1);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [open, initialSearch]);

  useEffect(() => {
    highlightRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return purchasers;
    return purchasers.filter(
      (p) =>
        p.purchaserNo.toLowerCase().includes(kw) ||
        p.purchaserName.toLowerCase().includes(kw)
    );
  }, [search, purchasers]);

  const handleSelect = (p: PurchaserRecord) => {
    onSelect(p.purchaserNo, p.purchaserName);
    onOpenChange(false);
  };

  const handleClose = () => onOpenChange(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.stopPropagation(); handleClose(); }
      }}
    >
      <div className="w-96 rounded-lg bg-background p-4 shadow-xl border">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">구매처 선택</h3>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
            onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 검색 입력 */}
        <Input
          ref={searchInputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setHighlightIdx(-1); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIdx((p) => Math.min(p + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIdx((p) => Math.max(p - 1, -1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const target =
                highlightIdx >= 0
                  ? filtered[highlightIdx]
                  : filtered.length === 1
                  ? filtered[0]
                  : null;
              if (target) handleSelect(target);
            }
          }}
          placeholder="구매처번호 또는 구매처명"
          className="h-8 text-xs mb-2"
        />

        {/* 목록 */}
        <div className="h-[300px] rounded border overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 sticky top-0">
              <tr>
                <th className="px-3 py-1.5 text-left whitespace-nowrap w-28">구매처번호</th>
                <th className="px-3 py-1.5 text-left">구매처명</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                    조건에 맞는 구매처가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr
                    key={p.purchaserNo}
                    ref={idx === highlightIdx ? highlightRowRef : null}
                    className={`cursor-pointer border-t ${
                      idx === highlightIdx
                        ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelect(p)}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono">{p.purchaserNo}</td>
                    <td className="px-3 py-1.5">{p.purchaserName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 건수 */}
        <div className="mt-2 text-[11px] text-muted-foreground">
          <span className="font-semibold">{filtered.length.toLocaleString("ko-KR")}</span>건
        </div>
      </div>
    </div>
  );
}
