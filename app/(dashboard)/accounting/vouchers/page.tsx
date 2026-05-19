"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPath } from "@/lib/api-path";
import { useSortableGrid } from "@/lib/hooks/use-sortable-grid";
import { useGridColumnSettings } from "@/lib/hooks/use-grid-column-settings";
import { GridTh } from "@/components/ui/grid-th";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type VoucherLine = {
  lineId: string;
  seqNo: number;
  lineType: string;
  accountCode: string;
  accountName: string;
  partnerCode: string;
  partnerName: string;
  summary: string;
  debitAmount: number;
  creditAmount: number;
};

type Voucher = {
  id: string;
  voucherNo: string;
  voucherDate: string;
  supplierCode: string;
  supplierName: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  summary: string;
  sourceId: string | null;
  sourceType: string;
  deptCode: string;
  deptName: string;
  createdDate: string;
  approvedDate: string;
  approvedBy: string;
  lines: VoucherLine[];
};

// ── 유틸 ──────────────────────────────────────────────────────────────────────

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

const VAT_ACCOUNT_CODE = "13500";

const VCOLS    = ["voucherDate", "voucherNo", "sourceType", "summary", "supplierName", "totalDebit", "status"] as const;
const VHEADERS: Record<string, string> = {
  voucherDate: "전표일자", voucherNo: "전표번호", sourceType: "전표구분",
  summary: "적요", supplierName: "공급처명", totalDebit: "차변금액", status: "상태",
};
const VSORT   = new Set(["voucherDate", "voucherNo", "sourceType", "summary", "supplierName", "totalDebit"]);
const VALIGN: Record<string, string> = {
  voucherDate: "text-center", voucherNo: "text-center", totalDebit: "text-right", status: "text-center",
};

const LCOLS    = ["seqNo", "lineType", "accountCode", "accountName", "partnerCode", "partnerName", "amount", "summary"] as const;
const LHEADERS: Record<string, string> = {
  seqNo: "순번", lineType: "구분", accountCode: "계정코드", accountName: "계정명",
  partnerCode: "코드", partnerName: "거래처명", amount: "금액", summary: "적요",
};
const LSORT   = new Set(["seqNo", "accountCode", "accountName", "partnerCode", "partnerName"]);
const LALIGN: Record<string, string> = {
  seqNo: "text-center", lineType: "text-center", accountCode: "text-center",
  partnerCode: "text-center", amount: "text-right",
};

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function VouchersPage() {
  const [search, setSearch]   = useState({ dateFrom: firstOfMonthStr(), dateTo: todayStr() });
  const [list, setList]       = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const [myFactoryCode, setMyFactoryCode] = useState("");
  const [myFactoryName, setMyFactoryName] = useState("");

  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const dateFromRef  = useRef<HTMLInputElement>(null);
  const dateToRef    = useRef<HTMLInputElement>(null);

  // 사업장 초기화
  useEffect(() => {
    Promise.all([
      fetch(apiPath("/api/auth/me")).then((r) => r.json()),
      fetch(apiPath("/api/factories")).then((r) => r.json()),
    ]).then(([me, fd]) => {
      const myCode = me.ok ? (me.factory ?? "") : "";
      let myName = "";
      if (fd.ok && Array.isArray(fd.factories)) {
        const found = fd.factories.find((f: { FactoryCode: string; FactoryName: string }) => f.FactoryCode === myCode);
        if (found) myName = found.FactoryName;
      }
      setMyFactoryCode(myCode);
      setMyFactoryName(myName);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 목록 조회
  const loadList = useCallback(() => {
    const p = new URLSearchParams();
    if (search.dateFrom) p.set("dateFrom", search.dateFrom);
    if (search.dateTo)   p.set("dateTo",   search.dateTo);
    setLoading(true);
    fetch(apiPath(`/api/accounting/vouchers-management?${p}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setList(d.items);
          setSelectedId(null);
          setSelectedLineId(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택 전표 / 선택 라인
  const selectedVoucher = useMemo(
    () => list.find((v) => v.id === selectedId) ?? null,
    [list, selectedId],
  );
  const selectedLine = useMemo(
    () => selectedVoucher?.lines.find((l) => l.lineId === selectedLineId) ?? null,
    [selectedVoucher, selectedLineId],
  );

  // 부가세 라인 여부
  const isVatLine = selectedLine?.accountCode === VAT_ACCOUNT_CODE;

  // 부가세 폼에 표시할 값
  const vatFormData = useMemo(() => {
    if (!selectedVoucher) return null;
    const supply = selectedVoucher.lines
      .filter((l) => l.lineType === "차변" && l.accountCode !== VAT_ACCOUNT_CODE)
      .reduce((s, l) => s + l.debitAmount, 0);
    const tax = selectedVoucher.lines
      .find((l) => l.accountCode === VAT_ACCOUNT_CODE)?.debitAmount ?? 0;
    return { supply, tax, total: supply + tax };
  }, [selectedVoucher]);

  // 차/대변 요약
  const summary = useMemo(() => {
    if (!selectedVoucher) return { debits: [], credits: [], totalDebit: 0, totalCredit: 0 };
    const debits  = selectedVoucher.lines.filter((l) => l.lineType === "차변");
    const credits = selectedVoucher.lines.filter((l) => l.lineType === "대변");
    return {
      debits,
      credits,
      totalDebit:  debits.reduce((s, l) => s + l.debitAmount,   0),
      totalCredit: credits.reduce((s, l) => s + l.creditAmount, 0),
    };
  }, [selectedVoucher]);

  // 대차차액
  const balanceDiff = selectedVoucher
    ? selectedVoucher.totalDebit - selectedVoucher.totalCredit
    : 0;

  // ── 그리드 훅 ───────────────────────────────────────────────────────────────

  const { sortedItems: sortedVouchers, sortKey: vSortKey, sortDir: vSortDir, toggleSort: vToggleSort }
    = useSortableGrid(list);
  const { sortedItems: sortedLines, sortKey: lSortKey, sortDir: lSortDir, toggleSort: lToggleSort }
    = useSortableGrid(selectedVoucher?.lines ?? []);

  const vCol = useGridColumnSettings("accounting/vouchers/vouchers", [...VCOLS]);
  const lCol = useGridColumnSettings("accounting/vouchers/lines",    [...LCOLS]);

  const gtp = (c: ReturnType<typeof useGridColumnSettings>) => ({
    dragKey: c.dragKey, dropTargetKey: c.dropTargetKey,
    onResizeEnd: c.resize, onDragStartKey: c.setDragKey,
    onDropKey: c.reorder, onDragEndKey: () => c.setDragKey(null),
    onDragOverKey: c.setDropTargetKey,
  });

  // ── 스타일 ──────────────────────────────────────────────────────────────────

  const TH = "bg-muted/80 text-xs font-medium text-muted-foreground border border-border px-2 py-1 whitespace-nowrap";
  const TD = "text-xs border border-border px-2 py-1 whitespace-nowrap overflow-hidden";
  const LB = "text-xs font-medium text-muted-foreground";
  const FI = "h-7 text-xs bg-muted text-foreground";
  const DL = "text-[11px] text-muted-foreground w-16 shrink-0";
  const DV = "text-[11px] text-foreground flex-1 truncate";

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <PageHeader title="회계전표관리" />

      {/* ── 검색 패널 ────────────────────────────────────────────────── */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex items-end gap-3 mb-3">

            {/* 회계구분 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className={LB}>회계구분</label>
              <div className="flex gap-1">
                <Input value={myFactoryCode} readOnly className="h-7 text-xs w-12 text-center bg-muted text-muted-foreground" />
                <Input value={myFactoryName} readOnly className="h-7 text-xs w-48 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 전표일자 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className={LB}>전표일자</label>
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
            <Button
              ref={searchBtnRef}
              size="sm"
              className="h-8 px-4"
              onClick={loadList}
              disabled={loading}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadList(); } }}
            >
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

      {/* ── 스크롤 가능한 본문 영역 ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">

        {/* ── 전표 목록 (디테일 패널 + 그리드) ────────────────────── */}
        <div className="shrink-0 border rounded-lg overflow-hidden bg-card" style={{ height: 280 }}>
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-medium">전표 목록</span>
              <span className="text-xs text-muted-foreground">
                총 <span className="font-semibold text-foreground">{list.length}</span>건
              </span>
            </div>

            <div className="flex flex-1 min-h-0">

              {/* 디테일 패널 */}
              <div className="w-72 shrink-0 border-r bg-muted/10 overflow-auto p-2.5 flex flex-col">
                {!selectedVoucher ? (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-[11px] text-muted-foreground text-center">전표를 선택하면<br />상세 정보가 표시됩니다.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-1.5 py-1 border-b border-border/60">
                      <span className={DL}>전표일자</span>
                      <span className={cn(DV, "font-mono")}>{selectedVoucher.voucherDate}</span>
                    </div>
                    <div className="flex items-start gap-1.5 py-1 border-b border-border/60">
                      <span className={DL}>전표번호</span>
                      <span className={cn(DV, "font-mono")}>{selectedVoucher.voucherNo}</span>
                    </div>
                    <div className="flex items-start gap-1.5 py-1 border-b border-border/60">
                      <span className={DL}>전표구분</span>
                      <span className={DV}>{selectedVoucher.sourceType}</span>
                    </div>
                    <div className="flex items-start gap-1.5 py-1 border-b border-border/60">
                      <span className={DL}>적&nbsp;&nbsp;&nbsp;&nbsp;요</span>
                      <span className={DV}>{selectedVoucher.summary || "-"}</span>
                    </div>
                    {/* 결의번호 / 상태 */}
                    <div className="flex items-center gap-1.5 py-1 border-b border-border/60">
                      <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">결의번호/상태</span>
                      <span className={cn("text-[11px] text-foreground font-mono flex-1 truncate", selectedVoucher.status !== "승인" && "opacity-0")}>
                        {selectedVoucher.voucherNo}
                      </span>
                      <span className={cn(
                        "text-[10px] font-medium rounded px-1.5 py-0.5 shrink-0",
                        selectedVoucher.status === "승인"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      )}>
                        {selectedVoucher.status === "미승인" ? "미결" : selectedVoucher.status}
                      </span>
                    </div>
                    {/* 기표일자 / 사원 */}
                    <div className="flex items-center gap-1.5 py-1 border-b border-border/60">
                      <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">기표일자/사원</span>
                      <span className={cn("text-[11px] text-foreground font-mono shrink-0", selectedVoucher.status !== "승인" && "opacity-0")}>
                        {selectedVoucher.approvedDate}
                      </span>
                      <span className={cn("text-[11px] text-foreground flex-1 truncate ml-1", selectedVoucher.status !== "승인" && "opacity-0")}>
                        {selectedVoucher.approvedBy}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 py-1">
                      <span className={DL}>대차차액</span>
                      <span className={cn(
                        DV,
                        "font-mono font-bold tabular-nums",
                        balanceDiff !== 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-700 dark:text-green-400",
                      )}>
                        {fmt(balanceDiff)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 전표 목록 그리드 */}
              <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse text-xs min-w-[580px]">
                  <colgroup>
                    {vCol.colOrder.map((k) => (
                      <col key={k} style={{ width: vCol.colWidths[k] ? `${vCol.colWidths[k]}px` : undefined }} />
                    ))}
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr>
                      {vCol.colOrder.map((k) => (
                        <GridTh
                          key={k}
                          colKey={k}
                          {...gtp(vCol)}
                          className={cn(TH, VALIGN[k])}
                          sortKey={VSORT.has(k) ? k : undefined}
                          currentSortKey={vSortKey as string | null}
                          sortDir={vSortDir}
                          onSort={(sk) => vToggleSort(sk as keyof typeof sortedVouchers[0])}
                        >
                          {VHEADERS[k]}
                        </GridTh>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={VCOLS.length} className="text-center py-8 text-muted-foreground text-xs">조회 중...</td>
                      </tr>
                    )}
                    {!loading && sortedVouchers.length === 0 && (
                      <tr>
                        <td colSpan={VCOLS.length} className="text-center py-8 text-muted-foreground text-xs">조회된 전표가 없습니다.</td>
                      </tr>
                    )}
                    {!loading && sortedVouchers.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/40 transition-colors",
                          selectedId === row.id && "bg-primary/10",
                        )}
                        onClick={() => { setSelectedId(row.id); setSelectedLineId(null); }}
                      >
                        {vCol.colOrder.map((k) => {
                          const base = cn(TD, VALIGN[k]);
                          if (k === "voucherDate")  return <td key={k} className={base}>{row.voucherDate}</td>;
                          if (k === "voucherNo")    return <td key={k} className={cn(base, "font-mono")}>{row.voucherNo}</td>;
                          if (k === "sourceType")   return <td key={k} className={base}>{row.sourceType}</td>;
                          if (k === "summary")      return <td key={k} className={base}>{row.summary}</td>;
                          if (k === "supplierName") return <td key={k} className={base}>{row.supplierName}</td>;
                          if (k === "totalDebit")   return <td key={k} className={base}>{fmt(row.totalDebit)}</td>;
                          if (k === "status")       return (
                            <td key={k} className={base}>
                              <span className={cn(
                                "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                                row.status === "승인"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                              )}>
                                {row.status === "미승인" ? "미결" : row.status}
                              </span>
                            </td>
                          );
                          return <td key={k} className={base} />;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>

        {/* ── 분개 명세 그리드 ────────────────────────────────────── */}
        <div className="shrink-0 border rounded-lg overflow-hidden bg-card" style={{ height: 160 }}>
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-medium">분개 명세</span>
              {selectedVoucher && (
                <span className="text-xs text-muted-foreground">{selectedVoucher.voucherNo} · {selectedVoucher.supplierName}</span>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-xs min-w-[700px]">
                <colgroup>
                  {lCol.colOrder.map((k) => (
                    <col key={k} style={{ width: lCol.colWidths[k] ? `${lCol.colWidths[k]}px` : undefined }} />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    {lCol.colOrder.map((k) => (
                      <GridTh
                        key={k}
                        colKey={k}
                        {...gtp(lCol)}
                        className={cn(TH, LALIGN[k])}
                        sortKey={LSORT.has(k) ? k : undefined}
                        currentSortKey={lSortKey as string | null}
                        sortDir={lSortDir}
                        onSort={(sk) => lToggleSort(sk as keyof typeof sortedLines[0])}
                      >
                        {LHEADERS[k]}
                      </GridTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!selectedVoucher && (
                    <tr>
                      <td colSpan={LCOLS.length} className="text-center py-6 text-muted-foreground text-xs">상단 목록에서 전표를 선택하세요.</td>
                    </tr>
                  )}
                  {selectedVoucher && sortedLines.length === 0 && (
                    <tr>
                      <td colSpan={LCOLS.length} className="text-center py-6 text-muted-foreground text-xs">분개 내역이 없습니다.</td>
                    </tr>
                  )}
                  {selectedVoucher && sortedLines.map((line) => (
                    <tr
                      key={line.lineId}
                      className={cn(
                        "cursor-pointer hover:bg-muted/30 transition-colors",
                        selectedLineId === line.lineId && "bg-primary/10",
                      )}
                      onClick={() => setSelectedLineId(line.lineId)}
                    >
                      {lCol.colOrder.map((k) => {
                        const base = cn(TD, LALIGN[k]);
                        if (k === "seqNo")       return <td key={k} className={base}>{line.seqNo}</td>;
                        if (k === "lineType")    return (
                          <td key={k} className={base}>
                            <span className={cn(
                              "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                              line.lineType === "차변"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}>
                              {line.lineType === "차변" ? "D.차변" : "C.대변"}
                            </span>
                          </td>
                        );
                        if (k === "accountCode") return <td key={k} className={cn(base, "font-mono")}>{line.accountCode}</td>;
                        if (k === "accountName") return <td key={k} className={base}>{line.accountName}</td>;
                        if (k === "partnerCode") return <td key={k} className={cn(base, "font-mono")}>{line.partnerCode}</td>;
                        if (k === "partnerName") return <td key={k} className={base}>{line.partnerName}</td>;
                        if (k === "amount")      return <td key={k} className={cn(base, "font-mono")}>{fmt(line.lineType === "차변" ? line.debitAmount : line.creditAmount)}</td>;
                        if (k === "summary")     return <td key={k} className={base}>{line.summary}</td>;
                        return <td key={k} className={base} />;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 부가세 정보 ──────────────────────────────────────────── */}
        <div className="shrink-0 border rounded-lg bg-card overflow-hidden">
          <div className="shrink-0 px-3 py-2 border-b bg-muted/30">
            <span className="text-xs font-medium">부가세 정보</span>
          </div>
          <div className="p-3 grid grid-cols-3 gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>사업장구분</label>
              <Input value={isVatLine ? myFactoryName : ""} readOnly className={cn(FI, "flex-1")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>세무구분</label>
              <Input value={isVatLine ? "21" : ""} readOnly className={cn(FI, "w-12")} />
              <Input value={isVatLine ? "과세매입" : ""} readOnly className={cn(FI, "flex-1")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>신고기준일</label>
              <Input value={isVatLine ? (selectedVoucher?.voucherDate ?? "") : ""} readOnly className={cn(FI, "flex-1")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>사유/구분코드</label>
              <Input value="" readOnly className={cn(FI, "w-10")} />
              <Input value="" readOnly className={cn(FI, "flex-1")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>카드/승인번호</label>
              <Input value="" readOnly className={cn(FI, "flex-1")} />
            </div>
            <div />
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>공급가액</label>
              <Input value={isVatLine && vatFormData ? fmt(vatFormData.supply) : ""} readOnly className={cn(FI, "flex-1 text-right")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>세액</label>
              <Input value={isVatLine && vatFormData ? fmt(vatFormData.tax) : ""} readOnly className={cn(FI, "flex-1 text-right")} />
            </div>
            <div className="flex items-center gap-2">
              <label className={cn(LB, "w-24 shrink-0")}>합계</label>
              <Input value={isVatLine && vatFormData ? fmt(vatFormData.total) : ""} readOnly className={cn(FI, "flex-1 text-right font-semibold")} />
            </div>
          </div>
        </div>

        {/* ── 차/대변 요약 ─────────────────────────────────────────── */}
        <div className="shrink-0 border rounded-lg bg-card overflow-hidden">
          <div className="flex divide-x">
            <div className="flex-1 p-3">
              <table className="w-full text-xs">
                <tbody>
                  {summary.debits.map((l) => (
                    <tr key={l.lineId}>
                      <td className="py-0.5 font-mono w-16">{l.accountCode}</td>
                      <td className="py-0.5 w-24">{l.accountName}</td>
                      <td className="py-0.5 text-right font-mono pr-2">{fmt(l.debitAmount)}</td>
                      <td className="py-0.5 text-muted-foreground pl-1">/</td>
                    </tr>
                  ))}
                  {summary.debits.length === 0 && (
                    <tr><td colSpan={4} className="py-2 text-muted-foreground text-center">-</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex-1 p-3">
              <table className="w-full text-xs">
                <tbody>
                  {summary.credits.map((l) => (
                    <tr key={l.lineId}>
                      <td className="py-0.5 font-mono w-16">{l.accountCode}</td>
                      <td className="py-0.5 w-24">{l.accountName}</td>
                      <td className="py-0.5 text-right font-mono">{fmt(l.creditAmount)}</td>
                    </tr>
                  ))}
                  {summary.credits.length === 0 && (
                    <tr><td colSpan={3} className="py-2 text-muted-foreground text-center">-</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t px-3 py-2 flex divide-x">
            <div className="flex-1 flex items-center gap-4 pr-3">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">차변합계</span>
              <span className="flex-1 text-right text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                {fmt(summary.totalDebit)}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
            </div>
            <div className="flex-1 flex items-center gap-4 pl-3">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">대변합계</span>
              <span className="flex-1 text-right text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                {fmt(summary.totalCredit)}
              </span>
            </div>
          </div>
        </div>

      </div>{/* end 스크롤 영역 */}
    </div>
  );
}
