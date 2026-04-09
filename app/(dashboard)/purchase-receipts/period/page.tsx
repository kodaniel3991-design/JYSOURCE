"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RotateCcw, Printer, X } from "lucide-react";
import { apiPath } from "@/lib/api-path";
import { useSortableGrid } from "@/lib/hooks/use-sortable-grid";
import { SortableTh } from "@/components/ui/sortable-th";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type ViewType = "내역" | "업체+품목" | "업체집계";

type HistoryItem = {
  id: string;
  receiptNo: string;
  type: "입고" | "반품";
  itemCode: string;
  itemName: string;
  qty: number;
  receiptDate: string;
  unit: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  specNo: number;
  unitPrice: number;
  receiptAmount: number;
};

type DateGroup = {
  receiptDate: string;
  rows: HistoryItem[];
};

type SupplierDetailGroup = {
  supplierCode: string;
  supplierName: string;
  dateGroups: DateGroup[];
  totalQty: number;
  totalAmount: number;
};

type ItemAggRow = {
  supplierCode: string;
  supplierName: string;
  itemCode: string;
  itemName: string;
  unit: string;
  qty: number;
  receiptAmount: number;
};

type SupplierItemGroup = {
  supplierCode: string;
  supplierName: string;
  rows: ItemAggRow[];
  totalQty: number;
  totalAmount: number;
};

type SupplierAggRow = {
  supplierCode: string;
  supplierName: string;
  qty: number;
  receiptAmount: number;
};

// ── 공통 스타일 상수 ─────────────────────────────────────────────────────────

const thCls = "px-2 py-2 text-center border-r border-border whitespace-nowrap font-medium";
const tdCls = "px-2 py-1 border-r border-border";

// ── 페이지 ───────────────────────────────────────────────────────────────────

export default function ReceiptPeriodPage() {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // ── 검색 조건 ──────────────────────────────────────────────────────────────
  const [viewType,     setViewType]     = useCachedState<ViewType>("receipt-period/viewType",    "내역");
  const [dateFrom,     setDateFrom]     = useCachedState("receipt-period/dateFrom",     firstOfMonth);
  const [dateTo,       setDateTo]       = useCachedState("receipt-period/dateTo",       todayStr);
  const [itemCode,     setItemCode]     = useCachedState("receipt-period/itemCode",     "");
  const [itemName,     setItemName]     = useCachedState("receipt-period/itemName",     "");
  const [supplierCode, setSupplierCode] = useCachedState("receipt-period/supplierCode", "");
  const [supplierName, setSupplierName] = useCachedState("receipt-period/supplierName", "");
  const [model,        setModel]        = useCachedState("receipt-period/model",        "");

  const [isItemModalOpen,     setIsItemModalOpen]     = useState(false);
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isModelPopupOpen,    setIsModelPopupOpen]    = useState(false);
  const [modelList,           setModelList]           = useState<string[]>([]);
  const [modelSubSearch,      setModelSubSearch]      = useState("");
  const [modelSubIdx,         setModelSubIdx]         = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);

  const [items,   setItems]   = useCachedState<HistoryItem[]>("receipt-period/items", []);
  const [loading, setLoading] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");
  const [stripedRows, setStripedRows] = useState(true);

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

  // ── 조회 ───────────────────────────────────────────────────────────────────
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

  // ── 부호 변환 (반품 = 음수) ─────────────────────────────────────────────
  const processedItems = useMemo<HistoryItem[]>(() =>
    items.map((item) => ({
      ...item,
      qty:           item.type === "반품" ? -Math.abs(item.qty)           : item.qty,
      receiptAmount: item.type === "반품" ? -Math.abs(item.receiptAmount) : item.receiptAmount,
    })),
  [items]);

  // ── 내역: 구매처 → 입고일자 2단계 그룹 ────────────────────────────────────
  const detailGroups = useMemo<SupplierDetailGroup[]>(() => {
    const supplierMap = new Map<string, SupplierDetailGroup>();
    for (const item of processedItems) {
      const sk = item.supplierCode || "__NONE__";
      if (!supplierMap.has(sk)) {
        supplierMap.set(sk, {
          supplierCode: item.supplierCode,
          supplierName: item.supplierName,
          dateGroups: [],
          totalQty: 0,
          totalAmount: 0,
        });
      }
      const sg = supplierMap.get(sk)!;
      sg.totalQty    += item.qty;
      sg.totalAmount += item.receiptAmount;
      let dg = sg.dateGroups.find((d) => d.receiptDate === item.receiptDate);
      if (!dg) { dg = { receiptDate: item.receiptDate, rows: [] }; sg.dateGroups.push(dg); }
      dg.rows.push(item);
    }
    for (const sg of Array.from(supplierMap.values())) {
      sg.dateGroups.sort((a, b) => a.receiptDate.localeCompare(b.receiptDate));
    }
    return Array.from(supplierMap.values());
  }, [processedItems]);

  // ── 업체+품목: (구매처 + 품목) 합산 후 구매처별 그룹 ─────────────────────
  const itemGroups = useMemo<SupplierItemGroup[]>(() => {
    const aggMap = new Map<string, ItemAggRow>();
    for (const item of processedItems) {
      const key = `${item.supplierCode}||${item.itemCode}`;
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          supplierCode:  item.supplierCode,
          supplierName:  item.supplierName,
          itemCode:      item.itemCode,
          itemName:      item.itemName,
          unit:          item.unit,
          qty:           0,
          receiptAmount: 0,
        });
      }
      const r = aggMap.get(key)!;
      r.qty           += item.qty;
      r.receiptAmount += item.receiptAmount;
    }

    const supplierMap = new Map<string, SupplierItemGroup>();
    for (const row of Array.from(aggMap.values())) {
      const sk = row.supplierCode || "__NONE__";
      if (!supplierMap.has(sk)) {
        supplierMap.set(sk, {
          supplierCode: row.supplierCode,
          supplierName: row.supplierName,
          rows: [],
          totalQty: 0,
          totalAmount: 0,
        });
      }
      const sg = supplierMap.get(sk)!;
      sg.rows.push(row);
      sg.totalQty    += row.qty;
      sg.totalAmount += row.receiptAmount;
    }
    return Array.from(supplierMap.values());
  }, [processedItems]);

  // ── 업체집계: 구매처별 합산 ────────────────────────────────────────────────
  const supplierAgg = useMemo<SupplierAggRow[]>(() => {
    const aggMap = new Map<string, SupplierAggRow>();
    for (const item of processedItems) {
      const key = item.supplierCode || "__NONE__";
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          supplierCode:  item.supplierCode,
          supplierName:  item.supplierName,
          qty:           0,
          receiptAmount: 0,
        });
      }
      const r = aggMap.get(key)!;
      r.qty           += item.qty;
      r.receiptAmount += item.receiptAmount;
    }
    return Array.from(aggMap.values());
  }, [processedItems]);

  const { sortedItems: sortedSupplierAgg, sortKey: aggSortKey, sortDir: aggSortDir, toggleSort: aggToggleSort } = useSortableGrid(supplierAgg);

  // ── 총계 ──────────────────────────────────────────────────────────────────
  const grandTotalQty = useMemo(() => {
    if (viewType === "내역")     return detailGroups.reduce((s, g) => s + g.totalQty, 0);
    if (viewType === "업체+품목") return itemGroups.reduce((s, g) => s + g.totalQty, 0);
    return supplierAgg.reduce((s, r) => s + r.qty, 0);
  }, [viewType, detailGroups, itemGroups, supplierAgg]);

  const grandTotalAmount = useMemo(() => {
    if (viewType === "내역")     return detailGroups.reduce((s, g) => s + g.totalAmount, 0);
    if (viewType === "업체+품목") return itemGroups.reduce((s, g) => s + g.totalAmount, 0);
    return supplierAgg.reduce((s, r) => s + r.receiptAmount, 0);
  }, [viewType, detailGroups, itemGroups, supplierAgg]);

  const rowCount = useMemo(() => {
    if (viewType === "내역")     return processedItems.length;
    if (viewType === "업체+품목") return itemGroups.reduce((s, g) => s + g.rows.length, 0);
    return supplierAgg.length;
  }, [viewType, processedItems, itemGroups, supplierAgg]);

  const colCount = viewType === "내역" ? 15 : viewType === "업체+품목" ? 11 : 6;

  const handleExport = () => {
    if (items.length === 0) return;
    const header = ["거래처번호","거래처명","입고일자","전표번호","품목번호","품목명","단위","입고수량","입고금액","구분"];
    const rows = items.map((r) => [
      r.supplierCode, r.supplierName, r.receiptDate, r.receiptNo,
      r.itemCode, r.itemName, r.unit, String(r.qty), String(r.receiptAmount), r.type,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const csv = [header.join(","), rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "receipt-period.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── 인쇄 ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const now = new Date();
    const fmtDt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    const fmt = (n: number) => n.toLocaleString("ko-KR");
    const subCls   = "background:#fffacd;font-weight:bold";
    const totalCls = "background:#d4edda;font-weight:bold";

    let bodyHtml = "";
    let colHeaders = "";

    if (viewType === "내역") {
      colHeaders = `<tr>
        <th>거래처번호</th><th>입고일자</th><th>전표번호</th><th>품목번호</th><th>품목명</th>
        <th>규격</th><th>재질</th><th>단위</th>
        <th>납품수량</th><th>불량수량</th><th>불량률(ppm)</th>
        <th>입고수량</th><th>입고단가</th><th>입고금액</th><th>가단가</th>
      </tr>`;

      bodyHtml = detailGroups.map((group) => {
        const supplierRowSpan = group.dateGroups.reduce((s, dg) => s + dg.rows.length, 0);
        let supplierShown = false;
        const dataRows = group.dateGroups.map((dg) => {
          return dg.rows.map((item, ri) => {
            const showSup = !supplierShown;
            if (!supplierShown) supplierShown = true;
            const qCol = `class="${item.qty < 0 ? "red" : "blue"}"`;
            return `<tr>
              ${showSup ? `<td rowspan="${supplierRowSpan}" class="tl">${group.supplierCode}-${group.supplierName}</td>` : ""}
              ${ri === 0 ? `<td rowspan="${dg.rows.length}" class="tc">${dg.receiptDate}</td>` : ""}
              <td class="tc mono">${item.receiptNo}</td>
              <td class="tl mono">${item.itemCode}</td>
              <td class="tl">${item.itemName}</td>
              <td></td><td></td>
              <td class="tc">${item.unit}</td>
              <td class="tr num" ${qCol}>${fmt(item.qty)}</td>
              <td class="tr">0</td><td class="tr">0</td>
              <td class="tr num" ${qCol}>${fmt(item.qty)}</td>
              <td class="tr num">${item.unitPrice ? fmt(item.unitPrice) : ""}</td>
              <td class="tr num">${fmt(item.receiptAmount)}</td>
              <td class="tc">N</td>
            </tr>`;
          }).join("");
        }).join("");

        return `${dataRows}
          <tr style="${subCls}">
            <td colspan="8" class="tr">[소&nbsp;&nbsp;계]</td>
            <td class="tr num">${fmt(group.totalQty)}</td>
            <td class="tr">0</td><td class="tr">0</td>
            <td class="tr num">${fmt(group.totalQty)}</td>
            <td></td>
            <td class="tr num">${fmt(group.totalAmount)}</td>
            <td></td>
          </tr>`;
      }).join("");

      bodyHtml += `<tr style="${totalCls}">
        <td colspan="8" class="tr"><b>[합&nbsp;&nbsp;계]</b></td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td class="tr">0</td><td class="tr">0</td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td></td>
        <td class="tr num"><b>${fmt(grandTotalAmount)}</b></td>
        <td></td>
      </tr>`;

    } else if (viewType === "업체+품목") {
      colHeaders = `<tr>
        <th>거래처번호</th><th>품목번호</th><th>품목명</th>
        <th>규격</th><th>재질</th><th>단위</th>
        <th>납품수량</th><th>불량수량</th><th>불량률(ppm)</th>
        <th>입고수량</th><th>입고금액</th>
      </tr>`;

      bodyHtml = itemGroups.map((group) => {
        const dataRows = group.rows.map((row, ri) => {
          const qCol = `class="${row.qty < 0 ? "red" : "blue"}"`;
          return `<tr>
            ${ri === 0 ? `<td rowspan="${group.rows.length}" class="tl">${group.supplierCode}-${group.supplierName}</td>` : ""}
            <td class="tl mono">${row.itemCode}</td>
            <td class="tl">${row.itemName}</td>
            <td></td><td></td>
            <td class="tc">${row.unit}</td>
            <td class="tr num" ${qCol}>${fmt(row.qty)}</td>
            <td class="tr">0</td><td class="tr">0</td>
            <td class="tr num" ${qCol}>${fmt(row.qty)}</td>
            <td class="tr num">${fmt(row.receiptAmount)}</td>
          </tr>`;
        }).join("");

        return `${dataRows}
          <tr style="${subCls}">
            <td colspan="6" class="tr">[소&nbsp;&nbsp;계]</td>
            <td class="tr num">${fmt(group.totalQty)}</td>
            <td class="tr">0</td><td class="tr">0</td>
            <td class="tr num">${fmt(group.totalQty)}</td>
            <td class="tr num">${fmt(group.totalAmount)}</td>
          </tr>`;
      }).join("");

      bodyHtml += `<tr style="${totalCls}">
        <td colspan="6" class="tr"><b>[합&nbsp;&nbsp;계]</b></td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td class="tr">0</td><td class="tr">0</td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td class="tr num"><b>${fmt(grandTotalAmount)}</b></td>
      </tr>`;

    } else {
      colHeaders = `<tr>
        <th>거래처번호</th>
        <th>납품수량</th><th>불량수량</th><th>불량률(ppm)</th>
        <th>입고수량</th><th>입고금액</th>
      </tr>`;

      bodyHtml = supplierAgg.map((row) => `
        <tr>
          <td class="tl">${row.supplierCode}-${row.supplierName}</td>
          <td class="tr num ${row.qty < 0 ? "red" : ""}">${fmt(row.qty)}</td>
          <td class="tr">0</td><td class="tr">0</td>
          <td class="tr num ${row.qty < 0 ? "red" : ""}">${fmt(row.qty)}</td>
          <td class="tr num">${fmt(row.receiptAmount)}</td>
        </tr>`).join("");

      bodyHtml += `<tr style="${totalCls}">
        <td class="tl"><b>[합&nbsp;&nbsp;계]</b></td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td class="tr">0</td><td class="tr">0</td>
        <td class="tr num"><b>${fmt(grandTotalQty)}</b></td>
        <td class="tr num"><b>${fmt(grandTotalAmount)}</b></td>
      </tr>`;
    }

    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>기간별 구매입고현황</title>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "맑은 고딕","Malgun Gothic",sans-serif; font-size: 9px; }
  .page-hdr { display: flex; align-items: flex-start; margin-bottom: 4mm; }
  .co-name  { font-size: 11px; padding-top: 2px; min-width: 100px; }
  .rpt-title{ flex: 1; text-align: center; font-size: 16px; font-weight: bold; }
  .approval { margin-left: auto; }
  .approval table { border-collapse: collapse; }
  .approval td { border: 1px solid #555; text-align: center; vertical-align: middle; font-size: 8px; }
  .approval .corner { width: 7mm; height: 6mm; background: #f0f0f0; }
  .approval .col-hdr{ width: 15mm; height: 6mm; background: #f0f0f0; font-weight: bold; }
  .approval .row-lbl{ width: 7mm; height: 18mm; background: #f0f0f0; font-weight: bold; }
  .approval .stamp  { width: 15mm; height: 18mm; }
  .cond { font-size: 8.5px; border-bottom: 1px solid #888; padding-bottom: 2mm; margin-bottom: 2mm;
          display: flex; flex-wrap: wrap; gap: 2px 20px; }
  table.dt { width: 100%; border-collapse: collapse; }
  table.dt th, table.dt td { border: 1px solid #bbb; padding: 1px 2px; font-size: 8px; }
  table.dt th { background: #ececec; text-align: center; font-weight: bold; }
  .tl { text-align: left; } .tc { text-align: center; } .tr { text-align: right; }
  .num { font-variant-numeric: tabular-nums; }
  .mono { font-family: monospace; }
  .blue { color: #1d4ed8; } .red { color: #dc2626; }
</style></head><body>
<div class="page-hdr">
  <div class="co-name">진양오토모티브(주)</div>
  <div class="rpt-title">기간별 구매입고현황 (${viewType})</div>
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
  <span>품목번호 : ${itemCode ? itemCode : "~"}</span>
  <span>구매처번호 : ${supplierCode ? supplierCode : "~"}</span>
  <span>모델 : ${model ? model : "~"}</span>
  <span style="margin-left:auto">출력일자: ${fmtDt(now)}</span>
</div>
<table class="dt">
  <thead>${colHeaders}</thead>
  <tbody>${bodyHtml}</tbody>
</table>
</body></html>`;

    const pw = window.open("", "_blank", "width=1200,height=900");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
    pw.addEventListener("load", () => { pw.focus(); pw.print(); });
  };

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 7rem)" }}>

        {/* 페이지 헤더 */}
        <div className="no-print">
          <PageHeader
            title="기간별 구매입고현황"
            description="기간 및 조회구분별 구매 입고 현황을 조회하고 출력합니다."
          />
        </div>

        {/* ── 검색 패널 ──────────────────────────────────────────────────────── */}
        <Card className="shrink-0 no-print">
          <CardContent className="p-3">
            <div className="flex items-end gap-3 mb-3 flex-wrap">

              {/* 조회구분 */}
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-xs font-medium text-muted-foreground">조회구분</label>
                <select
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value as ViewType)}
                  className="h-7 text-xs rounded-md border border-input bg-background px-2 outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="내역">내역</option>
                  <option value="업체+품목">업체+품목</option>
                  <option value="업체집계">업체집계</option>
                </select>
              </div>

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
              <Button type="button" size="sm" variant="outline" onClick={handlePrint}
                disabled={rowCount === 0} className="h-8 px-3">
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                인쇄
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                총{" "}
                <span className="font-semibold text-foreground">{rowCount.toLocaleString("ko-KR")}</span>
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
                        className={`cursor-pointer border-t ${idx === modelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20" : "hover:bg-muted"}`}
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

        {/* ── 데이터 그리드 ─────────────────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-end space-y-0 py-2 px-4 shrink-0 no-print">
            <DataGridToolbar
              active={gridSettingsOpen ? gridSettingsTab : undefined}
              onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
              onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
            />
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-xs border-collapse">

                {/* ── 헤더 ─────────────────────────────────────────────────── */}
                <thead className="sticky top-0 bg-muted/80 border-b z-10">
                  {viewType === "내역" && (
                    <tr>
                      <th className={`${thCls} w-44`}>거래처번호</th>
                      <th className={`${thCls} w-24`}>입고일자</th>
                      <th className={`${thCls} w-24`}>전표번호</th>
                      <th className={`${thCls} w-36`}>품목번호</th>
                      <th className={`${thCls} min-w-[120px]`}>품목명</th>
                      <th className={`${thCls} w-20`}>규격</th>
                      <th className={`${thCls} w-16`}>재질</th>
                      <th className={`${thCls} w-12`}>단위</th>
                      <th className={`${thCls} w-20`}>납품수량</th>
                      <th className={`${thCls} w-18`}>불량수량</th>
                      <th className={`${thCls} w-22`}>불량률(ppm)</th>
                      <th className={`${thCls} w-20`}>입고수량</th>
                      <th className={`${thCls} w-22`}>입고단가</th>
                      <th className={`${thCls} w-26`}>입고금액</th>
                      <th className={`${thCls} w-16 border-r-0`}>가단가여부</th>
                    </tr>
                  )}
                  {viewType === "업체+품목" && (
                    <tr>
                      <th className={`${thCls} w-48`}>거래처번호</th>
                      <th className={`${thCls} w-36`}>품목번호</th>
                      <th className={`${thCls} min-w-[120px]`}>품목명</th>
                      <th className={`${thCls} w-20`}>규격</th>
                      <th className={`${thCls} w-16`}>재질</th>
                      <th className={`${thCls} w-12`}>단위</th>
                      <th className={`${thCls} w-22`}>납품수량</th>
                      <th className={`${thCls} w-18`}>불량수량</th>
                      <th className={`${thCls} w-22`}>불량률(ppm)</th>
                      <th className={`${thCls} w-22`}>입고수량</th>
                      <th className={`${thCls} w-28 border-r-0`}>입고금액</th>
                    </tr>
                  )}
                  {viewType === "업체집계" && (
                    <tr>
                      <SortableTh sortKey="supplierCode"  currentKey={aggSortKey as string|null} sortDir={aggSortDir} onSort={(k) => aggToggleSort(k as keyof SupplierAggRow)} className={`${thCls} min-w-[180px]`}>거래처번호</SortableTh>
                      <th className={`${thCls} w-28`}>납품수량</th>
                      <th className={`${thCls} w-24`}>불량수량</th>
                      <th className={`${thCls} w-28`}>불량률(ppm)</th>
                      <SortableTh sortKey="qty"           currentKey={aggSortKey as string|null} sortDir={aggSortDir} onSort={(k) => aggToggleSort(k as keyof SupplierAggRow)} className={`${thCls} w-28`}>입고수량</SortableTh>
                      <SortableTh sortKey="receiptAmount" currentKey={aggSortKey as string|null} sortDir={aggSortDir} onSort={(k) => aggToggleSort(k as keyof SupplierAggRow)} className={`${thCls} w-36 border-r-0`}>입고금액</SortableTh>
                    </tr>
                  )}
                </thead>

                {/* ── 바디 ─────────────────────────────────────────────────── */}
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={colCount} className="py-10 text-center text-muted-foreground">조회 중...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={colCount} className="py-10 text-center text-muted-foreground">조회 조건을 입력하고 조회 버튼을 누르세요.</td>
                    </tr>
                  ) : (
                    <>
                      {/* ── 내역 ─────────────────────────────────────────── */}
                      {viewType === "내역" && (
                        <>
                          {detailGroups.flatMap((group) => {
                            const supplierRowSpan = group.dateGroups.reduce((s, dg) => s + dg.rows.length, 0);
                            let supplierShown = false;

                            const dataRows = group.dateGroups.flatMap((dg) =>
                              dg.rows.map((item, ri) => {
                                const showSup  = !supplierShown;
                                if (!supplierShown) supplierShown = true;
                                const showDate = ri === 0;
                                const qColor   = item.qty < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-blue-600 dark:text-blue-400";

                                return (
                                  <tr key={item.id} className="border-b hover:bg-muted/20">
                                    {showSup && (
                                      <td rowSpan={supplierRowSpan}
                                        className={`${tdCls} align-top text-[11px]`}>
                                        <div className="font-mono">{group.supplierCode}</div>
                                        <div className="text-muted-foreground text-[10px]">{group.supplierName}</div>
                                      </td>
                                    )}
                                    {showDate && (
                                      <td rowSpan={dg.rows.length}
                                        className={`${tdCls} text-center align-top`}>
                                        {dg.receiptDate}
                                      </td>
                                    )}
                                    <td className={`${tdCls} text-center font-mono text-[11px]`}>{item.receiptNo}</td>
                                    <td className={`${tdCls} font-mono text-[11px]`}>{item.itemCode}</td>
                                    <td className={tdCls}>{item.itemName}</td>
                                    <td className={`${tdCls} text-muted-foreground`}></td>
                                    <td className={`${tdCls} text-muted-foreground`}></td>
                                    <td className={`${tdCls} text-center`}>{item.unit}</td>
                                    <td className={`${tdCls} text-right tabular-nums ${qColor}`}>{item.qty.toLocaleString("ko-KR")}</td>
                                    <td className={`${tdCls} text-right`}>0</td>
                                    <td className={`${tdCls} text-right`}>0</td>
                                    <td className={`${tdCls} text-right tabular-nums font-semibold ${qColor}`}>{item.qty.toLocaleString("ko-KR")}</td>
                                    <td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>
                                      {item.unitPrice ? item.unitPrice.toLocaleString("ko-KR") : ""}
                                    </td>
                                    <td className={`${tdCls} text-right tabular-nums`}>{item.receiptAmount.toLocaleString("ko-KR")}</td>
                                    <td className="px-2 py-1 text-center text-muted-foreground">N</td>
                                  </tr>
                                );
                              })
                            );

                            const subtotalRow = (
                              <tr key={`sub-${group.supplierCode}`}
                                className="border-b bg-yellow-50/80 dark:bg-yellow-500/10 font-semibold">
                                <td colSpan={8} className="px-3 py-1 text-right border-r border-border text-yellow-700 dark:text-yellow-300">
                                  [소&nbsp;&nbsp;계]
                                </td>
                                <td className="px-2 py-1 text-right border-r border-border tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalQty.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-2 py-1 text-right border-r border-border">0</td>
                                <td className="px-2 py-1 text-right border-r border-border">0</td>
                                <td className="px-2 py-1 text-right border-r border-border tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalQty.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-2 py-1 border-r border-border" />
                                <td className="px-2 py-1 text-right border-r border-border tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalAmount.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-2 py-1" />
                              </tr>
                            );

                            return [...dataRows, subtotalRow];
                          })}

                          <tr className="border-t-2 border-lime-400 bg-lime-50/80 dark:bg-lime-500/10 font-bold">
                            <td colSpan={8} className="px-3 py-2 text-right border-r border-border text-lime-800 dark:text-lime-300 text-sm">
                              [합&nbsp;&nbsp;계]
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 border-r border-border" />
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalAmount.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2" />
                          </tr>
                        </>
                      )}

                      {/* ── 업체+품목 ──────────────────────────────────────── */}
                      {viewType === "업체+품목" && (
                        <>
                          {itemGroups.flatMap((group) => {
                            const dataRows = group.rows.map((row, ri) => {
                              const qColor = row.qty < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-blue-600 dark:text-blue-400";

                              return (
                                <tr key={`${group.supplierCode}-${row.itemCode}`} className="border-b hover:bg-muted/20">
                                  {ri === 0 && (
                                    <td rowSpan={group.rows.length}
                                      className={`${tdCls} align-top text-[11px]`}>
                                      <div className="font-mono">{group.supplierCode}</div>
                                      <div className="text-muted-foreground text-[10px]">{group.supplierName}</div>
                                    </td>
                                  )}
                                  <td className={`${tdCls} font-mono text-[11px]`}>{row.itemCode}</td>
                                  <td className={tdCls}>{row.itemName}</td>
                                  <td className={`${tdCls} text-muted-foreground`}></td>
                                  <td className={`${tdCls} text-muted-foreground`}></td>
                                  <td className={`${tdCls} text-center`}>{row.unit}</td>
                                  <td className={`${tdCls} text-right tabular-nums ${qColor}`}>{row.qty.toLocaleString("ko-KR")}</td>
                                  <td className={`${tdCls} text-right`}>0</td>
                                  <td className={`${tdCls} text-right`}>0</td>
                                  <td className={`${tdCls} text-right tabular-nums font-semibold ${qColor}`}>{row.qty.toLocaleString("ko-KR")}</td>
                                  <td className="px-2 py-1 text-right tabular-nums">{row.receiptAmount.toLocaleString("ko-KR")}</td>
                                </tr>
                              );
                            });

                            const subtotalRow = (
                              <tr key={`sub-${group.supplierCode}`}
                                className="border-b bg-yellow-50/80 dark:bg-yellow-500/10 font-semibold">
                                <td colSpan={6} className="px-3 py-1 text-right border-r border-border text-yellow-700 dark:text-yellow-300">
                                  [소&nbsp;&nbsp;계]
                                </td>
                                <td className="px-2 py-1 text-right border-r border-border tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalQty.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-2 py-1 text-right border-r border-border">0</td>
                                <td className="px-2 py-1 text-right border-r border-border">0</td>
                                <td className="px-2 py-1 text-right border-r border-border tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalQty.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-2 py-1 text-right tabular-nums text-yellow-700 dark:text-yellow-300">
                                  {group.totalAmount.toLocaleString("ko-KR")}
                                </td>
                              </tr>
                            );

                            return [...dataRows, subtotalRow];
                          })}

                          <tr className="border-t-2 border-lime-400 bg-lime-50/80 dark:bg-lime-500/10 font-bold">
                            <td colSpan={6} className="px-3 py-2 text-right border-r border-border text-lime-800 dark:text-lime-300 text-sm">
                              [합&nbsp;&nbsp;계]
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalAmount.toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* ── 업체집계 ────────────────────────────────────────── */}
                      {viewType === "업체집계" && (
                        <>
                          {sortedSupplierAgg.map((row) => (
                            <tr key={row.supplierCode} className="border-b hover:bg-muted/20">
                              <td className={`${tdCls} text-[11px]`}>
                                <span className="font-mono">{row.supplierCode}</span>
                                <span className="text-muted-foreground"> - {row.supplierName}</span>
                              </td>
                              <td className={`${tdCls} text-right tabular-nums ${row.qty < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                {row.qty.toLocaleString("ko-KR")}
                              </td>
                              <td className={`${tdCls} text-right`}>0</td>
                              <td className={`${tdCls} text-right`}>0</td>
                              <td className={`${tdCls} text-right tabular-nums font-semibold ${row.qty < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                {row.qty.toLocaleString("ko-KR")}
                              </td>
                              <td className="px-2 py-1 text-right tabular-nums">
                                {row.receiptAmount.toLocaleString("ko-KR")}
                              </td>
                            </tr>
                          ))}

                          <tr className="border-t-2 border-lime-400 bg-lime-50/80 dark:bg-lime-500/10 font-bold">
                            <td className="px-3 py-2 border-r border-border text-lime-800 dark:text-lime-300 text-sm">
                              [합&nbsp;&nbsp;계]
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border">0</td>
                            <td className="px-2 py-2 text-right border-r border-border tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-lime-800 dark:text-lime-300">
                              {grandTotalAmount.toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 팝업 ──────────────────────────────────────────────────────────────── */}
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

      <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">내보내기 설정</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={gridSettingsTab === "export" ? "default" : "outline"} onClick={() => setGridSettingsTab("export")}>내보내기</Button>
              <Button size="sm" variant={gridSettingsTab === "view" ? "default" : "outline"} onClick={() => setGridSettingsTab("view")}>보기</Button>
            </div>
            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">조회된 기간별 입고현황 데이터를 CSV 파일로 다운로드합니다.</p>
                <Button size="sm" onClick={handleExport} disabled={items.length === 0}>CSV 내보내기</Button>
              </div>
            )}
            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                  <Checkbox checked={stripedRows} onChange={(e) => setStripedRows(e.target.checked)} />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
