"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Search, RotateCcw, CheckCircle, XCircle } from "lucide-react";
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

const VA_VCOLS    = ["voucherDate","voucherNo","summary","supplierName","totalDebit","status"] as const;
const VA_VHEADERS: Record<string, string> = { voucherDate: "전표일자", voucherNo: "전표번호", summary: "적요", supplierName: "공급처명", totalDebit: "차변금액", status: "상태" };
const VA_VSORT    = new Set(["voucherDate","voucherNo","summary","supplierName","totalDebit"]);
const VA_VALIGN: Record<string, string>  = { voucherDate: "text-center", voucherNo: "text-center", totalDebit: "text-right", status: "text-center" };

const VA_LCOLS    = ["seqNo","lineType","accountCode","accountName","partnerCode","partnerName","amount","summary"] as const;
const VA_LHEADERS: Record<string, string> = { seqNo: "순번", lineType: "구분", accountCode: "계정코드", accountName: "계정명", partnerCode: "코드", partnerName: "거래처명", amount: "금액", summary: "적요" };
const VA_LSORT    = new Set(["seqNo","accountCode","accountName","partnerCode","partnerName"]);
const VA_LALIGN: Record<string, string>  = { seqNo: "text-center", lineType: "text-center", accountCode: "text-center", partnerCode: "text-center", amount: "text-right" };

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function VoucherApprovalPage() {
  const [search, setSearch]   = useState({ dateFrom: firstOfMonthStr(), dateTo: todayStr(), status: "미결" });
  const [list, setList]       = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [checkedIds,    setCheckedIds]    = useState<Set<string>>(new Set());
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const [myFactoryCode, setMyFactoryCode] = useState("");
  const [myFactoryName, setMyFactoryName] = useState("");
  const [businessPlace, setBusinessPlace] = useState("");

  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const dateFromRef  = useRef<HTMLInputElement>(null);
  const dateToRef    = useRef<HTMLInputElement>(null);

  type DialogState =
    | { type: "alert";   message: string }
    | { type: "confirm"; message: string; onConfirm: () => void }
    | null;
  const [dialog, setDialog] = useState<DialogState>(null);
  const showAlert   = (msg: string) => setDialog({ type: "alert",   message: msg });
  const showConfirm = (msg: string, fn: () => void) => setDialog({ type: "confirm", message: msg, onConfirm: fn });

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
      setBusinessPlace(myCode);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 목록 조회
  const loadList = useCallback(() => {
    const p = new URLSearchParams();
    if (businessPlace)   p.set("businessPlace", businessPlace);
    if (search.dateFrom) p.set("dateFrom",      search.dateFrom);
    if (search.dateTo)   p.set("dateTo",         search.dateTo);
    if (search.status)   p.set("status",         search.status);
    setLoading(true);
    fetch(apiPath(`/api/accounting/voucher-approval?${p}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setList(d.items);
          setCheckedIds(new Set());
          setSelectedId(null);
          setSelectedLineId(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, businessPlace]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택 전표 / 선택 라인
  const selectedVoucher = useMemo(() => list.find((v) => v.id === selectedId) ?? null, [list, selectedId]);
  const selectedLine    = useMemo(
    () => selectedVoucher?.lines.find((l) => l.lineId === selectedLineId) ?? null,
    [selectedVoucher, selectedLineId]
  );

  // 부가세 라인 여부
  const isVatLine = selectedLine?.accountCode === VAT_ACCOUNT_CODE;

  // 부가세 폼에 표시할 값 (선택 전표 기준)
  const vatFormData = useMemo(() => {
    if (!selectedVoucher) return null;
    const supply = selectedVoucher.lines
      .filter((l) => l.lineType === "차변" && l.accountCode !== VAT_ACCOUNT_CODE)
      .reduce((s, l) => s + l.debitAmount, 0);
    const tax = selectedVoucher.lines
      .find((l) => l.accountCode === VAT_ACCOUNT_CODE)?.debitAmount ?? 0;
    return { supply, tax, total: supply + tax };
  }, [selectedVoucher]);

  // 차/대변 요약 (선택 전표 기준)
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

  // 체크박스
  const toggleAll    = () => {
    if (checkedIds.size === list.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(list.map((v) => v.id)));
  };
  const toggleCheck  = (id: string) => setCheckedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // 승인 / 해제
  const doAction = async (action: "승인" | "해제") => {
    if (checkedIds.size === 0) { showAlert(`처리할 전표를 선택하세요.`); return; }
    showConfirm(
      `선택한 ${checkedIds.size}건을 ${action} 처리하시겠습니까?`,
      async () => {
        setSubmitting(true);
        try {
          const res  = await fetch(apiPath("/api/accounting/voucher-approval"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(checkedIds), action }),
          });
          const data = await res.json();
          if (!data.ok) { showAlert(data.message || "처리 실패"); return; }
          showAlert(`${data.count}건이 ${action} 처리되었습니다.`);
          loadList();
        } catch {
          showAlert("처리 중 오류가 발생했습니다.");
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  // ── 그리드 훅 ───────────────────────────────────────────────────────────────

  const { sortedItems: sortedVouchers, sortKey: vSortKey, sortDir: vSortDir, toggleSort: vToggleSort }
    = useSortableGrid(list);
  const { sortedItems: sortedLines, sortKey: lSortKey, sortDir: lSortDir, toggleSort: lToggleSort }
    = useSortableGrid(selectedVoucher?.lines ?? []);

  const vaVCol = useGridColumnSettings("accounting/voucher-approval/vouchers", [...VA_VCOLS]);
  const vaLCol = useGridColumnSettings("accounting/voucher-approval/lines",    [...VA_LCOLS]);

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

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <PageHeader title="전표승인 및 해제관리" />

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

            {/* 진행상태 radio */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className={LB}>진행상태</label>
              <div className="flex items-center gap-4 h-7">
                {(["미결", "승인"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="approvalStatus"
                      value={s}
                      checked={search.status === s}
                      onChange={() => setSearch((p) => ({ ...p, status: s }))}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span className="text-xs">{s}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* 버튼 행 */}
          <div className="flex items-center gap-2 pt-2.5 border-t">
            <Button ref={searchBtnRef} size="sm" className="h-8 px-4" onClick={loadList} disabled={loading}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadList(); } }}>
              <Search className="mr-1.5 h-3.5 w-3.5" /> 검색
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-3"
              onClick={() => setSearch({ dateFrom: firstOfMonthStr(), dateTo: todayStr(), status: "미결" })}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 필터 초기화
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setCheckedIds(new Set(list.map((v) => v.id)))}>
              전체선택
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setCheckedIds(new Set())}>
              선택취소
            </Button>
            <Button size="sm" className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => doAction("승인")} disabled={submitting}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> 승인
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-4 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
              onClick={() => doAction("해제")} disabled={submitting}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> 해제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 스크롤 가능한 본문 영역 ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">

      {/* ── 전표 목록 그리드 ────────────────────────────────────────── */}
      <div className="shrink-0 border rounded-lg overflow-hidden bg-card" style={{ height: 220 }}>
        <div className="flex flex-col h-full">
          <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium">전표 목록</span>
            <span className="text-xs text-muted-foreground">
              총 <span className="font-semibold text-foreground">{list.length}</span>건
              {checkedIds.size > 0 && <> · 선택 <span className="font-semibold text-foreground">{checkedIds.size}</span>건</>}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs min-w-[600px]">
              <colgroup>
                <col style={{ width: 32 }} />
                {vaVCol.colOrder.map((k) => (
                  <col key={k} style={{ width: vaVCol.colWidths[k] ? `${vaVCol.colWidths[k]}px` : undefined }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={cn(TH, "w-8 text-center")}>
                    <input type="checkbox" className="h-3.5 w-3.5"
                      checked={list.length > 0 && checkedIds.size === list.length}
                      onChange={toggleAll} />
                  </th>
                  {vaVCol.colOrder.map((k) => (
                    <GridTh key={k} colKey={k} {...gtp(vaVCol)}
                      className={cn(TH, VA_VALIGN[k])}
                      sortKey={VA_VSORT.has(k) ? k : undefined}
                      currentSortKey={vSortKey as string | null}
                      sortDir={vSortDir}
                      onSort={(sk) => vToggleSort(sk as keyof typeof sortedVouchers[0])}>
                      {VA_VHEADERS[k]}
                    </GridTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={VA_VCOLS.length + 1} className="text-center py-8 text-muted-foreground text-xs">조회 중...</td></tr>
                )}
                {!loading && sortedVouchers.length === 0 && (
                  <tr><td colSpan={VA_VCOLS.length + 1} className="text-center py-8 text-muted-foreground text-xs">조회된 전표가 없습니다.</td></tr>
                )}
                {!loading && sortedVouchers.map((row) => (
                  <tr key={row.id}
                    className={cn("cursor-pointer hover:bg-muted/40 transition-colors", selectedId === row.id && "bg-primary/10")}
                    onClick={() => { setSelectedId(row.id); setSelectedLineId(null); }}>
                    <td className={cn(TD, "text-center")} onClick={(e) => { e.stopPropagation(); toggleCheck(row.id); }}>
                      <input type="checkbox" className="h-3.5 w-3.5" checked={checkedIds.has(row.id)} onChange={() => {}} />
                    </td>
                    {vaVCol.colOrder.map((k) => {
                      const base = cn(TD, VA_VALIGN[k]);
                      if (k === "voucherDate")  return <td key={k} className={base}>{row.voucherDate}</td>;
                      if (k === "voucherNo")    return <td key={k} className={cn(base, "font-mono")}>{row.voucherNo}</td>;
                      if (k === "summary")      return <td key={k} className={base}>{row.summary}</td>;
                      if (k === "supplierName") return <td key={k} className={base}>{row.supplierName}</td>;
                      if (k === "totalDebit")   return <td key={k} className={base}>{fmt(row.totalDebit)}</td>;
                      if (k === "status")       return (
                        <td key={k} className={base}>
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                            row.status === "승인" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                 : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>{row.status === "미승인" ? "미결" : row.status}</span>
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

      {/* ── 분개 명세 그리드 ────────────────────────────────────────── */}
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
                {vaLCol.colOrder.map((k) => (
                  <col key={k} style={{ width: vaLCol.colWidths[k] ? `${vaLCol.colWidths[k]}px` : undefined }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  {vaLCol.colOrder.map((k) => (
                    <GridTh key={k} colKey={k} {...gtp(vaLCol)}
                      className={cn(TH, VA_LALIGN[k])}
                      sortKey={VA_LSORT.has(k) ? k : undefined}
                      currentSortKey={lSortKey as string | null}
                      sortDir={lSortDir}
                      onSort={(sk) => lToggleSort(sk as keyof typeof sortedLines[0])}>
                      {VA_LHEADERS[k]}
                    </GridTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!selectedVoucher && (
                  <tr><td colSpan={VA_LCOLS.length} className="text-center py-6 text-muted-foreground text-xs">상단 목록에서 전표를 선택하세요.</td></tr>
                )}
                {selectedVoucher && sortedLines.length === 0 && (
                  <tr><td colSpan={VA_LCOLS.length} className="text-center py-6 text-muted-foreground text-xs">분개 내역이 없습니다.</td></tr>
                )}
                {selectedVoucher && sortedLines.map((line) => (
                  <tr key={line.lineId}
                    className={cn("cursor-pointer hover:bg-muted/30 transition-colors", selectedLineId === line.lineId && "bg-primary/10")}
                    onClick={() => setSelectedLineId(line.lineId)}>
                    {vaLCol.colOrder.map((k) => {
                      const base = cn(TD, VA_LALIGN[k]);
                      if (k === "seqNo")       return <td key={k} className={base}>{line.seqNo}</td>;
                      if (k === "lineType")    return (
                        <td key={k} className={base}>
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                            line.lineType === "차변" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>{line.lineType === "차변" ? "D.차변" : "C.대변"}</span>
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

      {/* ── 부가세 정보 (부가세대급금 라인 선택 시) ─────────────────── */}
      <div className="shrink-0 border rounded-lg bg-card overflow-hidden">
        <div className="shrink-0 px-3 py-2 border-b bg-muted/30">
          <span className="text-xs font-medium">부가세 정보</span>
        </div>
        <div className="p-3 grid grid-cols-3 gap-x-6 gap-y-2">
          {/* row 1 */}
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
          {/* row 2 */}
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
          {/* row 3 */}
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

      {/* ── 차/대변 요약 ────────────────────────────────────────────── */}
      <div className="shrink-0 border rounded-lg bg-card overflow-hidden">
        <div className="flex divide-x">
          {/* 차변 */}
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
          {/* 대변 */}
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
        {/* 합계 행 */}
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

      {/* ── 다이얼로그 ──────────────────────────────────────────────── */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-lg shadow-lg p-6 min-w-[320px] max-w-md">
            <p className="text-sm whitespace-pre-wrap mb-5">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <Button size="sm" variant="outline" onClick={() => setDialog(null)}>취소</Button>
              )}
              <Button size="sm" onClick={() => {
                if (dialog.type === "confirm") dialog.onConfirm();
                setDialog(null);
              }}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
