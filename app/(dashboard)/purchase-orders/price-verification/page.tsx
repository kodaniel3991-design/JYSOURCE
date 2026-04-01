"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { Search, RotateCcw, X, RefreshCw } from "lucide-react";

interface PriceVerificationItem {
  poId:             number;
  poNumber:         string;
  orderDate:        string;
  supplierCode:     string;
  supplierName:     string;
  specNo:           number;
  itemCode:         string;
  itemName:         string;
  vehicleModel:     string;
  quantity:         number;
  poUnitPrice:      number;
  currentUnitPrice: number | null;
  priceApplyDate:   string | null;
  diff:             number | null;
  diffRate:         number | null;
  amountDiff:       number | null;
  status:           "단가상승" | "단가하락";
}

const today = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const FIRST_OF_MONTH = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
const TODAY_STR      = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

export default function PriceVerificationPage() {
  // ── 검색 조건 ────────────────────────────────────────────────────────────────
  const [dateFrom,      setDateFrom]      = useState(FIRST_OF_MONTH);
  const [dateTo,        setDateTo]        = useState(TODAY_STR);
  const [itemCode,      setItemCode]      = useState("");
  const [itemName,      setItemName]      = useState("");
  const [supplierCode,  setSupplierCode]  = useState("");
  const [supplierName,  setSupplierName]  = useState("");
  const [model,         setModel]         = useState("");

  // ── 모달/팝업 ────────────────────────────────────────────────────────────────
  const [isItemModalOpen,     setIsItemModalOpen]     = useState(false);
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isModelPopupOpen,    setIsModelPopupOpen]    = useState(false);
  const [modelList,           setModelList]           = useState<string[]>([]);
  const [modelSubSearch,      setModelSubSearch]      = useState("");
  const [modelSubIdx,         setModelSubIdx]         = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);

  // ── 결과 ────────────────────────────────────────────────────────────────────
  const [items,    setItems]    = useState<PriceVerificationItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── 멀티셀렉트 ───────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const rowKey = (item: PriceVerificationItem) => `${item.poId}-${item.specNo}`;

  const allKeys = useMemo(() => items.map(rowKey), [items]);
  const isAllSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const isIndeterminate = !isAllSelected && allKeys.some((k) => selected.has(k));

  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(allKeys));
  };
  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApply = async () => {
    const selectedItems = items.filter((it) => selected.has(rowKey(it)) && it.currentUnitPrice != null);
    if (!selectedItems.length) { alert("적용할 항목을 선택하세요."); return; }

    const confirmed = window.confirm(
      `선택한 ${selectedItems.length}건의 발주단가를 최신단가로 변경하시겠습니까?\n\n이 작업은 구매오더 명세의 단가를 직접 수정합니다.`
    );
    if (!confirmed) return;

    setApplying(true);
    try {
      const res = await fetch("/api/purchase-orders/price-verification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((it) => ({
            poId:         it.poId,
            specNo:       it.specNo,
            newUnitPrice: it.currentUnitPrice!,
            quantity:     it.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!data.ok) { alert(data.message ?? "적용 실패"); return; }
      alert(`${data.count}건의 발주단가가 최신단가로 변경되었습니다.`);
      setSelected(new Set());
      handleSearch();
    } catch {
      alert("단가 적용 중 오류가 발생했습니다.");
    } finally {
      setApplying(false);
    }
  };

  // ── Enter 네비게이션 refs ────────────────────────────────────────────────────
  const refDateFrom     = useRef<HTMLInputElement>(null);
  const refDateTo       = useRef<HTMLInputElement>(null);
  const refItemCode     = useRef<HTMLInputElement>(null);
  const refSupplierCode = useRef<HTMLInputElement>(null);
  const refModel        = useRef<HTMLInputElement>(null);
  const refSearchBtn    = useRef<HTMLButtonElement>(null);

  // 모델 목록 로드 (최초 1회)
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const s = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.items.forEach((x: any) => { if (x.VehicleModel) s.add(x.VehicleModel); });
        setModelList(Array.from(s).sort());
      })
      .catch(() => {});
  }, []);

  useEffect(() => { modelSubRowRef.current?.scrollIntoView({ block: "nearest" }); }, [modelSubIdx]);

  const filteredModelList = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, modelList]);

  // ── 검색 ────────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!dateFrom || !dateTo) { setError("발주일 범위를 입력하세요."); return; }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo });
    if (supplierCode.trim()) params.set("supplierCode", supplierCode.trim());
    if (supplierName.trim()) params.set("supplierName", supplierName.trim());
    if (itemCode.trim())     params.set("itemCode",     itemCode.trim());
    if (model.trim())        params.set("model",        model.trim());

    setSelected(new Set());
    fetch(`/api/purchase-orders/price-verification?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items ?? []);
        else setError(data.message ?? "조회 실패");
      })
      .catch(() => setError("조회 중 오류가 발생했습니다."))
      .finally(() => { setLoading(false); setSearched(true); });
  };

  const handleReset = () => {
    setDateFrom(FIRST_OF_MONTH); setDateTo(TODAY_STR);
    setItemCode(""); setItemName("");
    setSupplierCode(""); setSupplierName("");
    setModel("");
    setItems([]); setSearched(false); setError(null);
  };

  const fmt = (n: number) => n.toLocaleString("ko-KR");

  const summary = useMemo(() => ({
    total:    items.length,
    up:       items.filter((i) => i.status === "단가상승").length,
    down:     items.filter((i) => i.status === "단가하락").length,
    totalAmountDiff: items.reduce((s, i) => s + (i.amountDiff ?? 0), 0),
  }), [items]);

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      <PageHeader
        title="단가변경 교차검증"
        description="구매오더에 등록된 단가와 구매단가 관리의 최신 단가를 비교하여 불일치 내역을 확인합니다."
      />

      {/* ── 검색 패널 ─────────────────────────────────────────────────────── */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          {/* 조건 행 */}
          <div className="flex items-end gap-3 mb-3">

            {/* 발주일자 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">발주일자</label>
              <div className="flex gap-1 items-center">
                <Input
                  ref={refDateFrom}
                  type="date" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refDateTo.current?.focus(); } }}
                  className="h-7 text-xs w-[130px]"
                />
                <span className="text-xs text-muted-foreground shrink-0">~</span>
                <Input
                  ref={refDateTo}
                  type="date" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refItemCode.current?.focus(); } }}
                  className="h-7 text-xs w-[130px]"
                />
              </div>
            </div>

            {/* 품목번호 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">품목번호</label>
              <div className="flex gap-1">
                <Input
                  ref={refItemCode}
                  value={itemCode}
                  onChange={(e) => { setItemCode(e.target.value); setItemName(""); }}
                  placeholder="품목번호"
                  className="h-7 text-xs w-40"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setIsItemModalOpen(true); } }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-7 w-7 shrink-0" onClick={() => setIsItemModalOpen(true)}>
                  <Search className="h-3 w-3" />
                </Button>
                <Input value={itemName} readOnly placeholder="품목명"
                  className="h-7 text-xs w-48 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 구매처 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">구매처</label>
              <div className="flex gap-1">
                <Input
                  ref={refSupplierCode}
                  value={supplierCode}
                  onChange={(e) => { setSupplierCode(e.target.value); setSupplierName(""); }}
                  placeholder="코드"
                  className="h-7 text-xs w-40"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setIsSupplierPopupOpen(true); } }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-7 w-7 shrink-0" onClick={() => setIsSupplierPopupOpen(true)}>
                  <Search className="h-3 w-3" />
                </Button>
                <Input value={supplierName} readOnly placeholder="구매처명"
                  className="h-7 text-xs w-48 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 모델 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">모델</label>
              <div className="flex gap-1">
                <Input
                  ref={refModel}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="모델"
                  className="h-7 text-xs w-40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setModelSubSearch(model); setModelSubIdx(-1); setIsModelPopupOpen(true);
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => { setModelSubSearch(model); setModelSubIdx(-1); setIsModelPopupOpen(true); }}>
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>

          </div>

          {/* 버튼 행 */}
          <div className="flex items-center gap-2 pt-2.5 border-t">
            <Button
              ref={refSearchBtn}
              type="button" size="sm"
              onClick={handleSearch} disabled={loading}
              className="h-8 px-4"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              검색
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleReset} className="h-8 px-3">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              필터 초기화
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              총{" "}
              <span className="font-semibold text-foreground">
                {searched ? items.length.toLocaleString("ko-KR") : 0}
              </span>
              건이 조회되었습니다.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── 요약 카드 ─────────────────────────────────────────────────────── */}
      {searched && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">불일치 건수</p>
            <p className="text-2xl font-bold mt-0.5">{fmt(summary.total)}<span className="text-sm font-normal text-muted-foreground ml-1">건</span></p>
          </div>
          <div className="rounded-lg border bg-red-50 dark:bg-red-500/10 px-4 py-3">
            <p className="text-xs text-red-600 dark:text-red-400">단가 상승</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{fmt(summary.up)}<span className="text-sm font-normal ml-1">건</span></p>
          </div>
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-500/10 px-4 py-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">단가 하락</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{fmt(summary.down)}<span className="text-sm font-normal ml-1">건</span></p>
          </div>
        </div>
      )}

      {/* ── 데이터 그리드 ────────────────────────────────────────────────── */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* 그리드 툴바 */}
        {items.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{selected.size}</span>건 선택됨
            </span>
            <Button
              type="button" size="sm" variant="default"
              disabled={selected.size === 0 || applying}
              onClick={handleApply}
              className="h-7 px-3 text-xs ml-1"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              {applying ? "적용 중..." : "최신단가로 발주단가 변경"}
            </Button>
            <Button
              type="button" size="sm" variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0}
            >
              선택 해제
            </Button>
          </div>
        )}

        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 border-b z-10">
                <tr>
                  <th className="px-2 py-2 text-center w-8 shrink-0">
                    {items.length > 0 && (
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className="px-2 py-2 text-center w-8 shrink-0">No.</th>
                  <th className="px-2 py-2 text-left w-32">구매오더번호</th>
                  <th className="px-2 py-2 text-center w-24">발주일자</th>
                  <th className="px-2 py-2 text-left w-24">구매처코드</th>
                  <th className="px-2 py-2 text-left w-36">구매처명</th>
                  <th className="px-2 py-2 text-left w-28">품목번호</th>
                  <th className="px-2 py-2 text-left">품목명</th>
                  <th className="px-2 py-2 text-left w-28">모델</th>
                  <th className="px-2 py-2 text-right w-16">발주수량</th>
                  <th className="px-2 py-2 text-right w-24">발주단가</th>
                  <th className="px-2 py-2 text-right w-24">최신단가</th>
                  <th className="px-2 py-2 text-center w-24">단가적용일</th>
                  <th className="px-2 py-2 text-right w-20">단가차이</th>
                  <th className="px-2 py-2 text-right w-16">차이율</th>
                  <th className="px-2 py-2 text-right w-28">금액차이</th>
                  <th className="px-2 py-2 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={17} className="py-12 text-center text-muted-foreground">조회 중...</td></tr>
                ) : error ? (
                  <tr><td colSpan={17} className="py-12 text-center text-destructive text-xs">{error}</td></tr>
                ) : !searched ? (
                  <tr><td colSpan={17} className="py-12 text-center text-muted-foreground text-xs">발주일 범위를 입력하고 검색 버튼을 누르세요.</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={17} className="py-12 text-center text-muted-foreground text-xs">단가 불일치 내역이 없습니다.</td></tr>
                ) : (
                  items.map((item, i) => {
                    const key = rowKey(item);
                    const isChecked = selected.has(key);
                    const rowBg = isChecked
                      ? "bg-primary/5"
                      : item.status === "단가상승" ? "bg-red-50/40 dark:bg-red-500/10"
                      : "bg-blue-50/30 dark:bg-blue-500/10";
                    const diffColor =
                      item.diff == null ? ""
                      : item.diff > 0  ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400";

                    return (
                      <tr
                        key={key}
                        className={`border-b last:border-0 cursor-pointer ${rowBg}`}
                        onClick={() => toggleOne(key)}
                      >
                        <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(key)}
                            className="h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-1 text-center text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1 font-mono text-[11px] text-primary">{item.poNumber}</td>
                        <td className="px-2 py-1 text-center tabular-nums">{item.orderDate}</td>
                        <td className="px-2 py-1 font-mono text-[11px]">{item.supplierCode}</td>
                        <td className="px-2 py-1">{item.supplierName}</td>
                        <td className="px-2 py-1 font-mono text-[11px]">{item.itemCode}</td>
                        <td className="px-2 py-1">{item.itemName}</td>
                        <td className="px-2 py-1 text-[11px]">{item.vehicleModel}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{fmt(item.quantity)}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-medium">{fmt(item.poUnitPrice)}</td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {item.currentUnitPrice != null ? fmt(item.currentUnitPrice) : "-"}
                        </td>
                        <td className="px-2 py-1 text-center tabular-nums text-muted-foreground text-[11px]">
                          {item.priceApplyDate ?? "-"}
                        </td>
                        <td className={`px-2 py-1 text-right tabular-nums font-semibold ${diffColor}`}>
                          {item.diff != null ? (item.diff > 0 ? "+" : "") + fmt(item.diff) : "-"}
                        </td>
                        <td className={`px-2 py-1 text-right tabular-nums ${diffColor}`}>
                          {item.diffRate != null
                            ? (item.diffRate > 0 ? "+" : "") + item.diffRate.toFixed(1) + "%"
                            : "-"}
                        </td>
                        <td className={`px-2 py-1 text-right tabular-nums font-semibold ${diffColor}`}>
                          {item.amountDiff != null ? (item.amountDiff > 0 ? "+" : "") + fmt(item.amountDiff) : "-"}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.status === "단가상승"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 하단 합계 */}
          {items.length > 0 && (
            <div className="shrink-0 border-t bg-muted/40 px-3 py-1.5 flex flex-wrap gap-5 text-xs">
              <span className="text-muted-foreground">
                총 <strong className="text-foreground">{fmt(summary.total)}</strong>건
              </span>
              <span className="text-muted-foreground">
                단가상승: <strong className="text-red-600 dark:text-red-400">{fmt(summary.up)}</strong>건
              </span>
              <span className="text-muted-foreground">
                단가하락: <strong className="text-blue-600 dark:text-blue-400">{fmt(summary.down)}</strong>건
              </span>
              <span className="ml-auto text-muted-foreground">
                총 금액차이:&nbsp;
                <strong className={summary.totalAmountDiff >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
                  {summary.totalAmountDiff >= 0 ? "+" : ""}{fmt(summary.totalAmountDiff)}
                </strong>
                &nbsp;원
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 품목 선택 모달 ───────────────────────────────────────────────── */}
      <ItemSelectModal
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        onSelect={(item) => {
          setItemCode(item.itemCode ?? "");
          setItemName(item.itemName ?? "");
          setIsItemModalOpen(false);
          setTimeout(() => refSupplierCode.current?.focus(), 0);
        }}
      />

      {/* ── 구매처 선택 팝업 ─────────────────────────────────────────────── */}
      <SupplierSelectPopup
        open={isSupplierPopupOpen}
        onOpenChange={setIsSupplierPopupOpen}
        onSelect={(code, name) => {
          setSupplierCode(code ?? "");
          setSupplierName(name ?? "");
          setIsSupplierPopupOpen(false);
          setTimeout(() => refModel.current?.focus(), 0);
        }}
      />

      {/* ── 모델 선택 팝업 ───────────────────────────────────────────────── */}
      {isModelPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => {
            if (e.key === "Escape") { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }
          }}
        >
          <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">모델 선택</h3>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={modelSubSearch}
              onChange={(e) => { setModelSubSearch(e.target.value); setModelSubIdx(-1); }}
              placeholder="모델 검색"
              className="h-7 text-xs mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setModelSubIdx((p) => Math.min(p + 1, filteredModelList.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setModelSubIdx((p) => Math.max(p - 1, 0)); }
                else if (e.key === "Enter" && modelSubIdx >= 0) {
                  const m = filteredModelList[modelSubIdx];
                  setModel(m); setIsModelPopupOpen(false);
                  setTimeout(() => refSearchBtn.current?.focus(), 0);
                }
              }}
            />
            <div className="max-h-52 overflow-auto border rounded text-xs">
              {filteredModelList.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-xs">결과 없음</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {filteredModelList.map((m, idx) => (
                      <tr
                        key={m}
                        ref={idx === modelSubIdx ? modelSubRowRef : undefined}
                        className={`cursor-pointer border-b last:border-0 ${idx === modelSubIdx ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => {
                          setModel(m); setIsModelPopupOpen(false);
                          setTimeout(() => refSearchBtn.current?.focus(), 0);
                        }}
                      >
                        <td className="px-3 py-1.5">{m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
