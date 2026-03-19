"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Search, RotateCcw, Save, PackageCheck, X, Printer, FileText } from "lucide-react";
import { getCommonCodes } from "@/lib/common-code-store";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type POListItem = {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  buyerName: string;
  totalAmount: number;
};

type SpecRow = {
  seq: number;
  itemCode: string;
  itemName: string;
  specification: string;
  warehouse: string;
  orderedQty: number;
  receivedQty: number;       // 기입고량
  pendingQty: number;        // 입고잔량
  inputQty: number;          // 이번 입고수량 (입력)
  returnQty: number;         // 이번 반품수량 (입력)
  receiptDate: string;       // 입고일자 (입력)
  lotNo: string;             // LOT번호 (입력)
  note: string;
};

// ── 더미 데이터 ───────────────────────────────────────────────────────────────

const dummyPoList: POListItem[] = [
  { id: "po-1", orderNumber: "PO-2026-0002", supplierId: "00002", supplierName: "일본스틸코리아",  orderDate: "2026-03-02", buyerName: "김구매",  totalAmount: 4800000 },
  { id: "po-2", orderNumber: "PO-2026-0004", supplierId: "00004", supplierName: "독일오토파츠",   orderDate: "2026-03-06", buyerName: "박담당",  totalAmount: 9200000 },
  { id: "po-3", orderNumber: "PO-2026-0005", supplierId: "00005", supplierName: "중국동력전자",   orderDate: "2026-02-28", buyerName: "임정근",  totalAmount: 3150000 },
  { id: "po-4", orderNumber: "PO-2026-0007", supplierId: "00001", supplierName: "한국정밀기어",   orderDate: "2026-03-08", buyerName: "이발주",  totalAmount: 6700000 },
  { id: "po-5", orderNumber: "PO-2026-0006", supplierId: "00006", supplierName: "현대캐스팅",     orderDate: "2026-02-20", buyerName: "김구매",  totalAmount: 2300000 },
  { id: "po-6", orderNumber: "PO-2026-0010", supplierId: "00004", supplierName: "독일오토파츠",   orderDate: "2026-03-11", buyerName: "김구매",  totalAmount: 5500000 },
];

const dummySpecMap: Record<string, SpecRow[]> = {
  "po-1": [
    { seq: 1, itemCode: "M-10021", itemName: "열연강판 SS400", specification: "t3.2×1219×2438", warehouse: "10", orderedQty: 200, receivedQty: 100, pendingQty: 100, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 2, itemCode: "M-10022", itemName: "냉연강판 SPCC",  specification: "t1.6×914×1829",  warehouse: "10", orderedQty: 150, receivedQty: 0,   pendingQty: 150, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
  "po-2": [
    { seq: 1, itemCode: "B-20011", itemName: "볼베어링 6205",  specification: "ID25 OD52 W15",  warehouse: "10", orderedQty: 500, receivedQty: 200, pendingQty: 300, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 2, itemCode: "B-20012", itemName: "테이퍼롤러 32208", specification: "ID40 OD80 W23", warehouse: "10", orderedQty: 300, receivedQty: 0,   pendingQty: 300, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 3, itemCode: "S-30001", itemName: "오일씰 TC40607",  specification: "40×60×7",        warehouse: "10", orderedQty: 1000, receivedQty: 500, pendingQty: 500, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
  "po-3": [
    { seq: 1, itemCode: "E-40031", itemName: "파워서플라이 24V", specification: "24V 5A DIN",   warehouse: "10", orderedQty: 30,  receivedQty: 10,  pendingQty: 20,  inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 2, itemCode: "E-40032", itemName: "릴레이 G2R-2",    specification: "DC24V 10A",      warehouse: "10", orderedQty: 200, receivedQty: 0,   pendingQty: 200, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
  "po-4": [
    { seq: 1, itemCode: "G-10011", itemName: "평기어 M2 Z30",  specification: "M2 Z30 B=20",   warehouse: "10", orderedQty: 100, receivedQty: 0,   pendingQty: 100, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 2, itemCode: "G-10012", itemName: "헬리컬기어 M3",  specification: "M3 Z40 α=15°",  warehouse: "10", orderedQty: 60,  receivedQty: 0,   pendingQty: 60,  inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
  "po-5": [
    { seq: 1, itemCode: "C-50011", itemName: "알루미늄 다이캐스팅 하우징", specification: "ADC12 L120×W80", warehouse: "10", orderedQty: 400, receivedQty: 400, pendingQty: 0, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
  "po-6": [
    { seq: 1, itemCode: "B-20013", itemName: "니들롤러 NK25/16", specification: "ID25 L16",    warehouse: "10", orderedQty: 800, receivedQty: 0,   pendingQty: 800, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
    { seq: 2, itemCode: "B-20014", itemName: "스러스트베어링 51108", specification: "ID40 OD60 H13", warehouse: "10", orderedQty: 200, receivedQty: 0, pendingQty: 200, inputQty: 0, returnQty: 0, receiptDate: new Date().toISOString().slice(0, 10), lotNo: "", note: "" },
  ],
};

const initialHistory: Record<string, {
  id: string; receiptNo: string; processedAt: string;
  type: "입고" | "반품";
  itemCode: string; itemName: string; qty: number;
  receiptDate: string; warehouse: string; lotNo: string; note: string;
}[]> = {
  "po-1": [
    { id: "h1-1", receiptNo: "RCV-20260310-0001", processedAt: "2026-03-10 09:15", type: "입고" as const, itemCode: "M-10021", itemName: "열연강판 SS400", qty: 60,  receiptDate: "2026-03-10", warehouse: "10", lotNo: "LOT-2603A", note: "" },
    { id: "h1-2", receiptNo: "RCV-20260310-0001", processedAt: "2026-03-10 09:15", type: "입고" as const, itemCode: "M-10022", itemName: "냉연강판 SPCC",  qty: 80,  receiptDate: "2026-03-10", warehouse: "10", lotNo: "LOT-2603B", note: "" },
    { id: "h1-3", receiptNo: "RCV-20260315-0003", processedAt: "2026-03-15 14:30", type: "입고" as const, itemCode: "M-10021", itemName: "열연강판 SS400", qty: 40,  receiptDate: "2026-03-15", warehouse: "10", lotNo: "LOT-2603C", note: "2차 입고" },
    { id: "h1-4", receiptNo: "RCV-20260315-0003", processedAt: "2026-03-15 14:30", type: "입고" as const, itemCode: "M-10022", itemName: "냉연강판 SPCC",  qty: 70,  receiptDate: "2026-03-15", warehouse: "10", lotNo: "LOT-2603D", note: "2차 입고" },
    { id: "h1-5", receiptNo: "RTN-20260317-0001", processedAt: "2026-03-17 10:00", type: "반품" as const, itemCode: "M-10021", itemName: "열연강판 SS400", qty: 20,  receiptDate: "2026-03-17", warehouse: "10", lotNo: "LOT-2603A", note: "불량 반품" },
  ],
  "po-2": [
    { id: "h2-1", receiptNo: "RCV-20260308-0002", processedAt: "2026-03-08 10:00", type: "입고" as const, itemCode: "B-20011", itemName: "볼베어링 6205",    qty: 200, receiptDate: "2026-03-08", warehouse: "10", lotNo: "LOT-2603E", note: "" },
    { id: "h2-2", receiptNo: "RCV-20260314-0004", processedAt: "2026-03-14 11:20", type: "입고" as const, itemCode: "S-30001", itemName: "오일씰 TC40607", qty: 500, receiptDate: "2026-03-14", warehouse: "10", lotNo: "LOT-2603F", note: "분할입고 1차" },
  ],
  "po-3": [
    { id: "h3-1", receiptNo: "RCV-20260305-0001", processedAt: "2026-03-05 13:45", type: "입고" as const, itemCode: "E-40031", itemName: "파워서플라이 24V", qty: 10, receiptDate: "2026-03-05", warehouse: "10", lotNo: "",          note: "긴급입고" },
  ],
  "po-4": [],
  "po-5": [
    { id: "h5-1", receiptNo: "RCV-20260301-0001", processedAt: "2026-03-01 09:00", type: "입고" as const, itemCode: "C-50011", itemName: "알루미늄 다이캐스팅 하우징", qty: 400, receiptDate: "2026-03-01", warehouse: "10", lotNo: "LOT-2602Z", note: "전량 입고" },
  ],
  "po-6": [],
};

function buildWarehouseOptions() {
  return getCommonCodes("warehouse").map((c) => ({
    value: c.code,
    label: `${c.code} ${c.name}`,
    displayLabel: c.name,
  }));
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function PurchaseReceiptsPage() {
  const warehouseOptions = useMemo(() => buildWarehouseOptions(), []);

  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchOrderNo, setSearchOrderNo]   = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo]     = useState("");

  const [selectedPoId, setSelectedPoId]     = useState<string | null>(null);
  const [specRows, setSpecRows]             = useState<SpecRow[]>([]);

  type HistoryEntry = {
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
  };
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>(initialHistory);
  const [historyItemCode, setHistoryItemCode] = useState<string | null>(null);

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
    po: POListItem;
    items: ReturnSlipItem[];
  };
  const [returnSlip, setReturnSlip] = useState<ReturnSlip | null>(null);

  // ── 발주 리스트 필터 ────────────────────────────────────────────────────────
  const filteredPoList = useMemo(() => {
    return dummyPoList.filter((po) => {
      if (searchSupplier && !po.supplierName.includes(searchSupplier) && !po.supplierId.includes(searchSupplier)) return false;
      if (searchOrderNo  && !po.orderNumber.includes(searchOrderNo))  return false;
      if (searchDateFrom && po.orderDate < searchDateFrom) return false;
      if (searchDateTo   && po.orderDate > searchDateTo)   return false;
      return true;
    });
  }, [searchSupplier, searchOrderNo, searchDateFrom, searchDateTo]);

  const selectedPo = useMemo(() => dummyPoList.find((p) => p.id === selectedPoId) ?? null, [selectedPoId]);

  // ── 발주 선택 ────────────────────────────────────────────────────────────────
  const handleSelectPo = (po: POListItem) => {
    setSelectedPoId(po.id);
    const rows = dummySpecMap[po.id] ?? [];
    // 입고잔량이 0인 행(완료)은 포함하되 inputQty는 초기화
    setSpecRows(rows.map((r) => ({ ...r, inputQty: 0 })));
  };

  // ── 입고 처리 ────────────────────────────────────────────────────────────────
  const handleReceipt = () => {
    const targets = specRows.filter((r) => r.inputQty > 0);
    if (targets.length === 0) {
      window.alert("입고수량이 1 이상인 품목이 없습니다.");
      return;
    }
    for (const r of targets) {
      if (r.inputQty > r.pendingQty) {
        window.alert(`[${r.itemCode}] 입고수량(${r.inputQty})이 입고잔량(${r.pendingQty})을 초과합니다.`);
        return;
      }
    }
    // 입고 반영 (데모: 로컬 상태 업데이트)
    setSpecRows((prev) =>
      prev.map((r) => {
        if (r.inputQty <= 0) return r;
        const newReceived = r.receivedQty + r.inputQty;
        const newPending  = r.orderedQty - newReceived;
        return { ...r, receivedQty: newReceived, pendingQty: Math.max(0, newPending) };
      })
    );

    // 히스토리 기록
    if (selectedPoId) {
      const now = new Date();
      const processedAt = now.toISOString().slice(0, 16).replace("T", " ");
      const receiptNo = `RCV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
      const entries: HistoryEntry[] = targets.map((r) => ({
        id: `${receiptNo}-${r.itemCode}`,
        receiptNo,
        processedAt,
        type: "입고" as const,
        itemCode: r.itemCode,
        itemName: r.itemName,
        qty: r.inputQty,
        receiptDate: r.receiptDate,
        warehouse: r.warehouse,
        lotNo: r.lotNo,
        note: r.note,
      }));
      setHistory((prev) => ({
        ...prev,
        [selectedPoId]: [...(prev[selectedPoId] ?? []), ...entries],
      }));
    }

    window.alert(`${targets.length}건의 입고처리가 완료되었습니다. (데모)`);
  };

  const handleReset = () => {
    setSpecRows((prev) =>
      prev.map((r) => ({
        ...r,
        inputQty: 0,
        returnQty: 0,
        pendingQty: Math.max(0, r.orderedQty - r.receivedQty),
      }))
    );
  };

  const handleReturn = () => {
    const targets = specRows.filter((r) => r.returnQty > 0);
    if (targets.length === 0) {
      window.alert("반품수량이 1 이상인 품목이 없습니다.");
      return;
    }
    for (const r of targets) {
      if (r.returnQty > r.receivedQty) {
        window.alert(`[${r.itemCode}] 반품수량(${r.returnQty})이 입고수량(${r.receivedQty})을 초과합니다.`);
        return;
      }
    }
    setSpecRows((prev) =>
      prev.map((r) => {
        if (r.returnQty <= 0) return r;
        const newReceived = r.receivedQty - r.returnQty;
        const newPending  = r.orderedQty - newReceived;
        return { ...r, receivedQty: newReceived, pendingQty: Math.max(0, newPending) };
      })
    );
    if (selectedPoId && selectedPo) {
      const now = new Date();
      const processedAt = now.toISOString().slice(0, 16).replace("T", " ");
      const slipNo = `RTN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
      const entries: HistoryEntry[] = targets.map((r) => ({
        id: `${slipNo}-${r.itemCode}`,
        receiptNo: slipNo,
        processedAt,
        type: "반품" as const,
        itemCode: r.itemCode,
        itemName: r.itemName,
        qty: r.returnQty,
        receiptDate: r.receiptDate,
        warehouse: r.warehouse,
        lotNo: r.lotNo,
        note: r.note,
      }));
      setHistory((prev) => ({
        ...prev,
        [selectedPoId]: [...(prev[selectedPoId] ?? []), ...entries],
      }));
      // 거래명세서 생성
      setReturnSlip({
        slipNo,
        processedAt,
        po: selectedPo,
        items: targets.map((r, i) => ({
          seq: i + 1,
          itemCode: r.itemCode,
          itemName: r.itemName,
          specification: r.specification,
          qty: r.returnQty,
          receiptDate: r.receiptDate,
          warehouse: r.warehouse,
          lotNo: r.lotNo,
          note: r.note,
        })),
      });
    }
  };

  const updateRow = <K extends keyof SpecRow>(idx: number, field: K, value: SpecRow[K]) => {
    setSpecRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const fieldLabelClass = "bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground";

  const modalItemHistory = historyItemCode && selectedPoId
    ? (history[selectedPoId] ?? []).filter((h) => h.itemCode === historyItemCode)
    : [];
  const modalItemName = modalItemHistory[0]?.itemName ?? historyItemCode ?? "";
  const modalTotalQty = modalItemHistory.reduce((s, h) => s + h.qty, 0);

  const handlePrint = () => {
    if (!returnSlip) return;
    const slip = returnSlip;

    const buildCopy = (label: string, bc: string) => {
      const minRows = 19;
      const items = [...slip.items];
      while (items.length < minRows)
        items.push({ seq: -1, itemCode: "", itemName: "", specification: "", qty: 0, receiptDate: "", warehouse: "", lotNo: "", note: "" });
      const totalQty = slip.items.reduce((s, i) => s + i.qty, 0);

      const dataRows = items.map((item) => `
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
              <td class="sc">${slip.po.buyerName} <span style="color:${bc}">(인)</span></td>
              <td class="sc" style="text-align:center;color:${bc}">상호</td>
              <td class="sc" colspan="2">${slip.po.supplierName}</td>
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
              <td class="sc" style="text-align:right;font-weight:bold">${totalQty.toLocaleString("ko-KR")}</td>
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
  .copy:first-child .sc, .copy:first-child .dc, .copy:first-child .hdr { color: #1a56db; border-color: #1a56db; }
  .copy:last-child .sc, .copy:last-child .dc, .copy:last-child .hdr { color: #e02424; border-color: #e02424; }
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
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}<\/script>
</body></html>`;

    const pw = window.open("", "_blank", "width=794,height=1200");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
  };

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

    const totalQty = slip.items.reduce((s, i) => s + i.qty, 0);

    return (
      <div className="rtn-slip-copy" style={{ border: `2px solid ${bc}`, marginBottom: "8px" }}>
        <div style={{ fontSize: "10px", color: bc, padding: "1px 4px" }}>〈{label}〉</div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <tbody>
            {/* 제목 행 1 */}
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
            {/* 제목 행 2 */}
            <tr>
              <td style={sc({ textAlign: "center" as const, fontSize: "10px", color: bc })}>공급자{"\n"}연락처</td>
              <td colSpan={5} style={sc()}></td>
            </tr>
            {/* 공급자 / 공급받는자 헤더 */}
            <tr>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 자</td>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 받 는 자</td>
            </tr>
            {/* 상호/성명 */}
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>주식회사 프로큐어허브</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}>{slip.po.buyerName} <span style={{ color: bc }}>(인)</span></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>{slip.po.supplierName}</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}><span style={{ color: bc }}>(인)</span></td>
            </tr>
            {/* 주소 */}
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
            </tr>
            {/* 업태/종목/비고/인수자 */}
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
            {/* 컬럼 헤더 */}
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
            {/* 데이터 행 */}
            {padded.map((item, i) => (
              <tr key={i} className="data-row">
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
            {/* 합계 */}
            <tr>
              <td colSpan={4} style={sc({ textAlign: "center" as const, fontWeight: "bold" })}>합 계</td>
              <td style={sc({ textAlign: "right" as const, fontWeight: "bold" })}>{totalQty.toLocaleString("ko-KR")}</td>
              <td style={sc()}>{"\u00A0"}</td>
              <td colSpan={2} style={sc()}>{"\u00A0"}</td>
              <td style={sc({ textAlign: "right" as const, color: bc })}>전 잔금</td>
              <td style={sc({ textAlign: "right" as const })}>₩</td>
            </tr>
            {/* 메모 */}
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
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 7rem)" }}>
      <PageHeader
        title="구매입고처리"
        description="발주된 구매오더를 선택하고 실입고 수량을 입력하여 입고처리합니다."
      />

      <div className="flex flex-1 min-h-0 gap-4">
        {/* ── 왼쪽: 발주 리스트 ── */}
        <Card className="w-[346px] shrink-0 flex flex-col min-h-0">
          <CardHeader className="p-3 pb-2 shrink-0 border-b">
            <p className="text-xs font-semibold text-muted-foreground">발주 목록 (발주 상태)</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Input
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                placeholder="구매처 검색"
                className="h-7 text-xs"
              />
              <Input
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                placeholder="발주번호 검색"
                className="h-7 text-xs"
              />
              <div className="flex gap-1 items-center">
                <Input type="date" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} className="h-7 text-xs flex-1" />
                <span className="text-xs text-muted-foreground">~</span>
                <Input type="date" value={searchDateTo}   onChange={(e) => setSearchDateTo(e.target.value)}   className="h-7 text-xs flex-1" />
              </div>
              <Button
                type="button" size="sm" variant="outline"
                className="h-7 text-xs w-full"
                onClick={() => { setSearchSupplier(""); setSearchOrderNo(""); setSearchDateFrom(""); setSearchDateTo(""); }}
              >
                <RotateCcw className="mr-1 h-3 w-3" />초기화
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto min-h-0">
            {filteredPoList.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">조건에 맞는 발주가 없습니다.</p>
            ) : (
              <div className="flex flex-col">
                {filteredPoList.map((po) => {
                  const isActive = po.id === selectedPoId;
                  return (
                    <button
                      key={po.id}
                      type="button"
                      onClick={() => handleSelectPo(po)}
                      className={`flex flex-col gap-0.5 border-b px-3 py-2.5 text-left text-xs transition-colors last:border-0 ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-semibold text-[11px]">{po.orderNumber}</span>
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">발주</Badge>
                      </div>
                      <span className="font-medium">{po.supplierName}</span>
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>{po.orderDate}</span>
                        <span>{formatCurrency(po.totalAmount)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 오른쪽: 입고처리 상세 ── */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="p-3 pb-2 shrink-0 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-4 w-4 text-primary" />
                {selectedPo ? (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold">{selectedPo.orderNumber}</span>
                    <span>{selectedPo.supplierName}</span>
                    <span className="text-muted-foreground">{selectedPo.orderDate}</span>
                    <span className="text-muted-foreground">담당: {selectedPo.buyerName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">좌측 목록에서 발주를 선택하세요.</span>
                )}
              </div>
              {selectedPo && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs h-8">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />초기화
                  </Button>
                  <Button type="button" size="sm" onClick={handleReceipt}
                    className="text-xs h-8">
                    <Save className="mr-1.5 h-3.5 w-3.5" />입고처리
                  </Button>
                  <Button type="button" size="sm" onClick={handleReturn}
                    className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />반품처리
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            {!selectedPo ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">발주 목록에서 항목을 선택하면 입고처리 화면이 표시됩니다.</p>
              </div>
            ) : (
              <>
                {/* ── 상단: 입고처리 그리드 (고정 높이) ── */}
                <div className="overflow-auto shrink-0 border-b" style={{ maxHeight: "45%" }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 border-b">
                      <tr>
                        <th className="px-2 py-2 text-center w-8">No.</th>
                        <th className="px-2 py-2 text-left w-24">품목번호</th>
                        <th className="px-2 py-2 text-left">품목명</th>
                        <th className="px-2 py-2 text-left w-28">규격</th>
                        <th className="px-2 py-2 text-right w-16">발주량</th>
                        <th className="px-2 py-2 text-right w-16">입고잔량</th>
                        <th className="px-2 py-2 text-center w-20 bg-amber-50">입고수량</th>
                        <th className="px-2 py-2 text-center w-20 bg-red-50">반품수량</th>
                        <th className="px-2 py-2 text-center w-32 bg-amber-50">입고일자</th>
                        <th className="px-2 py-2 text-center w-28 bg-amber-50">창고</th>
                        <th className="px-2 py-2 text-center w-24 bg-amber-50">LOT번호</th>
                        <th className="px-2 py-2 text-left w-24 bg-amber-50">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specRows.map((row, idx) => {
                        const isComplete = row.pendingQty === 0;
                        return (
                          <tr key={idx} className={`border-b last:border-0 ${isComplete ? "bg-green-50/60" : ""}`}>
                            <td className="px-2 py-1 text-center text-muted-foreground">{row.seq}</td>
                            <td className="px-2 py-1 font-mono">{row.itemCode}</td>
                            <td className="px-2 py-1 font-medium">{row.itemName}</td>
                            <td className="px-2 py-1 text-muted-foreground">{row.specification}</td>
                            <td className="px-2 py-1 text-right">{row.orderedQty.toLocaleString("ko-KR")}</td>
                            <td className={`px-2 py-1 text-right font-semibold ${isComplete ? "text-green-600" : "text-orange-500"}`}>
                              {isComplete ? "완료" : row.pendingQty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-1 py-1 bg-amber-50">
                              <Input
                                inputMode="numeric"
                                disabled={isComplete}
                                value={row.inputQty > 0 ? row.inputQty.toLocaleString("ko-KR") : ""}
                                placeholder="0"
                                onChange={(e) => {
                                  const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                  updateRow(idx, "inputQty", v);
                                }}
                                className="h-6 w-full text-xs text-right px-1 disabled:opacity-40"
                              />
                            </td>
                            <td className="px-1 py-1 bg-red-50">
                              <Input
                                inputMode="numeric"
                                disabled={row.receivedQty === 0}
                                value={row.returnQty > 0 ? row.returnQty.toLocaleString("ko-KR") : ""}
                                placeholder="0"
                                onChange={(e) => {
                                  const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                  updateRow(idx, "returnQty", v);
                                }}
                                className="h-6 w-full text-xs text-right px-1 disabled:opacity-40"
                              />
                            </td>
                            <td className="px-1 py-1 bg-amber-50">
                              <Input
                                type="date"
                                disabled={isComplete}
                                value={row.receiptDate}
                                onChange={(e) => updateRow(idx, "receiptDate", e.target.value)}
                                className="h-6 w-full text-xs px-1 disabled:opacity-40"
                              />
                            </td>
                            <td className="px-1 py-1 bg-amber-50">
                              <Select
                                options={warehouseOptions}
                                value={row.warehouse}
                                onChange={(v) => updateRow(idx, "warehouse", v)}
                                disabled={isComplete}
                                placeholder="창고선택"
                                className="h-6 text-xs"
                              />
                            </td>
                            <td className="px-1 py-1 bg-amber-50">
                              <Input
                                disabled={isComplete}
                                value={row.lotNo}
                                onChange={(e) => updateRow(idx, "lotNo", e.target.value)}
                                placeholder="LOT"
                                className="h-6 w-full text-xs px-1 disabled:opacity-40"
                              />
                            </td>
                            <td className="px-1 py-1 bg-amber-50">
                              <Input
                                disabled={isComplete}
                                value={row.note}
                                onChange={(e) => updateRow(idx, "note", e.target.value)}
                                className="h-6 w-full text-xs px-1 disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── 하단: 입고 히스토리 ── */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 shrink-0">
                    <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">입고 히스토리</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      총 {(history[selectedPoId ?? ""] ?? []).length}건
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    {(history[selectedPoId ?? ""] ?? []).length === 0 ? (
                      <p className="p-4 text-center text-xs text-muted-foreground">아직 처리된 입고 내역이 없습니다.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted/60 border-b">
                          <tr>
                            <th className="px-2 py-1.5 text-center w-14">구분</th>
                            <th className="px-2 py-1.5 text-left w-32">전표번호</th>
                            <th className="px-2 py-1.5 text-left w-32">처리일시</th>
                            <th className="px-2 py-1.5 text-left w-24">품목번호</th>
                            <th className="px-2 py-1.5 text-left">품목명</th>
                            <th className="px-2 py-1.5 text-right w-16">수량</th>
                            <th className="px-2 py-1.5 text-center w-24">입고일자</th>
                            <th className="px-2 py-1.5 text-center w-24">창고</th>
                            <th className="px-2 py-1.5 text-left w-24">LOT번호</th>
                            <th className="px-2 py-1.5 text-left w-24">비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(history[selectedPoId ?? ""] ?? []).map((h, i) => (
                            <tr
                              key={h.id}
                              className={`border-b last:border-0 cursor-pointer hover:bg-primary/5 ${h.type === "반품" ? "bg-red-50/40" : i % 2 === 1 ? "bg-slate-50/60" : ""}`}
                              onClick={() => setHistoryItemCode(h.itemCode)}
                            >
                              <td className="px-2 py-1 text-center">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                  {h.type}
                                </span>
                              </td>
                              <td className="px-2 py-1 font-mono text-[11px] text-primary">{h.receiptNo}</td>
                              <td className="px-2 py-1 text-muted-foreground">{h.processedAt}</td>
                              <td className="px-2 py-1 font-mono">{h.itemCode}</td>
                              <td className="px-2 py-1">{h.itemName}</td>
                              <td className={`px-2 py-1 text-right font-semibold ${h.type === "반품" ? "text-red-600" : "text-blue-600"}`}>{h.qty.toLocaleString("ko-KR")}</td>
                              <td className="px-2 py-1 text-center">{h.receiptDate}</td>
                              <td className="px-2 py-1 text-center">{h.warehouse}</td>
                              <td className="px-2 py-1">{h.lotNo || "-"}</td>
                              <td className="px-2 py-1 text-muted-foreground">{h.note || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* 반품 거래명세서 모달 */}
    {returnSlip && (
      <>
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            * { visibility: hidden; }
            #rtn-slip-print-area, #rtn-slip-print-area * { visibility: visible; }
            #rtn-slip-print-area {
              position: fixed; top: 0; left: 0;
              width: 210mm; height: 297mm;
              padding: 8mm; box-sizing: border-box;
              background: white;
            }
            .rtn-slip-copy {
              height: 138mm;
              overflow: hidden;
              display: block;
              margin-bottom: 0 !important;
            }
            .rtn-slip-divider {
              display: block;
              height: 5mm !important;
              margin: 0 !important;
              border-top: 2px dashed #9ca3af;
            }
          }
        `}</style>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: "720px", maxHeight: "95vh" }}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white rounded-t-lg shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-semibold">반품 거래명세서 — {returnSlip.slipNo}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm"
                  className="text-white hover:bg-gray-700 text-xs h-7"
                  onClick={handlePrint}>
                  <Printer className="mr-1 h-3.5 w-3.5" />인쇄
                </Button>
                <Button type="button" variant="ghost" size="icon"
                  className="text-white hover:bg-gray-700 h-7 w-7"
                  onClick={() => setReturnSlip(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* 명세서 본문 */}
            <div className="flex-1 overflow-auto p-4">
              <div id="rtn-slip-print-area" style={{ display: "flex", flexDirection: "column" }}>
                {renderSlipCopy(returnSlip, "공급 받는 자 보관용", "#1a56db")}
                <div className="rtn-slip-divider" style={{ borderTop: "2px dashed #9ca3af", margin: "4px 0" }} />
                {renderSlipCopy(returnSlip, "공급자 보관용", "#e02424")}
              </div>
            </div>
            {/* 하단 버튼 */}
            <div className="flex justify-end gap-2 px-4 py-2 border-t shrink-0">
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setReturnSlip(null)}>닫기</Button>
              <Button type="button" size="sm" className="text-xs bg-gray-800 hover:bg-gray-900 text-white" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />인쇄
              </Button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* 품목별 히스토리 모달 */}

    {historyItemCode && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-3xl rounded-lg bg-background shadow-lg flex flex-col" style={{ maxHeight: "70vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div>
              <h2 className="text-sm font-semibold">{historyItemCode} — {modalItemName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                총 입고횟수 <strong>{modalItemHistory.length}회</strong> · 누적 입고수량 <strong className="text-blue-600">{modalTotalQty.toLocaleString("ko-KR")}</strong>
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setHistoryItemCode(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {modalItemHistory.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">해당 품목의 입고 내역이 없습니다.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/70 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">No.</th>
                    <th className="px-3 py-2 text-center w-14">구분</th>
                    <th className="px-3 py-2 text-left w-36">전표번호</th>
                    <th className="px-3 py-2 text-left w-36">처리일시</th>
                    <th className="px-3 py-2 text-right w-20">수량</th>
                    <th className="px-3 py-2 text-center w-28">입고일자</th>
                    <th className="px-3 py-2 text-center w-24">창고</th>
                    <th className="px-3 py-2 text-left w-24">LOT번호</th>
                    <th className="px-3 py-2 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {modalItemHistory.map((h, i) => (
                    <tr key={h.id} className={`border-b last:border-0 ${h.type === "반품" ? "bg-red-50/40" : i % 2 === 1 ? "bg-slate-50/60" : ""}`}>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-primary">{h.receiptNo}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.processedAt}</td>
                      <td className={`px-3 py-1.5 text-right font-semibold ${h.type === "반품" ? "text-red-600" : "text-blue-600"}`}>{h.qty.toLocaleString("ko-KR")}</td>
                      <td className="px-3 py-1.5 text-center">{h.receiptDate}</td>
                      <td className="px-3 py-1.5 text-center">{h.warehouse}</td>
                      <td className="px-3 py-1.5">{h.lotNo || "-"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-muted/80 border-t">
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 text-right font-semibold text-xs">합계</td>
                    <td className="px-3 py-1.5 text-right font-bold text-blue-700">{modalTotalQty.toLocaleString("ko-KR")}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
