"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { SupplierSelectPopup } from "./supplier-select-popup";
import { apiPath } from "@/lib/api-path";

export type ItemModalItem = {
  itemCode: string;
  itemName: string;
  material: string;
  spec: string;
  model: string;
  unitPrice: number;
  supplierId: string;
};

interface ItemSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: ItemModalItem) => void;
  /** 구매처 단가 필터용 구매처명 (optional) */
  supplierName?: string;
  /** 팝업 열릴 때 검색창에 미리 채울 초기값 (optional) */
  initialSearch?: string;
}

export function ItemSelectModal({ open, onOpenChange, onSelect, supplierName, initialSearch = "" }: ItemSelectModalProps) {
  const [itemMaster,   setItemMaster]   = useState<ItemModalItem[]>([]);
  const [priceItemCodes, setPriceItemCodes] = useState<Set<string>>(new Set());

  const [itemSearch,            setItemSearch]            = useState("");
  const [itemFilterModel,       setItemFilterModel]       = useState("");
  const [itemFilterSupplierId,  setItemFilterSupplierId]  = useState("");
  const [itemFilterSupplierName,setItemFilterSupplierName]= useState("");
  const [onlyWithPrice,         setOnlyWithPrice]         = useState(false);
  const [itemHighlightIdx,      setItemHighlightIdx]      = useState(-1);

  const [isSupplierSubOpen, setIsSupplierSubOpen] = useState(false);
  const [isModelSubOpen,    setIsModelSubOpen]    = useState(false);
  const [modelSubSearch,    setModelSubSearch]    = useState("");
  const [modelSubIdx,       setModelSubIdx]       = useState(-1);

  const itemSearchRef  = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef  = useRef<HTMLInputElement>(null);
  const modelRowRef    = useRef<HTMLTableRowElement>(null);
  const listScrollRef  = useRef<HTMLDivElement>(null);

  // 품목 마스터 로드 (최초 1회)
  useEffect(() => {
    fetch(apiPath("/api/items"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItemMaster(data.items.map((x: any) => ({
          itemCode:   x.ItemNo ?? "",
          itemName:   x.ItemName ?? "",
          material:   x.Material ?? "",
          spec:       x.Specification ?? "",
          model:      x.VehicleModel ?? "",
          unitPrice:  Number(x.PurchaseUnitPrice ?? 0),
          supplierId: x.SupplierCode ?? "",
        })));
      })
      .catch(() => {});
  }, []);

  // 팝업 열릴 때 초기화 + 포커스
  useEffect(() => {
    if (!open) return;
    setItemSearch(initialSearch); setItemFilterModel(""); setItemFilterSupplierId(""); setItemFilterSupplierName("");
    setOnlyWithPrice(false); setItemHighlightIdx(-1);
    setIsSupplierSubOpen(false); setIsModelSubOpen(false);
    setTimeout(() => itemSearchRef.current?.focus(), 50);
  }, [open, initialSearch]);

  // 구매처 단가 필터 로드
  useEffect(() => {
    if (!open) return;
    fetch(apiPath("/api/purchase-prices"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const name = (supplierName ?? "").trim().toLowerCase();
        const codes = new Set<string>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.items as any[])
            .filter((p) => (p.supplierName ?? "").trim().toLowerCase() === name)
            .map((p) => String(p.itemCode))
        );
        setPriceItemCodes(codes);
      })
      .catch(() => {});
  }, [open, supplierName]);

  const distinctModels = useMemo(() => {
    const s = new Set<string>();
    itemMaster.forEach((i) => { if (i.model) s.add(i.model.toUpperCase()); });
    return Array.from(s).sort();
  }, [itemMaster]);

  const filteredModels = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return distinctModels;
    return distinctModels.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, distinctModels]);

  const filteredItems = useMemo(() => {
    const kw  = itemSearch.trim().toLowerCase();
    const mkw = itemFilterModel.trim().toLowerCase();
    const skw = itemFilterSupplierId.trim().toLowerCase();
    return itemMaster.filter((i) => {
      if (onlyWithPrice && !priceItemCodes.has(i.itemCode)) return false;
      if (kw  && !i.itemCode.toLowerCase().includes(kw)  && !i.itemName.toLowerCase().includes(kw))  return false;
      if (mkw && !(i.model ?? "").toLowerCase().includes(mkw)) return false;
      if (skw && !i.supplierId.toLowerCase().includes(skw)) return false;
      return true;
    });
  }, [itemSearch, itemFilterModel, itemFilterSupplierId, onlyWithPrice, priceItemCodes, itemMaster]);

  useEffect(() => { setItemHighlightIdx(-1); }, [filteredItems]);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => listScrollRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  useEffect(() => {
    if (itemHighlightIdx >= 0) virtualizer.scrollToIndex(itemHighlightIdx, { align: "auto" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemHighlightIdx]);

  useEffect(() => { modelRowRef.current?.scrollIntoView({ block: "nearest" }); }, [modelSubIdx]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSelect = (item: ItemModalItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  const arrowNav = (
    e: React.KeyboardEvent,
    setter: (fn: (p: number) => number) => void,
    max: number
  ) => {
    if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setter((p) => Math.min(p + 1, max - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setter((p) => Math.max(p - 1, -1)); }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onKeyDown={(e) => { if (e.key === "Escape") handleClose(); }}
    >
      <div className="relative w-full max-w-3xl rounded-lg bg-background p-4 shadow-lg">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">품목 선택</h2>
          <Button type="button" variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 검색 조건 */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          {/* 품목번호/명 */}
          <Input
            ref={itemSearchRef}
            value={itemSearch}
            onChange={(e) => { setItemSearch(e.target.value); setItemHighlightIdx(-1); }}
            onKeyDown={(e) => {
              arrowNav(e, setItemHighlightIdx, filteredItems.length);
              if (e.key === "Enter") {
                e.preventDefault(); e.stopPropagation();
                const target = itemHighlightIdx >= 0 ? filteredItems[itemHighlightIdx]
                  : filteredItems.length === 1 ? filteredItems[0] : null;
                if (target) handleSelect(target);
                else supplierInputRef.current?.focus();
              }
            }}
            placeholder="품목번호 또는 품목명"
            className="h-8 text-xs w-44"
          />

          {/* 거래처 검색 */}
          <div className="flex gap-1 items-center">
            <Input
              ref={supplierInputRef}
              value={itemFilterSupplierId}
              placeholder="거래처코드"
              className="h-8 text-xs w-24"
              onKeyDown={(e) => {
                arrowNav(e, setItemHighlightIdx, filteredItems.length);
                if (e.key === "Enter") {
                  e.preventDefault(); e.stopPropagation();
                  if (itemHighlightIdx >= 0) {
                    const t = filteredItems[itemHighlightIdx];
                    if (t) handleSelect(t);
                  } else if (!itemFilterSupplierId.trim() || itemFilterSupplierName) {
                    // 비어있거나 이미 매칭됐으면 모델로 패스
                    modelInputRef.current?.focus();
                  } else {
                    // 값은 있지만 아직 매칭 안 됐으면 팝업
                    setIsSupplierSubOpen(true);
                  }
                }
              }}
              onChange={(e) => {
                setItemFilterSupplierId(e.target.value);
                setItemFilterSupplierName("");
              }}
            />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => setIsSupplierSubOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <Input value={itemFilterSupplierName} readOnly placeholder="거래처명"
              className="h-8 text-xs w-28 bg-muted text-muted-foreground" />
          </div>

          {/* 모델 검색 */}
          <div className="flex gap-1 items-center">
            <Input
              ref={modelInputRef}
              value={itemFilterModel}
              placeholder="모델"
              className="h-8 text-xs w-28"
              onChange={(e) => setItemFilterModel(e.target.value)}
              onKeyDown={(e) => {
                arrowNav(e, setItemHighlightIdx, filteredItems.length);
                if (e.key === "Enter") {
                  e.preventDefault(); e.stopPropagation();
                  if (itemHighlightIdx >= 0) {
                    const t = filteredItems[itemHighlightIdx];
                    if (t) handleSelect(t);
                  } else if (!itemFilterModel.trim()) {
                    // 비어있으면 품목검색으로 패스
                    itemSearchRef.current?.focus();
                  } else {
                    // 값 있으면 팝업
                    setModelSubSearch(itemFilterModel);
                    setIsModelSubOpen(true);
                  }
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => { setModelSubSearch(itemFilterModel); setIsModelSubOpen(true); }}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button type="button" variant="outline" size="sm"
            onClick={() => { setItemSearch(""); setItemFilterModel(""); setItemFilterSupplierId(""); setItemFilterSupplierName(""); }}>
            초기화
          </Button>
        </div>

        {/* 단가 필터 라디오 */}
        <div className="mb-3 flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="itemPriceFilter" checked={!onlyWithPrice}
              onChange={() => setOnlyWithPrice(false)} className="accent-primary" />
            전체
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="itemPriceFilter" checked={onlyWithPrice}
              onChange={() => setOnlyWithPrice(true)} className="accent-primary" />
            구매처 단가 등록 품목만
          </label>
        </div>

        {/* 품목 목록 (가상 스크롤) */}
        <div ref={listScrollRef} className="h-[380px] rounded-md border overflow-y-auto">
          <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "8rem" }} />
              <col />
              <col style={{ width: "7rem" }} />
              <col style={{ width: "6rem" }} />
            </colgroup>
            <thead className="bg-muted/60 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left whitespace-nowrap">품목번호</th>
                <th className="px-3 py-2 text-left">품목명</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">모델</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">기준단가</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 품목이 없습니다.</td></tr>
              ) : (() => {
                const vitems = virtualizer.getVirtualItems();
                const totalSize = virtualizer.getTotalSize();
                const paddingTop    = vitems.length > 0 ? vitems[0].start : 0;
                const paddingBottom = vitems.length > 0 ? totalSize - vitems[vitems.length - 1].end : 0;
                return (
                  <>
                    {paddingTop > 0 && <tr style={{ height: paddingTop }}><td colSpan={4} /></tr>}
                    {vitems.map((vRow) => {
                      const i = filteredItems[vRow.index];
                      return (
                        <tr
                          key={i.itemCode}
                          className={`cursor-pointer border-t ${vRow.index === itemHighlightIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground" : "hover:bg-muted"}`}
                          onClick={() => handleSelect(i)}
                        >
                          <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.itemCode}</td>
                          <td className="px-3 py-1.5 overflow-hidden text-ellipsis">{i.itemName}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.model || "-"}</td>
                          <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatCurrency(i.unitPrice)}</td>
                        </tr>
                      );
                    })}
                    {paddingBottom > 0 && <tr style={{ height: paddingBottom }}><td colSpan={4} /></tr>}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          총 <span className="font-semibold">{filteredItems.length.toLocaleString("ko-KR")}</span>건
        </div>

        <SupplierSelectPopup
          open={isSupplierSubOpen}
          onOpenChange={setIsSupplierSubOpen}
          initialSearch={itemFilterSupplierId}
          onSelect={(no, name) => {
            setItemFilterSupplierId(no);
            setItemFilterSupplierName(name);
            setTimeout(() => supplierInputRef.current?.focus(), 0);
          }}
        />

        {/* 모델 서브팝업 */}
        {isModelSubOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-lg"
            onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setIsModelSubOpen(false); } }}>
            <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">모델 선택</h3>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => setIsModelSubOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={modelSubSearch}
                onChange={(e) => { setModelSubSearch(e.target.value); setModelSubIdx(-1); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setModelSubIdx((p) => Math.min(p + 1, filteredModels.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setModelSubIdx((p) => Math.max(p - 1, -1)); }
                  else if (e.key === "Enter") {
                    e.preventDefault();
                    const t = modelSubIdx >= 0 ? filteredModels[modelSubIdx]
                      : filteredModels.length === 1 ? filteredModels[0] : null;
                    if (t) { setItemFilterModel(t); setIsModelSubOpen(false); setModelSubIdx(-1); }
                  }
                }}
                placeholder="모델명 검색"
                className="h-8 text-xs mb-2"
                autoFocus
              />
              <div className="h-[260px] rounded border overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr><th className="px-3 py-1.5 text-left">모델</th></tr>
                  </thead>
                  <tbody>
                    {filteredModels.length === 0 ? (
                      <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                    ) : filteredModels.map((m, idx) => (
                      <tr
                        key={m}
                        ref={idx === modelSubIdx ? modelRowRef : null}
                        className={`cursor-pointer border-t ${idx === modelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground" : "hover:bg-muted"}`}
                        onClick={() => { setItemFilterModel(m); setIsModelSubOpen(false); setModelSubIdx(-1); }}
                      >
                        <td className="px-3 py-1.5">{m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
