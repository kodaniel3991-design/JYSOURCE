"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { formatCurrency } from "@/lib/utils";
import { Search, RotateCcw, Printer, X } from "lucide-react";
import { apiPath } from "@/lib/api-path";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type ReturnHistoryItem = {
  id: string;
  receiptNo: string;
  processedAt: string;
  type: "입고" | "반품";
  itemCode: string;
  itemName: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  lotNo: string;
  note: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  buyerName: string;
  businessPlace: string;
  unitPrice: number;
  receiptAmount: number;
  storageLocation: string;
  unit: string;
  vehicleModel: string;
  specNo: number;
};

type ReturnSlipItem = {
  seq: number;
  itemCode: string;
  itemName: string;
  specification: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  lotNo: string;
  note: string;
};

type ReturnSlip = {
  slipNo: string;
  processedAt: string;
  supplierName: string;
  buyerName: string;
  items: ReturnSlipItem[];
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function PurchaseReturnsPage() {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // ── 검색 상태 ──────────────────────────────────────────────────────────────
  const [dateFrom, setDateFrom]           = useState(firstOfMonth);
  const [dateTo, setDateTo]               = useState(todayStr);
  const [itemCode, setItemCode]           = useState("");
  const [itemName, setItemName]           = useState("");
  const [supplierCode, setSupplierCode]   = useState("");
  const [supplierName, setSupplierName]   = useState("");
  const [model, setModel]                 = useState("");

  const [isItemModalOpen, setIsItemModalOpen]         = useState(false);
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isModelPopupOpen, setIsModelPopupOpen]       = useState(false);
  const [modelList, setModelList]                     = useState<string[]>([]);
  const [modelSubSearch, setModelSubSearch]           = useState("");
  const [modelSubIdx, setModelSubIdx]                 = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);

  const refDateFrom     = useRef<HTMLInputElement>(null);
  const refDateTo       = useRef<HTMLInputElement>(null);
  const refItemCode     = useRef<HTMLInputElement>(null);
  const refSupplierCode = useRef<HTMLInputElement>(null);
  const refModel        = useRef<HTMLInputElement>(null);
  const refSearchBtn    = useRef<HTMLButtonElement>(null);

  // ── 데이터 상태 ────────────────────────────────────────────────────────────
  const [items, setItems]         = useState<ReturnHistoryItem[]>([]);
  const [totalQty, setTotalQty]   = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]     = useState(false);

  // 선택된 전표번호
  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string | null>(null);

  // 거래명세서 미리보기 슬립
  const [returnSlip, setReturnSlip] = useState<ReturnSlip | null>(null);

  // ── 모델 목록 로드 ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiPath("/api/items"))
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

  // ── 조회 ───────────────────────────────────────────────────────────────────
  const loadReturns = () => {
    const params = new URLSearchParams();
    params.set("type", "반품"); // 반품으로 고정
    if (dateFrom)            params.set("dateFrom",     dateFrom);
    if (dateTo)              params.set("dateTo",       dateTo);
    if (itemCode.trim())     params.set("itemCode",     itemCode.trim());
    if (supplierCode.trim()) params.set("supplierCode", supplierCode.trim());
    if (model.trim())        params.set("model",        model.trim());

    setLoading(true);
    setSelectedReceiptNo(null);
    fetch(apiPath(`/api/purchase-receipts/history?${params}`))
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setItems(data.items);
          setTotalQty(data.totalQty);
          setTotalAmount(data.totalAmount);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const resetSearch = () => {
    setDateFrom(firstOfMonth); setDateTo(todayStr);
    setItemCode(""); setItemName("");
    setSupplierCode(""); setSupplierName("");
    setModel("");
    setSelectedReceiptNo(null);
  };

  // ── 행 클릭 → 전표번호 선택 ───────────────────────────────────────────────
  const handleRowClick = (item: ReturnHistoryItem) => {
    setSelectedReceiptNo((prev) => prev === item.receiptNo ? null : item.receiptNo);
  };

  // ── 선택된 전표번호 그룹 ───────────────────────────────────────────────────
  const selectedGroup = useMemo(() => {
    if (!selectedReceiptNo) return [];
    return items.filter((i) => i.receiptNo === selectedReceiptNo);
  }, [items, selectedReceiptNo]);

  // ── 거래명세서 미리보기 열기 ───────────────────────────────────────────────
  const openSlipPreview = () => {
    if (selectedGroup.length === 0) return;
    const first = selectedGroup[0];
    const slip: ReturnSlip = {
      slipNo:      first.receiptNo,
      processedAt: first.processedAt,
      supplierName: first.supplierName,
      buyerName:   first.buyerName,
      items: selectedGroup.map((h, i) => ({
        seq:           i + 1,
        itemCode:      h.itemCode,
        itemName:      h.itemName,
        specification: "",
        qty:           h.qty,
        receiptDate:   h.receiptDate,
        warehouse:     h.warehouse,
        lotNo:         h.lotNo,
        note:          h.note,
      })),
    };
    setReturnSlip(slip);
  };

  // ── 인쇄 ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!returnSlip) return;
    const slip = returnSlip;

    const buildCopy = (label: string, bc: string) => {
      const minRows = 19;
      const paddedItems = [...slip.items];
      while (paddedItems.length < minRows)
        paddedItems.push({ seq: -1, itemCode: "", itemName: "", specification: "", qty: 0, receiptDate: "", warehouse: "", lotNo: "", note: "" });
      const totalQtySlip = slip.items.reduce((s, i) => s + i.qty, 0);

      const dataRows = paddedItems.map((item) => `
        <tr>
          <td class="dc" style="text-align:center">${item.receiptDate ? item.receiptDate.slice(5).replace("-", "/") : "&nbsp;"}</td>
          <td class="dc" colspan="2">${item.seq > 0 ? `${item.itemName}${item.specification ? ` / ${item.specification}` : ""}` : "&nbsp;"}</td>
          <td class="dc" style="text-align:center">${item.seq > 0 && item.qty > 0 ? "EA" : "&nbsp;"}</td>
          <td class="dc" style="text-align:right">${item.seq > 0 && item.qty > 0 ? item.qty.toLocaleString("ko-KR") : "&nbsp;"}</td>
          <td class="dc">&nbsp;</td>
          <td class="dc" colspan="2">&nbsp;</td>
          <td class="dc">&nbsp;</td>
          <td class="dc">${item.seq > 0 && item.note ? item.note : "&nbsp;"}</td>
        </tr>`).join("");

      return `
      <div class="copy" style="border:2px solid ${bc}">
        <div style="font-size:10px;color:${bc};padding:1px 4px">〈${label}〉</div>
        <table>
          <colgroup>
            <col style="width:6%"><col style="width:13%"><col style="width:12%">
            <col style="width:6%"><col style="width:8%"><col style="width:10%">
            <col style="width:9%"><col style="width:9%"><col style="width:10%">
            <col style="width:17%">
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="2" colspan="4" class="sc" style="font-size:18px;font-weight:bold;text-align:center;color:${bc};height:12mm;line-height:1.2">
                거래명세표<div style="font-size:10px;font-weight:normal;color:#dc2626;margin-top:2px">（반 품）</div>
              </td>
              <td class="sc" style="text-align:center;color:${bc}">일자</td>
              <td class="sc" colspan="2">${slip.processedAt.slice(0, 10)}</td>
              <td class="sc" style="text-align:center;color:${bc}">No</td>
              <td class="sc" colspan="2" style="font-size:9px">${slip.slipNo}</td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">공급자<br>연락처</td>
              <td class="sc" colspan="5"></td>
            </tr>
            <tr>
              <td class="sc" colspan="5" style="text-align:center;color:${bc};font-weight:bold">공 급 자</td>
              <td class="sc" colspan="5" style="text-align:center;color:${bc};font-weight:bold">공 급 받 는 자</td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">상호</td>
              <td class="sc" colspan="2">주식회사 프로큐어허브</td>
              <td class="sc" style="text-align:center;color:${bc}">성명</td>
              <td class="sc">${slip.buyerName} <span style="color:${bc}">(인)</span></td>
              <td class="sc" style="text-align:center;color:${bc}">상호</td>
              <td class="sc" colspan="2">${slip.supplierName}</td>
              <td class="sc" style="text-align:center;color:${bc}">성명</td>
              <td class="sc"><span style="color:${bc}">(인)</span></td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">주소</td>
              <td class="sc" colspan="4"></td>
              <td class="sc" style="text-align:center;color:${bc}">주소</td>
              <td class="sc" colspan="4"></td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">업태</td>
              <td class="sc"></td>
              <td class="sc" style="text-align:center;color:${bc}">종목</td>
              <td class="sc" colspan="2"></td>
              <td class="sc" style="text-align:center;color:${bc}">비고</td>
              <td class="sc" colspan="2">반품</td>
              <td class="sc" style="text-align:center;color:${bc}">인수자</td>
              <td class="sc"></td>
            </tr>
            <tr>
              <td class="hdr">월일</td>
              <td class="hdr" colspan="2">품명 / 규격</td>
              <td class="hdr">단위</td>
              <td class="hdr">수량</td>
              <td class="hdr">단가</td>
              <td class="hdr" colspan="2">공급가액</td>
              <td class="hdr">세액</td>
              <td class="hdr">비고/합계</td>
            </tr>
            ${dataRows}
            <tr>
              <td class="sc" colspan="4" style="text-align:center;font-weight:bold">합 계</td>
              <td class="sc" style="text-align:right;font-weight:bold">${totalQtySlip.toLocaleString("ko-KR")}</td>
              <td class="sc"></td>
              <td class="sc" colspan="2"></td>
              <td class="sc" style="text-align:right;color:${bc}">전 잔금</td>
              <td class="sc" style="text-align:right">₩</td>
            </tr>
            <tr>
              <td class="sc" colspan="4" style="text-align:center">메 모</td>
              <td class="sc" colspan="4"></td>
              <td class="sc" style="text-align:right;color:${bc}">총 잔금</td>
              <td class="sc" style="text-align:right">₩</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    };

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "맑은 고딕", "Malgun Gothic", sans-serif; font-size: 10px; }
  .page { width: 194mm; height: 281mm; display: flex; flex-direction: column; }
  .copy { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
  .copy table { width: 100%; border-collapse: collapse; table-layout: fixed; flex: 1; }
  .divider { height: 5mm; border-top: 2px dashed #9ca3af; flex-shrink: 0; }
  .sc { border: 1px solid currentColor; padding: 1px 4px; font-size: 10px; vertical-align: middle; }
  .dc { border: 1px dashed currentColor; padding: 1px 3px; font-size: 10px; vertical-align: middle; height: 5mm; }
  .hdr { border: 1px solid currentColor; padding: 1px 4px; font-size: 10px; vertical-align: middle; text-align: center; font-weight: bold; background-color: #f5f5f5; }
  .page-break { page-break-after: always; break-after: page; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head><body>
<div class="page">
  ${buildCopy("공급 받는 자 보관용", "#1a56db")}
  <div class="divider"></div>
  ${buildCopy("공급자 보관용", "#e02424")}
</div>
<div class="page-break"></div>
<div class="page">
  ${buildCopy("경비실용", "#16a34a")}
  <div class="divider"></div>
  ${buildCopy("품질용", "#9333ea")}
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}<\/script>
</body></html>`;

    const pw = window.open("", "_blank", "width=794,height=1200");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
  };

  // ── 미리보기 렌더 ──────────────────────────────────────────────────────────
  const renderSlipCopy = (slip: ReturnSlip, label: string, color: string) => {
    const bc = color;
    const sc = (extra?: object) =>
      ({ border: `1px solid ${bc}`, padding: "1px 4px", fontSize: "10px", verticalAlign: "middle" as const, ...extra });
    const dc = (extra?: object) =>
      ({ border: `1px dashed ${bc}`, padding: "1px 3px", fontSize: "10px", verticalAlign: "middle" as const, height: "5mm", ...extra });
    const hdr = (extra?: object) =>
      sc({ textAlign: "center" as const, color: bc, fontWeight: "bold", backgroundColor: "#f5f5f5", ...extra });

    const minRows = 22;
    const padded: ReturnSlipItem[] = [...slip.items];
    while (padded.length < minRows)
      padded.push({ seq: -1, itemCode: "", itemName: "", specification: "", qty: 0, receiptDate: "", warehouse: "", lotNo: "", note: "" });
    const totalQtySlip = slip.items.reduce((s, i) => s + i.qty, 0);

    return (
      <div className="rtn-slip-copy" style={{ border: `2px solid ${bc}`, marginBottom: "8px" }}>
        <div style={{ fontSize: "10px", color: bc, padding: "1px 4px" }}>〈{label}〉</div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "6%" }} /><col style={{ width: "13%" }} /><col style={{ width: "12%" }} />
            <col style={{ width: "6%" }} /><col style={{ width: "8%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} /><col style={{ width: "9%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} colSpan={4} style={sc({ fontSize: "18px", fontWeight: "bold", textAlign: "center" as const, color: bc, height: "44px", lineHeight: "1.2" })}>
                거래명세표
                <div style={{ fontSize: "10px", fontWeight: "normal", color: "#dc2626", marginTop: "2px" }}>（반 품）</div>
              </td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>일자</td>
              <td colSpan={2} style={sc()}>{slip.processedAt.slice(0, 10)}</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>No</td>
              <td colSpan={2} style={sc({ fontSize: "9px" })}>{slip.slipNo}</td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, fontSize: "10px", color: bc })}>공급자{"\n"}연락처</td>
              <td colSpan={5} style={sc()}></td>
            </tr>
            <tr>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 자</td>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 받 는 자</td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>주식회사 프로큐어허브</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}>{slip.buyerName} <span style={{ color: bc }}>(인)</span></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>{slip.supplierName}</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}><span style={{ color: bc }}>(인)</span></td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>업태</td>
              <td style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>종목</td>
              <td colSpan={2} style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>비고</td>
              <td colSpan={2} style={sc()}>반품</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>인수자</td>
              <td style={sc()}></td>
            </tr>
            <tr>
              <td style={hdr()}>월일</td>
              <td colSpan={2} style={hdr()}>품명 / 규격</td>
              <td style={hdr()}>단위</td>
              <td style={hdr()}>수량</td>
              <td style={hdr()}>단가</td>
              <td colSpan={2} style={hdr()}>공급가액</td>
              <td style={hdr()}>세액</td>
              <td style={hdr()}>비고/합계</td>
            </tr>
            {padded.map((item, i) => (
              <tr key={i}>
                <td style={dc({ textAlign: "center" as const })}>
                  {item.receiptDate ? item.receiptDate.slice(5).replace("-", "/") : "\u00A0"}
                </td>
                <td colSpan={2} style={dc()}>
                  {item.seq > 0 ? `${item.itemName}${item.specification ? ` / ${item.specification}` : ""}` : "\u00A0"}
                </td>
                <td style={dc({ textAlign: "center" as const })}>
                  {item.seq > 0 && item.qty > 0 ? "EA" : "\u00A0"}
                </td>
                <td style={dc({ textAlign: "right" as const })}>
                  {item.seq > 0 && item.qty > 0 ? item.qty.toLocaleString("ko-KR") : "\u00A0"}
                </td>
                <td style={dc()}>{"\u00A0"}</td>
                <td colSpan={2} style={dc()}>{"\u00A0"}</td>
                <td style={dc()}>{"\u00A0"}</td>
                <td style={dc()}>
                  {item.seq > 0 && item.note ? item.note : "\u00A0"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={sc({ textAlign: "center" as const, fontWeight: "bold" })}>합 계</td>
              <td style={sc({ textAlign: "right" as const, fontWeight: "bold" })}>{totalQtySlip.toLocaleString("ko-KR")}</td>
              <td style={sc()}>{"\u00A0"}</td>
              <td colSpan={2} style={sc()}>{"\u00A0"}</td>
              <td style={sc({ textAlign: "right" as const, color: bc })}>전 잔금</td>
              <td style={sc({ textAlign: "right" as const })}>₩</td>
            </tr>
            <tr>
              <td colSpan={4} style={sc({ textAlign: "center" as const })}>메 모</td>
              <td colSpan={4} style={sc()}>{"\u00A0"}</td>
              <td style={sc({ textAlign: "right" as const, color: bc })}>총 잔금</td>
              <td style={sc({ textAlign: "right" as const })}>₩</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
    <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 7rem)" }}>
      <PageHeader
        title="반품처리"
        description="반품 이력을 조회하고 반품 거래명세서를 재출력합니다."
      />

      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {/* 검색 패널 */}
        <Card className="shrink-0">
          <CardContent className="p-3">
            {/* 고정 입고구분 표시 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">입고구분</span>
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                반품 (고정)
              </span>
            </div>

            {/* 조건 행 */}
            <div className="flex items-end gap-3 mb-3">
              {/* 반품일자 */}
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-xs font-medium text-muted-foreground">반품일자</label>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); setIsItemModalOpen(true); }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon"
                    className="h-7 w-7 shrink-0" onClick={() => setIsItemModalOpen(true)}>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); setIsSupplierPopupOpen(true); }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon"
                    className="h-7 w-7 shrink-0" onClick={() => setIsSupplierPopupOpen(true)}>
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
                type="button"
                size="sm"
                onClick={loadReturns}
                disabled={loading}
                className="h-8 px-4"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadReturns(); } }}
              >
                <Search className="mr-1.5 h-3.5 w-3.5" />
                검색
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={resetSearch}
                className="h-8 px-3"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                필터 초기화
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedGroup.length === 0}
                onClick={openSlipPreview}
                className="h-8 px-3 ml-2"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                거래명세서 출력
              </Button>
              {selectedReceiptNo && (
                <span className="text-xs text-muted-foreground">
                  선택된 전표: <span className="font-mono font-semibold text-foreground">{selectedReceiptNo}</span>
                  ({selectedGroup.length}건)
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                총{" "}
                <span className="font-semibold text-foreground">
                  {items.length.toLocaleString("ko-KR")}
                </span>
                건이 조회되었습니다.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 모델 팝업 */}
        {isModelPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onKeyDown={(e) => { if (e.key === "Escape") { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); } }}>
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

        {/* 데이터 그리드 */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 border-b">
                  <tr>
                    <th className="px-2 py-2 text-left w-32">구매오더번호</th>
                    <th className="px-2 py-2 text-center w-10">순번</th>
                    <th className="px-2 py-2 text-center w-24">입고일자</th>
                    <th className="px-2 py-2 text-center w-36">반품일자</th>
                    <th className="px-2 py-2 text-left w-32">품목번호</th>
                    <th className="px-2 py-2 text-left">품목명</th>
                    <th className="px-2 py-2 text-center w-20">창고</th>
                    <th className="px-2 py-2 text-left w-24">저장위치</th>
                    <th className="px-2 py-2 text-center w-14">단위</th>
                    <th className="px-2 py-2 text-left w-28">모델</th>
                    <th className="px-2 py-2 text-right w-16">수량</th>
                    <th className="px-2 py-2 text-right w-20">단가</th>
                    <th className="px-2 py-2 text-right w-24">금액</th>
                    <th className="px-2 py-2 text-left w-20">거래처코드</th>
                    <th className="px-2 py-2 text-left w-28">거래처명</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={15} className="py-10 text-center text-xs text-muted-foreground">조회 중...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-10 text-center text-xs text-muted-foreground">
                        조회 조건을 입력하고 조회 버튼을 누르세요.
                      </td>
                    </tr>
                  ) : (
                    items.map((h, i) => {
                      const isSelected = h.receiptNo === selectedReceiptNo;
                      return (
                        <tr
                          key={h.id}
                          onClick={() => handleRowClick(h)}
                          className={`border-b last:border-0 cursor-pointer ${
                            isSelected
                              ? "bg-red-100 dark:bg-red-500/20"
                              : i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20 hover:bg-red-50/40 dark:hover:bg-red-500/10"
                              : "hover:bg-red-50/40 dark:hover:bg-red-500/10"
                          }`}
                        >
                          <td className="px-2 py-1 font-mono text-[11px] text-primary">{h.poNumber}</td>
                          <td className="px-2 py-1 text-center text-muted-foreground">{h.specNo || "-"}</td>
                          <td className="px-2 py-1 text-center">{h.receiptDate}</td>
                          <td className="px-2 py-1 text-center text-muted-foreground">{h.processedAt}</td>
                          <td className="px-2 py-1 font-mono">{h.itemCode}</td>
                          <td className="px-2 py-1">{h.itemName}</td>
                          <td className="px-2 py-1 text-center">{h.warehouse}</td>
                          <td className="px-2 py-1 text-muted-foreground">{h.storageLocation || "-"}</td>
                          <td className="px-2 py-1 text-center text-muted-foreground">{h.unit || "-"}</td>
                          <td className="px-2 py-1 text-muted-foreground">{h.vehicleModel || "-"}</td>
                          <td className="px-2 py-1 text-right font-semibold text-red-600 dark:text-red-400">
                            {h.qty.toLocaleString("ko-KR")}
                          </td>
                          <td className="px-2 py-1 text-right text-muted-foreground">
                            {h.unitPrice ? h.unitPrice.toLocaleString("ko-KR") : "-"}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {h.receiptAmount ? formatCurrency(h.receiptAmount) : "-"}
                          </td>
                          <td className="px-2 py-1 font-mono">{h.supplierCode}</td>
                          <td className="px-2 py-1">{h.supplierName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {items.length > 0 && (
              <div className="shrink-0 border-t bg-muted/40 px-3 py-1.5 flex gap-6 text-xs">
                <span className="text-muted-foreground">
                  총 <strong className="text-foreground">{items.length}</strong>건
                </span>
                <span className="text-muted-foreground">
                  총 수량: <strong className="text-red-600 dark:text-red-400">{totalQty.toLocaleString("ko-KR")}</strong>
                </span>
                <span className="text-muted-foreground">
                  총 금액: <strong className="text-red-600 dark:text-red-400">{formatCurrency(totalAmount)}</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* 품목 선택 모달 */}
    <ItemSelectModal
      open={isItemModalOpen}
      onOpenChange={setIsItemModalOpen}
      onSelect={(item) => {
        setItemCode(item.itemCode);
        setItemName(item.itemName);
        setIsItemModalOpen(false);
        setTimeout(() => refSupplierCode.current?.focus(), 0);
      }}
    />

    {/* 구매처 선택 팝업 */}
    <SupplierSelectPopup
      open={isSupplierPopupOpen}
      onOpenChange={setIsSupplierPopupOpen}
      onSelect={(code, name) => {
        setSupplierCode(code);
        setSupplierName(name);
        setIsSupplierPopupOpen(false);
        setTimeout(() => refModel.current?.focus(), 0);
      }}
    />

    {/* 거래명세서 미리보기 모달 */}
    {returnSlip && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onKeyDown={(e) => { if (e.key === "Escape") setReturnSlip(null); }}
      >
        <div className="bg-background rounded-lg shadow-2xl border w-full max-w-5xl flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <h2 className="text-sm font-semibold">반품 거래명세서 미리보기</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 px-4" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                인쇄 (4부)
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0"
                autoFocus
                onClick={() => setReturnSlip(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto p-4 space-y-6">
            {renderSlipCopy(returnSlip, "공급 받는 자 보관용", "#1a56db")}
            <div style={{ borderTop: "2px dashed #9ca3af", margin: "8px 0" }} />
            {renderSlipCopy(returnSlip, "공급자 보관용", "#e02424")}
            <div style={{ borderTop: "2px dashed #9ca3af", margin: "8px 0" }} />
            {renderSlipCopy(returnSlip, "경비실용", "#16a34a")}
            <div style={{ borderTop: "2px dashed #9ca3af", margin: "8px 0" }} />
            {renderSlipCopy(returnSlip, "품질용", "#9333ea")}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
