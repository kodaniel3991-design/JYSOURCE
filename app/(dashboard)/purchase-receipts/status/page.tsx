"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { Search, RotateCcw, Printer, X } from "lucide-react";
import { apiPath } from "@/lib/api-path";

// ── 타입 ───────────────────────────────────────────────────────────────────

type HistoryItem = {
  id: string;
  receiptNo: string;
  type: "입고" | "반품";
  itemCode: string;
  itemName: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  unit: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  specNo: number;
  unitPrice: number;
  receiptAmount: number;
};

// 구매처+구매오더+명세+품목+입고일자 동일 행을 합산한 표시 단위
type MergedItem = {
  mergeKey: string;
  supplierCode: string;
  supplierName: string;
  poNumber: string;
  specNo: number;
  itemCode: string;
  itemName: string;
  receiptDate: string;
  qty: number;
  receiptAmount: number;
  unitPrice: number;
  unit: string;
  type: "입고" | "반품";
};

type SupplierGroup = {
  supplierCode: string;
  supplierName: string;
  rows: MergedItem[];
  totalQty: number;
  totalAmount: number;
};

// ── 상수 ───────────────────────────────────────────────────────────────────
// 표시 컬럼: 구매처번호, 구매처명, 품목번호, 품목명, 구매오더, 명세, 입고단가, 입고량, 단위, 입고금액, 입고일자, 통화
const COL_COUNT = 12;

// ── 페이지 ─────────────────────────────────────────────────────────────────

export default function ReceiptStatusPage() {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // ── 조회 조건 ──────────────────────────────────────────────────────────
  const [dateFrom,     setDateFrom]     = useState(firstOfMonth);
  const [dateTo,       setDateTo]       = useState(todayStr);
  const [itemCode,     setItemCode]     = useState("");
  const [itemName,     setItemName]     = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [model,        setModel]        = useState("");

  const [isItemModalOpen,     setIsItemModalOpen]     = useState(false);
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isModelPopupOpen,    setIsModelPopupOpen]    = useState(false);
  const [modelList,           setModelList]           = useState<string[]>([]);
  const [modelSubSearch,      setModelSubSearch]      = useState("");
  const [modelSubIdx,         setModelSubIdx]         = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);

  const [items,   setItems]   = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Enter 네비게이션 refs
  const refDateFrom     = useRef<HTMLInputElement>(null);
  const refDateTo       = useRef<HTMLInputElement>(null);
  const refItemCode     = useRef<HTMLInputElement>(null);
  const refSupplierCode = useRef<HTMLInputElement>(null);
  const refModel        = useRef<HTMLInputElement>(null);
  const refSearchBtn    = useRef<HTMLButtonElement>(null);

  const filteredModelList = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, modelList]);

  useEffect(() => { modelSubRowRef.current?.scrollIntoView({ block: "nearest" }); }, [modelSubIdx]);

  useEffect(() => {
    fetch(apiPath("/api/items"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const s = new Set<string>();
        data.items.forEach((x: Record<string, unknown>) => {
          if (x.VehicleModel) s.add(x.VehicleModel as string);
        });
        setModelList(Array.from(s).sort());
      })
      .catch(() => {});
  }, []);

  // ── 조회 ───────────────────────────────────────────────────────────────
  const loadData = () => {
    const params = new URLSearchParams();
    if (dateFrom)            params.set("dateFrom",     dateFrom);
    if (dateTo)              params.set("dateTo",       dateTo);
    if (itemCode.trim())     params.set("itemCode",     itemCode.trim());
    if (supplierCode.trim()) params.set("supplierCode", supplierCode.trim());
    if (model.trim())        params.set("model",        model.trim());

    setLoading(true);
    fetch(apiPath(`/api/purchase-receipts/history?${params}`))
      .then((r) => r.json())
      .then((data) => { if (data.ok) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const resetSearch = () => {
    setDateFrom(firstOfMonth); setDateTo(todayStr);
    setItemCode(""); setItemName("");
    setSupplierCode(""); setSupplierName("");
    setModel("");
  };

  // ── 합산 + 그룹화 ──────────────────────────────────────────────────────
  // 1단계: (구매처+구매오더+명세+품목+입고일자) 동일 항목 합산
  const mergedItems = useMemo<MergedItem[]>(() => {
    const map = new Map<string, MergedItem>();
    for (const item of items) {
      const key = `${item.supplierCode}||${item.poNumber}||${item.specNo}||${item.itemCode}||${item.receiptDate}`;
      const signedQty    = item.type === "반품" ? -Math.abs(item.qty)          : item.qty;
      const signedAmt    = item.type === "반품" ? -Math.abs(item.receiptAmount) : item.receiptAmount;
      if (!map.has(key)) {
        map.set(key, {
          mergeKey:     key,
          supplierCode: item.supplierCode,
          supplierName: item.supplierName,
          poNumber:     item.poNumber,
          specNo:       item.specNo,
          itemCode:     item.itemCode,
          itemName:     item.itemName,
          receiptDate:  item.receiptDate,
          qty:          signedQty,
          receiptAmount: signedAmt,
          unitPrice:    item.unitPrice,
          unit:         item.unit,
          type:         item.type,
        });
      } else {
        const r = map.get(key)!;
        r.qty           += signedQty;
        r.receiptAmount += signedAmt;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const poCmp = a.poNumber.localeCompare(b.poNumber);
      if (poCmp !== 0) return poCmp;
      return (a.specNo ?? 0) - (b.specNo ?? 0);
    });
  }, [items]);

  // 2단계: 구매처별 그룹화
  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    const map = new Map<string, SupplierGroup>();
    for (const item of mergedItems) {
      const key = item.supplierCode || "__NONE__";
      if (!map.has(key)) {
        map.set(key, {
          supplierCode: item.supplierCode,
          supplierName: item.supplierName,
          rows: [],
          totalQty: 0,
          totalAmount: 0,
        });
      }
      const g = map.get(key)!;
      g.rows.push(item);
      g.totalQty    += item.qty;
      g.totalAmount += item.receiptAmount;
    }
    return Array.from(map.values());
  }, [mergedItems]);

  const grandTotalQty    = useMemo(() => supplierGroups.reduce((s, g) => s + g.totalQty, 0),    [supplierGroups]);
  const grandTotalAmount = useMemo(() => supplierGroups.reduce((s, g) => s + g.totalAmount, 0), [supplierGroups]);

  const handlePrint = () => {
    const now = new Date();
    const fmtDt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    // 화면과 동일한 supplierGroups(합산 후) 사용 → 데이터 일치
    const gQty = grandTotalQty;
    const gAmt = grandTotalAmount;
    const bodyHtml = supplierGroups.map((grp) => {
      const dataRows = grp.rows.map((it, idx) => {
        const rowBg = it.type === "반품"
          ? "background:#fff0f0"
          : idx % 2 === 1 ? "background:#f8f9fa" : "";
        return `
        <tr style="${rowBg}">
          <td></td>
          <td class="tl"></td>
          <td class="tc">${it.receiptDate ?? ""}</td>
          <td class="tl mono">${it.itemCode ?? ""}</td>
          <td class="tl">${it.itemName ?? ""}</td>
          <td></td>
          <td class="tc"></td>
          <td class="tc">${it.unit ?? ""}</td>
          <td class="tr num">${it.unitPrice ? it.unitPrice.toLocaleString("ko-KR") : ""}</td>
          <td class="tc">N</td>
          <td class="tr num ${it.type === "반품" ? "red" : "blue"}">${it.qty.toLocaleString("ko-KR")}</td>
          <td class="tr num">${it.receiptAmount ? it.receiptAmount.toLocaleString("ko-KR") : ""}</td>
          <td class="tc">${it.receiptDate ?? ""}</td>
          <td class="tl mono">${it.poNumber ?? ""}</td>
          <td class="tc">${it.specNo || ""}</td>
        </tr>
        <tr style="${rowBg}">
          <td></td>
          <td class="tl">RP</td>
          <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          <td class="tc">${it.receiptDate ?? ""}</td>
          <td></td><td></td>
        </tr>`;
      }).join("");

      return `
        <tr class="grp-hdr"><td colspan="15"><b>${grp.supplierCode}</b>&nbsp;&nbsp;<b>${grp.supplierName}</b></td></tr>
        ${dataRows}
        <tr class="subtotal">
          <td colspan="10" class="tr">소&nbsp;&nbsp;계</td>
          <td class="tr num"><b>${grp.totalQty.toLocaleString("ko-KR")}</b></td>
          <td class="tr num"><b>${grp.totalAmount.toLocaleString("ko-KR")}</b></td>
          <td colspan="3"></td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>구매처별 입고현황</title>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "맑은 고딕","Malgun Gothic",sans-serif; font-size: 9px; }
  /* 헤더 */
  .page-hdr { display: flex; align-items: flex-start; margin-bottom: 4mm; }
  .co-name   { font-size: 11px; padding-top: 2px; min-width: 100px; }
  .rpt-title { flex: 1; text-align: center; font-size: 16px; font-weight: bold; }
  /* 결재란: 2행 구조 (컬럼헤더행 / 결재 스탬프행) */
  .approval { margin-left: auto; }
  .approval table { border-collapse: collapse; }
  .approval td { border: 1px solid #555; text-align: center; vertical-align: middle; font-size: 8px; }
  .approval .corner { width: 7mm;  height: 6mm;  background: #f0f0f0; }
  .approval .col-hdr{ width: 15mm; height: 6mm;  background: #f0f0f0; font-weight: bold; }
  .approval .row-lbl{ width: 7mm;  height: 18mm; background: #f0f0f0; font-weight: bold; }
  .approval .stamp  { width: 15mm; height: 18mm; }
  /* 조건행 */
  .cond { display: grid; grid-template-columns: auto auto 1fr; column-gap: 16px; row-gap: 1px;
          font-size: 8.5px; border-bottom: 1px solid #888; padding-bottom: 2mm; margin-bottom: 2mm; }
  .cond-r { text-align: right; }
  /* 데이터 테이블 */
  table.dt { width: 100%; border-collapse: collapse; }
  table.dt th, table.dt td { border: 1px solid #bbb; padding: 1px 2px; font-size: 8px; }
  table.dt th { background: #ececec; text-align: center; font-weight: bold; }
  .grp-hdr td { background: #d8d8d8; font-weight: bold; padding: 2px 5px; font-size: 8.5px; border: 1px solid #aaa; }
  .subtotal td { background: #fffacd; font-weight: bold; border-color: #ccc; }
  .total-row td { background: #d4edda; font-weight: bold; border-color: #aaa; }
  .tl  { text-align: left;   }
  .tc  { text-align: center; }
  .tr  { text-align: right;  }
  .num { font-variant-numeric: tabular-nums; }
  .mono{ font-family: monospace; }
  .blue{ color: #1d4ed8; }
  .red { color: #dc2626; }
</style></head><body>

<div class="page-hdr">
  <div class="co-name">진양오토모티브(주)</div>
  <div class="rpt-title">구매처별 입고현황</div>
  <div class="approval">
    <table>
      <tr>
        <td class="corner"></td>
        <td class="col-hdr">담당</td><td class="col-hdr">차장</td><td class="col-hdr">이사</td><td class="col-hdr">사장</td>
      </tr>
      <tr>
        <td class="row-lbl">결재</td>
        <td class="stamp"></td><td class="stamp"></td><td class="stamp"></td><td class="stamp"></td>
      </tr>
    </table>
  </div>
</div>

<div class="cond">
  <span>입고일자 : ${dateFrom} ~ ${dateTo}</span>
  <span>품목번호 : ${itemCode ? itemCode + " ~ " + itemCode : "~"}</span>
  <span class="cond-r">Page : 1</span>
  <span>구매오더번호 : ~</span>
  <span>구매처번호 : ${supplierCode ? supplierCode + " ~ " + supplierCode : "~"}</span>
  <span class="cond-r">출력일자: ${fmtDt(now)}</span>
</div>

<table class="dt">
  <thead>
    <tr>
      <th rowspan="2" style="width:5%">구매처</th>
      <th>전표번호</th><th>입고일자</th><th>품목번호</th>
      <th style="min-width:50px">품명</th><th></th>
      <th>창고</th><th>단위</th><th>단가</th><th>가단가</th>
      <th>입고수량</th><th>입고금액</th>
      <th>발주일자</th><th>발주번호</th><th>발주명세</th>
    </tr>
    <tr>
      <th>수불코드</th><th></th><th></th>
      <th>규격</th><th>재질</th>
      <th></th><th></th><th>주기</th><th></th><th></th>
      <th>납품일자</th><th>원인제품코드</th><th></th>
    </tr>
  </thead>
  <tbody>
    ${bodyHtml}
    <tr class="total-row">
      <td colspan="10" class="tr"><b>총 합 계</b></td>
      <td class="tr num"><b>${gQty.toLocaleString("ko-KR")}</b></td>
      <td class="tr num"><b>${gAmt.toLocaleString("ko-KR")}</b></td>
      <td colspan="3"></td>
    </tr>
  </tbody>
</table>
</body></html>`;

    const pw = window.open("", "_blank", "width=1200,height=900");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
    pw.addEventListener("load", () => { pw.focus(); pw.print(); });
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print   { display: none !important; }
          .print-scroll { overflow: visible !important; height: auto !important; max-height: none !important; }
          .print-card   { overflow: visible !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 7rem)" }}>

        {/* 페이지 헤더 */}
        <div className="no-print">
          <PageHeader
            title="입고현황 조회/출력"
            description="구매 입고 이력을 구매처별로 조회하고 출력합니다."
          />
        </div>

        {/* ── 검색 패널 ──────────────────────────────────────────────────── */}
        <Card className="shrink-0 no-print">
          <CardContent className="p-3">
            <div className="flex items-end gap-3 mb-3 flex-wrap">

              {/* 입고일자 */}
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-xs font-medium text-muted-foreground">입고일자</label>
                <div className="flex gap-1 items-center">
                  <DateInput
                    ref={refDateFrom}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refDateTo.current?.focus(); } }}
                    className="h-7 text-xs w-[130px]"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">~</span>
                  <DateInput
                    ref={refDateTo}
                    value={dateTo}
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
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0"
                    onClick={() => setIsItemModalOpen(true)}>
                    <Search className="h-3 w-3" />
                  </Button>
                  <Input value={itemName} readOnly placeholder="품목명"
                    className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
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
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0"
                    onClick={() => setIsSupplierPopupOpen(true)}>
                    <Search className="h-3 w-3" />
                  </Button>
                  <Input value={supplierName} readOnly placeholder="구매처명"
                    className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
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
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0"
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
                onClick={loadData}
                disabled={loading}
                className="h-8 px-4"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadData(); } }}
              >
                <Search className="mr-1.5 h-3.5 w-3.5" />
                검색
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetSearch} className="h-8 px-3">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                필터 초기화
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePrint} disabled={mergedItems.length === 0} className="h-8 px-3">
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                인쇄
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                총{" "}
                <span className="font-semibold text-foreground">{mergedItems.length.toLocaleString("ko-KR")}</span>
                건이 조회되었습니다.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 모델 팝업 */}
        {isModelPopupOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print"
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
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setModelSubIdx((p) => Math.min(p + 1, filteredModelList.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setModelSubIdx((p) => Math.max(p - 1, -1)); }
                  else if (e.key === "Enter") {
                    e.preventDefault();
                    const target = modelSubIdx >= 0 ? filteredModelList[modelSubIdx]
                      : filteredModelList.length === 1 ? filteredModelList[0] : null;
                    if (target) {
                      setModel(target);
                      setIsModelPopupOpen(false);
                      setTimeout(() => refSearchBtn.current?.focus(), 0);
                    }
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
                    {filteredModelList.length === 0 ? (
                      <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                    ) : filteredModelList.map((m, idx) => (
                      <tr
                        key={m}
                        ref={idx === modelSubIdx ? modelSubRowRef : null}
                        className={`cursor-pointer border-t ${idx === modelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40" : "hover:bg-muted"}`}
                        onClick={() => {
                          setModel(m);
                          setIsModelPopupOpen(false);
                          setTimeout(() => refSearchBtn.current?.focus(), 0);
                        }}
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

        {/* ── 데이터 그리드 ────────────────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col min-h-0 print-card">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto min-h-0 print-scroll">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/80 border-b z-10">
                  <tr>
                    <th className="px-2 py-2 text-left border-r border-border whitespace-nowrap w-24">구매처번호</th>
                    <th className="px-2 py-2 text-left border-r border-border w-32">구매처명</th>
                    <th className="px-2 py-2 text-left border-r border-border w-40">품목번호</th>
                    <th className="px-2 py-2 text-left border-r border-border min-w-[140px]">품목명</th>
                    <th className="px-2 py-2 text-center border-r border-border w-32">구매오더</th>
                    <th className="px-2 py-2 text-center border-r border-border w-12">명세</th>
                    <th className="px-2 py-2 text-right border-r border-border w-24">입고단가</th>
                    <th className="px-2 py-2 text-right border-r border-border w-20">입고량</th>
                    <th className="px-2 py-2 text-center border-r border-border w-12">단위</th>
                    <th className="px-2 py-2 text-right border-r border-border w-28">입고금액</th>
                    <th className="px-2 py-2 text-center border-r border-border w-24">입고일자</th>
                    <th className="px-2 py-2 text-center w-14">통화</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={COL_COUNT} className="py-10 text-center text-xs text-muted-foreground">
                        조회 중...
                      </td>
                    </tr>
                  ) : mergedItems.length === 0 ? (
                    <tr>
                      <td colSpan={COL_COUNT} className="py-10 text-center text-xs text-muted-foreground">
                        조회 조건을 입력하고 조회 버튼을 누르세요.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {supplierGroups.flatMap((group) => [
                        // ── 데이터 행 ──
                        ...group.rows.map((item, idx) => (
                          <tr
                            key={item.mergeKey}
                            className={`border-b ${
                              item.type === "반품"
                                ? "bg-red-50/40 dark:bg-red-500/10"
                                : idx % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : ""
                            }`}
                          >
                            {/* 구매처번호·구매처명: 첫 행만 rowspan */}
                            {idx === 0 && (
                              <>
                                <td
                                  rowSpan={group.rows.length}
                                  className="px-2 py-1 font-mono text-[11px] border-r border-border align-top"
                                >
                                  {group.supplierCode}
                                </td>
                                <td
                                  rowSpan={group.rows.length}
                                  className="px-2 py-1 border-r border-border align-top"
                                >
                                  {group.supplierName}
                                </td>
                              </>
                            )}
                            <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.itemCode}</td>
                            <td className="px-2 py-1 border-r border-border">{item.itemName}</td>
                            <td className="px-2 py-1 text-center border-r border-border font-mono text-[11px] bg-yellow-50/60 dark:bg-yellow-500/10">
                              {item.poNumber}
                            </td>
                            <td className="px-2 py-1 text-center border-r border-border bg-yellow-50/60 dark:bg-yellow-500/10">
                              {item.specNo || "-"}
                            </td>
                            <td className="px-2 py-1 text-right border-r border-border tabular-nums text-muted-foreground">
                              {item.unitPrice ? item.unitPrice.toLocaleString("ko-KR") : "-"}
                            </td>
                            <td className={`px-2 py-1 text-right border-r border-border tabular-nums font-semibold ${
                              item.type === "반품" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                            }`}>
                              {item.qty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-1 text-center border-r border-border text-muted-foreground">
                              {item.unit || "-"}
                            </td>
                            <td className="px-2 py-1 text-right border-r border-border tabular-nums">
                              {item.receiptAmount !== 0 ? item.receiptAmount.toLocaleString("ko-KR") : "-"}
                            </td>
                            <td className="px-2 py-1 text-center border-r border-border">{item.receiptDate}</td>
                            <td className="px-2 py-1 text-center text-muted-foreground">KRW</td>
                          </tr>
                        )),

                        // ── 구매처 계 ──
                        <tr
                          key={`sub-${group.supplierCode}`}
                          className="border-b bg-pink-100/80 dark:bg-pink-500/10 font-semibold"
                        >
                          <td colSpan={7} className="px-3 py-1.5 text-right border-r border-border text-xs text-pink-800 dark:text-pink-300">
                            구매처 계
                          </td>
                          <td className="px-2 py-1.5 text-right border-r border-border tabular-nums text-pink-800 dark:text-pink-300">
                            {group.totalQty.toLocaleString("ko-KR")}
                          </td>
                          <td className="px-2 py-1.5 border-r border-border" />
                          <td className="px-2 py-1.5 text-right border-r border-border tabular-nums text-pink-800 dark:text-pink-300">
                            {group.totalAmount.toLocaleString("ko-KR")}
                          </td>
                          <td colSpan={2} className="px-2 py-1.5" />
                        </tr>,
                      ])}

                      {/* ── 총 계 ── */}
                      <tr className="bg-pink-200/80 dark:bg-pink-500/20 font-bold border-t-2 border-pink-300 dark:border-pink-500/40">
                        <td colSpan={7} className="px-3 py-2 text-right border-r border-border text-sm text-pink-900 dark:text-pink-200">
                          총 계
                        </td>
                        <td className="px-2 py-2 text-right border-r border-border tabular-nums text-pink-900 dark:text-pink-200">
                          {grandTotalQty.toLocaleString("ko-KR")}
                        </td>
                        <td className="px-2 py-2 border-r border-border" />
                        <td className="px-2 py-2 text-right border-r border-border tabular-nums text-pink-900 dark:text-pink-200">
                          {grandTotalAmount.toLocaleString("ko-KR")}
                        </td>
                        <td colSpan={2} className="px-2 py-2" />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 팝업 ──────────────────────────────────────────────────────────── */}
      {isItemModalOpen && (
        <ItemSelectModal
          open={isItemModalOpen}
          onOpenChange={(open) => { if (!open) setIsItemModalOpen(false); }}
          onSelect={(item) => {
            setItemCode(item.itemCode);
            setItemName(item.itemName);
            setIsItemModalOpen(false);
            setTimeout(() => refSupplierCode.current?.focus(), 0);
          }}
        />
      )}
      {isSupplierPopupOpen && (
        <SupplierSelectPopup
          open={isSupplierPopupOpen}
          onOpenChange={(open) => { if (!open) setIsSupplierPopupOpen(false); }}
          onSelect={(no, name) => {
            setSupplierCode(no);
            setSupplierName(name);
            setIsSupplierPopupOpen(false);
            setTimeout(() => refModel.current?.focus(), 0);
          }}
        />
      )}
    </>
  );
}
