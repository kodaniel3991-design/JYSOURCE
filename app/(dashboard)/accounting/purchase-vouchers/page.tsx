"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Search, RotateCcw, FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPath } from "@/lib/api-path";
import { useSortableGrid } from "@/lib/hooks/use-sortable-grid";
import { useGridColumnSettings } from "@/lib/hooks/use-grid-column-settings";
import { GridTh } from "@/components/ui/grid-th";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type Candidate = {
  id: string;
  inputNo: string;
  supplierCode: string;
  supplierName: string;
  inputDate: string;
  totalAmount: number;
  taxAmount: number;
  totalWithTax: number;
  deptCode: string;
  deptName: string;
  summary: string;
  items: CandidateItem[];
};

type CandidateItem = {
  id: string;
  seqNo: number;
  itemCode: string;
  itemName: string;
  unit: string;
  inputQty: number;
  inputAmount: number;
  taxAmount: number;
  totalWithTax: number;
  purchaseType: string;
  purchaseAccount: string;
  purchaseAccountName: string;
};

type JournalLine = {
  seqNo: number;
  lineType: "차변" | "대변";
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNT_CODE = "15300";
const DEFAULT_ACCOUNT_NAME = "원재료";
const VAT_ACCOUNT          = { code: "13500", name: "부가세대급금" };
const PAYABLE_ACCOUNT      = { code: "25100", name: "외상매입금" };

// ── 그리드 컬럼 정의 ──────────────────────────────────────────────────────────

const CAND_COLS    = ["inputNo", "supplierName", "inputDate", "totalAmount", "taxAmount", "totalWithTax"] as const;
const CAND_HEADERS: Record<string, string> = { inputNo: "매입번호", supplierName: "공급처명", inputDate: "매입일자", totalAmount: "공급가액", taxAmount: "부가세", totalWithTax: "합계금액" };
const CAND_SORT    = new Set(["inputNo","supplierName","inputDate","totalAmount","taxAmount","totalWithTax"]);
const CAND_ALIGN: Record<string, string> = { inputNo: "text-center", inputDate: "text-center", totalAmount: "text-right", taxAmount: "text-right", totalWithTax: "text-right" };

const ITEM_COLS    = ["itemCode", "itemName", "unit", "inputQty", "inputAmount", "taxAmount", "purchaseType"] as const;
const ITEM_HEADERS: Record<string, string> = { itemCode: "품목번호", itemName: "품목명", unit: "단위", inputQty: "수량", inputAmount: "공급가액", taxAmount: "부가세", purchaseType: "매입유형" };
const ITEM_SORT    = new Set(["itemCode","itemName","unit","inputQty","inputAmount","taxAmount"]);
const ITEM_ALIGN: Record<string, string> = { unit: "text-center", inputQty: "text-right", inputAmount: "text-right", taxAmount: "text-right", purchaseType: "text-center" };

const JRNL_COLS    = ["lineType", "accountCode", "accountName", "debitAmount", "creditAmount"] as const;
const JRNL_HEADERS: Record<string, string> = { lineType: "구분", accountCode: "계정코드", accountName: "계정명", debitAmount: "차변금액", creditAmount: "대변금액" };
const JRNL_SORT    = new Set(["accountCode","accountName","debitAmount","creditAmount"]);
const JRNL_ALIGN: Record<string, string> = { lineType: "text-center", accountCode: "text-center", debitAmount: "text-right", creditAmount: "text-right" };

const PURCHASE_TYPE_LABELS: Record<string, string> = {
  "원재료": "원재료",
  "외주품": "외주품",
  "":       "(미지정)",
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const firstOfMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
const fmt = (n: number) => n.toLocaleString("ko-KR");

// ── 분개 계산 (미리보기용) ────────────────────────────────────────────────────

function buildJournalLines(candidate: Candidate): JournalLine[] {
  const lines: JournalLine[] = [];
  let seqNo = 0;

  const accountAmountMap = new Map<string, { code: string; name: string; amount: number }>();
  for (const item of candidate.items) {
    const code = item.purchaseAccount     || DEFAULT_ACCOUNT_CODE;
    const name = item.purchaseAccountName || DEFAULT_ACCOUNT_NAME;
    const prev = accountAmountMap.get(code);
    if (prev) {
      prev.amount += item.inputAmount;
    } else {
      accountAmountMap.set(code, { code, name, amount: item.inputAmount });
    }
  }

  const totalSupply  = Array.from(accountAmountMap.values()).reduce((s, v) => s + v.amount, 0);
  const taxAmount    = Math.floor(totalSupply * 0.1);
  const totalWithTax = Math.floor(totalSupply * 1.1);

  for (const { code, name, amount } of Array.from(accountAmountMap.values())) {
    lines.push({ seqNo: ++seqNo, lineType: "차변", accountCode: code, accountName: name, debitAmount: amount, creditAmount: 0 });
  }

  if (taxAmount > 0) {
    lines.push({ seqNo: ++seqNo, lineType: "차변", accountCode: VAT_ACCOUNT.code, accountName: VAT_ACCOUNT.name, debitAmount: taxAmount, creditAmount: 0 });
  }

  lines.push({ seqNo: ++seqNo, lineType: "대변", accountCode: PAYABLE_ACCOUNT.code, accountName: PAYABLE_ACCOUNT.name, debitAmount: 0, creditAmount: totalWithTax });

  return lines;
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function PurchaseVouchersPage() {
  const [search, setSearch]         = useState({ dateFrom: firstOfMonthStr(), dateTo: todayStr() });
  const [list, setList]             = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const [myFactoryCode,  setMyFactoryCode]  = useState("");
  const [myFactoryName,  setMyFactoryName]  = useState("");
  const [businessPlace,  setBusinessPlace]  = useState("");
  const [factoryOptions, setFactoryOptions] = useState<{ value: string; label: string }[]>([]);

  const searchBtnRef  = useRef<HTMLButtonElement>(null);
  const dateFromRef   = useRef<HTMLInputElement>(null);
  const dateToRef     = useRef<HTMLInputElement>(null);

  type DialogState =
    | { type: "alert";   message: string }
    | { type: "confirm"; message: string; onConfirm: () => void }
    | null;
  const [dialog, setDialog] = useState<DialogState>(null);
  const showAlert   = (msg: string) => setDialog({ type: "alert", message: msg });
  const showConfirm = (msg: string, fn: () => void) => setDialog({ type: "confirm", message: msg, onConfirm: fn });

  // 사업장 목록 + 로그인 사업장 초기화
  useEffect(() => {
    Promise.all([
      fetch(apiPath("/api/auth/me")).then((r) => r.json()),
      fetch(apiPath("/api/factories")).then((r) => r.json()),
    ]).then(([me, fd]) => {
      const myCode = me.ok ? (me.factory ?? "") : "";
      const opts: { value: string; label: string }[] = [{ value: "", label: "전체" }];
      let myName = "";
      if (fd.ok && Array.isArray(fd.factories)) {
        fd.factories.forEach((f: { FactoryCode: string; FactoryName: string }) => {
          opts.push({ value: f.FactoryCode, label: f.FactoryName });
          if (f.FactoryCode === myCode) myName = f.FactoryName;
        });
      }
      setMyFactoryCode(myCode);
      setMyFactoryName(myName);
      setFactoryOptions(opts);
      setBusinessPlace(myCode);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 목록 조회
  const loadList = useCallback(() => {
    const p = new URLSearchParams();
    if (businessPlace)   p.set("businessPlace", businessPlace);
    if (search.dateFrom) p.set("dateFrom",       search.dateFrom);
    if (search.dateTo)   p.set("dateTo",         search.dateTo);
    setLoading(true);
    fetch(apiPath(`/api/accounting/purchase-voucher-candidates?${p}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setList(d.items);
          setCheckedIds(new Set());
          setSelectedId(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, businessPlace]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCandidate = useMemo(
    () => list.find((x) => x.id === selectedId) ?? null,
    [list, selectedId]
  );

  const journalLines = useMemo(
    () => (selectedCandidate ? buildJournalLines(selectedCandidate) : []),
    [selectedCandidate]
  );

  const listTotals = useMemo(() => {
    const totalAmount = list.reduce((s, r) => s + r.totalAmount, 0);
    return {
      totalAmount,
      taxAmount:    Math.floor(totalAmount * 0.1),
      totalWithTax: Math.floor(totalAmount * 1.1),
    };
  }, [list]);

  const toggleAllChecked = () => {
    if (checkedIds.size === list.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(list.map((x) => x.id)));
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreateVouchers = async () => {
    if (checkedIds.size === 0) { showAlert("전표를 생성할 항목을 선택하세요."); return; }

    const untyped = list
      .filter((c) => checkedIds.has(c.id))
      .flatMap((c) => c.items.filter((i) => !i.purchaseType));

    if (untyped.length > 0) {
      showConfirm(
        `매입유형이 미지정된 품목이 ${untyped.length}건 있습니다.\n미지정 품목은 "원재료(15300)" 계정으로 처리됩니다.\n계속 진행하시겠습니까?`,
        () => doCreateVouchers()
      );
      return;
    }
    doCreateVouchers();
  };

  const doCreateVouchers = async () => {
    setSubmitting(true);
    try {
      const res  = await fetch(apiPath("/api/accounting/vouchers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(checkedIds).map(Number), voucherDate: todayStr() }),
      });
      const data = await res.json();
      if (!data.ok) { showAlert(data.message || "전표 생성 실패"); return; }
      showAlert(`전표 ${data.count}건이 생성되었습니다.`);
      loadList();
    } catch {
      showAlert("전표 생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 그리드 훅 ───────────────────────────────────────────────────────────────

  const { sortedItems: sortedCand, sortKey: candSortKey, sortDir: candSortDir, toggleSort: candToggleSort }
    = useSortableGrid(list);
  const { sortedItems: sortedItems_, sortKey: itemSortKey, sortDir: itemSortDir, toggleSort: itemToggleSort }
    = useSortableGrid(selectedCandidate?.items ?? []);
  const { sortedItems: sortedJrnl, sortKey: jrnlSortKey, sortDir: jrnlSortDir, toggleSort: jrnlToggleSort }
    = useSortableGrid(journalLines);

  const candCol  = useGridColumnSettings("accounting/purchase-vouchers/candidates", [...CAND_COLS]);
  const itemCol  = useGridColumnSettings("accounting/purchase-vouchers/items",      [...ITEM_COLS]);
  const jrnlCol  = useGridColumnSettings("accounting/purchase-vouchers/journal",    [...JRNL_COLS]);

  const gtp = (c: ReturnType<typeof useGridColumnSettings>) => ({
    dragKey: c.dragKey, dropTargetKey: c.dropTargetKey,
    onResizeEnd: c.resize, onDragStartKey: c.setDragKey,
    onDropKey: c.reorder, onDragEndKey: () => c.setDragKey(null),
    onDragOverKey: c.setDropTargetKey,
  });

  // ── 스타일 ──────────────────────────────────────────────────────────────────

  const TH = "bg-muted/80 text-xs font-medium text-muted-foreground border border-border px-2 py-1 whitespace-nowrap";
  const TD = "text-xs border border-border px-2 py-1 whitespace-nowrap overflow-hidden";

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <PageHeader title="매입전표 일괄생성" />

      {/* ── 검색 패널 ────────────────────────────────────────────────── */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          {/* 조건 행 */}
          <div className="flex items-end gap-3 mb-3">

            {/* 회계구분 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">회계구분</label>
              <div className="flex gap-1">
                <Input
                  value={myFactoryCode}
                  readOnly
                  className="h-7 text-xs w-12 text-center bg-muted text-muted-foreground"
                />
                <Input
                  value={myFactoryName}
                  readOnly
                  className="h-7 text-xs w-48 bg-muted text-muted-foreground"
                />
              </div>
            </div>

            {/* 매입사업장 */}
            <div className="flex flex-col gap-1 shrink-0 w-48">
              <label className="text-xs font-medium text-muted-foreground">매입사업장</label>
              <Select
                options={factoryOptions}
                value={businessPlace}
                onChange={setBusinessPlace}
                className="!h-7 !py-0.5 !px-2 !pr-7 text-xs"
              />
            </div>

            {/* 매입일자 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">매입일자</label>
              <div className="flex gap-1 items-center">
                <DateInput
                  ref={dateFromRef}
                  value={search.dateFrom}
                  onChange={(e) => setSearch((p) => ({ ...p, dateFrom: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); dateToRef.current?.focus(); } }}
                  className="h-7 text-xs w-[130px]"
                />
                <span className="text-xs text-muted-foreground shrink-0">~</span>
                <DateInput
                  ref={dateToRef}
                  value={search.dateTo}
                  onChange={(e) => setSearch((p) => ({ ...p, dateTo: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchBtnRef.current?.focus(); } }}
                  className="h-7 text-xs w-[130px]"
                />
              </div>
            </div>

          </div>

          {/* 버튼 행 */}
          <div className="flex items-center gap-2 pt-2.5 border-t">
            <Button ref={searchBtnRef} size="sm" className="h-8 px-4" onClick={loadList} disabled={loading}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadList(); } }}>
              <Search className="mr-1.5 h-3.5 w-3.5" /> 검색
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={() => setSearch({ dateFrom: firstOfMonthStr(), dateTo: todayStr() })}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 본문 ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-3 min-h-0">

        {/* 좌: 확정 매입 목록 */}
        <div className="flex flex-col w-[55%] min-w-0 border rounded-lg overflow-hidden bg-card">
          {/* 테이블 헤더 타이틀 */}
          <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium">확정 매입 목록</span>
            <span className="text-xs text-muted-foreground">
              총 <span className="font-semibold text-foreground">{list.length}</span>건
              {checkedIds.size > 0 && <> · 선택 <span className="font-semibold text-foreground">{checkedIds.size}</span>건</>}
            </span>
          </div>

          {/* 스크롤 테이블 */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs min-w-[560px]">
              <colgroup>
                <col style={{ width: 32 }} />
                {candCol.colOrder.map((k) => (
                  <col key={k} style={{ width: candCol.colWidths[k] ? `${candCol.colWidths[k]}px` : undefined }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={cn(TH, "w-8 text-center")}>
                    <input type="checkbox" className="h-3.5 w-3.5"
                      checked={list.length > 0 && checkedIds.size === list.length}
                      onChange={toggleAllChecked} />
                  </th>
                  {candCol.colOrder.map((k) => (
                    <GridTh key={k} colKey={k} {...gtp(candCol)}
                      className={cn(TH, CAND_ALIGN[k])}
                      sortKey={CAND_SORT.has(k) ? k : undefined}
                      currentSortKey={candSortKey as string | null}
                      sortDir={candSortDir}
                      onSort={(sk) => candToggleSort(sk as keyof typeof sortedCand[0])}>
                      {CAND_HEADERS[k]}
                    </GridTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={CAND_COLS.length + 1} className="text-center py-8 text-muted-foreground text-xs">조회 중...</td></tr>
                )}
                {!loading && sortedCand.length === 0 && (
                  <tr><td colSpan={CAND_COLS.length + 1} className="text-center py-8 text-muted-foreground text-xs">확정 상태의 매입 데이터가 없습니다.</td></tr>
                )}
                {!loading && sortedCand.map((row) => (
                  <tr key={row.id}
                    className={cn("cursor-pointer hover:bg-muted/40 transition-colors", selectedId === row.id && "bg-primary/10")}
                    onClick={() => setSelectedId(row.id)}>
                    <td className={cn(TD, "text-center")} onClick={(e) => { e.stopPropagation(); toggleChecked(row.id); }}>
                      <input type="checkbox" className="h-3.5 w-3.5" checked={checkedIds.has(row.id)} onChange={() => {}} />
                    </td>
                    {candCol.colOrder.map((k) => {
                      const base = cn(TD, CAND_ALIGN[k]);
                      if (k === "inputNo")       return <td key={k} className={cn(base, "font-mono")}>{row.inputNo}</td>;
                      if (k === "supplierName")   return <td key={k} className={base}>{row.supplierName}</td>;
                      if (k === "inputDate")      return <td key={k} className={base}>{row.inputDate}</td>;
                      if (k === "totalAmount")    return <td key={k} className={base}>{fmt(row.totalAmount)}</td>;
                      if (k === "taxAmount")      return <td key={k} className={base}>{fmt(Math.floor(row.totalAmount * 0.1))}</td>;
                      if (k === "totalWithTax")   return <td key={k} className={cn(base, "font-medium")}>{fmt(Math.floor(row.totalAmount * 1.1))}</td>;
                      return <td key={k} className={base} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 하단 고정바: 합계 + 버튼 */}
          <div className="shrink-0 border-t bg-muted/30 px-3 py-2 flex items-center gap-4">
            <span className="text-xs text-muted-foreground">합 계</span>
            <span className="text-xs">
              공급가액 <span className="font-semibold">{fmt(listTotals.totalAmount)}</span>
            </span>
            <span className="text-xs">
              부가세 <span className="font-semibold">{fmt(listTotals.taxAmount)}</span>
            </span>
            <span className="text-xs">
              합계금액 <span className="font-semibold text-primary">{fmt(listTotals.totalWithTax)}</span>
            </span>
            {checkedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">
                · 선택합계 <span className="font-semibold text-foreground">
                  {fmt(Math.floor(list.filter(r => checkedIds.has(r.id)).reduce((s, r) => s + r.totalAmount, 0) * 1.1))}
                </span>
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 h-8"
                disabled={checkedIds.size === 0 || submitting}
                onClick={handleCreateVouchers}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                {submitting ? "처리 중..." : `전표일괄작성 (${checkedIds.size}건)`}
              </Button>
            </div>
          </div>
        </div>

        {/* 우: 품목 상세 + 분개 미리보기 */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          {/* 품목 상세 */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mb-1 text-xs text-muted-foreground">
              {selectedCandidate
                ? `${selectedCandidate.inputNo} · ${selectedCandidate.supplierName} · ${selectedCandidate.inputDate} · ${selectedCandidate.items.length}건`
                : "좌측 목록에서 항목을 클릭하면 상세가 표시됩니다."}
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full border-collapse text-xs min-w-[480px]">
                <colgroup>
                  <col style={{ width: 32 }} />
                  {itemCol.colOrder.map((k) => (
                    <col key={k} style={{ width: itemCol.colWidths[k] ? `${itemCol.colWidths[k]}px` : undefined }} />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={cn(TH, "text-center w-8")}>No</th>
                    {itemCol.colOrder.map((k) => (
                      <GridTh key={k} colKey={k} {...gtp(itemCol)}
                        className={cn(TH, ITEM_ALIGN[k])}
                        sortKey={ITEM_SORT.has(k) ? k : undefined}
                        currentSortKey={itemSortKey as string | null}
                        sortDir={itemSortDir}
                        onSort={(sk) => itemToggleSort(sk as keyof typeof sortedItems_[0])}>
                        {ITEM_HEADERS[k]}
                      </GridTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!selectedCandidate && (
                    <tr><td colSpan={ITEM_COLS.length + 1} className="text-center py-6 text-muted-foreground text-xs">—</td></tr>
                  )}
                  {sortedItems_.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className={cn(TD, "text-center")}>{item.seqNo}</td>
                      {itemCol.colOrder.map((k) => {
                        const base = cn(TD, ITEM_ALIGN[k]);
                        if (k === "itemCode")    return <td key={k} className={cn(base, "font-mono")}>{item.itemCode}</td>;
                        if (k === "itemName")    return <td key={k} className={base}>{item.itemName}</td>;
                        if (k === "unit")        return <td key={k} className={base}>{item.unit}</td>;
                        if (k === "inputQty")    return <td key={k} className={base}>{item.inputQty.toLocaleString("ko-KR", { maximumFractionDigits: 3 })}</td>;
                        if (k === "inputAmount") return <td key={k} className={base}>{fmt(item.inputAmount)}</td>;
                        if (k === "taxAmount")   return <td key={k} className={base}>{fmt(item.taxAmount)}</td>;
                        if (k === "purchaseType") return (
                          <td key={k} className={base}>
                            <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium",
                              item.purchaseType === "원재료" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                              item.purchaseType === "외주품" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                              !item.purchaseType && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                            )}>{PURCHASE_TYPE_LABELS[item.purchaseType] ?? item.purchaseType}</span>
                          </td>
                        );
                        return <td key={k} className={base} />;
                      })}
                    </tr>
                  ))}
                </tbody>
                {selectedCandidate && selectedCandidate.items.length > 0 && (() => {
                  const totalInputAmount = selectedCandidate.items.reduce((s, i) => s + i.inputAmount, 0);
                  const totalTaxAmount   = Math.floor(totalInputAmount * 0.1);
                  return (
                    <tfoot className="sticky bottom-0 bg-yellow-50/80 dark:bg-yellow-500/10 font-semibold">
                      <tr>
                        <td className={cn(TD, "text-center border-t border-border")}>합계</td>
                        {itemCol.colOrder.map((k) => {
                          const base = cn(TD, ITEM_ALIGN[k], "border-t border-border");
                          if (k === "inputAmount") return <td key={k} className={base}>{fmt(totalInputAmount)}</td>;
                          if (k === "taxAmount")   return <td key={k} className={base}>{fmt(totalTaxAmount)}</td>;
                          return <td key={k} className="border-t border-border" />;
                        })}
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          </div>

          {/* 분개 미리보기 - 최대 4행 고정 높이 */}
          <div className="flex flex-col shrink-0" style={{ height: "175px" }}>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              분개 미리보기{selectedCandidate && ` — ${selectedCandidate.inputNo}`}
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full border-collapse text-xs">
                <colgroup>
                  <col style={{ width: 32 }} />
                  {jrnlCol.colOrder.map((k) => (
                    <col key={k} style={{ width: jrnlCol.colWidths[k] ? `${jrnlCol.colWidths[k]}px` : undefined }} />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={cn(TH, "text-center w-8")}>No</th>
                    {jrnlCol.colOrder.map((k) => (
                      <GridTh key={k} colKey={k} {...gtp(jrnlCol)}
                        className={cn(TH, JRNL_ALIGN[k])}
                        sortKey={JRNL_SORT.has(k) ? k : undefined}
                        currentSortKey={jrnlSortKey as string | null}
                        sortDir={jrnlSortDir}
                        onSort={(sk) => jrnlToggleSort(sk as keyof typeof sortedJrnl[0])}>
                        {JRNL_HEADERS[k]}
                      </GridTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedJrnl.length === 0 && (
                    <tr><td colSpan={JRNL_COLS.length + 1} className="text-center py-6 text-muted-foreground text-xs">—</td></tr>
                  )}
                  {sortedJrnl.map((line) => (
                    <tr key={line.seqNo} className="hover:bg-muted/30">
                      <td className={cn(TD, "text-center")}>{line.seqNo}</td>
                      {jrnlCol.colOrder.map((k) => {
                        const base = cn(TD, JRNL_ALIGN[k]);
                        if (k === "lineType") return (
                          <td key={k} className={base}>
                            <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold",
                              line.lineType === "차변" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            )}>{line.lineType}</span>
                          </td>
                        );
                        if (k === "accountCode")  return <td key={k} className={cn(base, "font-mono")}>{line.accountCode}</td>;
                        if (k === "accountName")  return <td key={k} className={base}>{line.accountName}</td>;
                        if (k === "debitAmount")  return <td key={k} className={cn(base, "font-medium")}>{line.debitAmount  > 0 ? fmt(line.debitAmount)  : ""}</td>;
                        if (k === "creditAmount") return <td key={k} className={cn(base, "font-medium")}>{line.creditAmount > 0 ? fmt(line.creditAmount) : ""}</td>;
                        return <td key={k} className={base} />;
                      })}
                    </tr>
                  ))}
                  {journalLines.length > 0 && (
                    <tr className="bg-muted/50 font-semibold">
                      <td colSpan={4} className={cn(TD, "text-right text-muted-foreground")}>합 계</td>
                      <td className={cn(TD, "text-right")}>{fmt(journalLines.reduce((s, l) => s + l.debitAmount, 0))}</td>
                      <td className={cn(TD, "text-right")}>{fmt(journalLines.reduce((s, l) => s + l.creditAmount, 0))}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 다이얼로그 ───────────────────────────────────────────────── */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-lg border bg-card p-5 shadow-xl">
            <p className="text-sm whitespace-pre-line">{dialog.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <Button size="sm" variant="outline" onClick={() => setDialog(null)}>취소</Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (dialog.type === "confirm") dialog.onConfirm();
                  setDialog(null);
                }}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
