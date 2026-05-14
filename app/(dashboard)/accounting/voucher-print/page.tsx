"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
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
  lines: VoucherLine[];
};

type FlatRow = VoucherLine & {
  voucherId: string;
  voucherNo: string;
  voucherDate: string;
  status: string;
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

const STATUS_OPTIONS = [
  { value: "",    label: "전체" },
  { value: "미결", label: "미결" },
  { value: "승인", label: "승인" },
];

const VP_COLS    = ["voucherDate","voucherNo","status","seqNo","lineType","accountCode","accountName","partnerCode","partnerName","summary","debitAmount","creditAmount"] as const;
const VP_HEADERS: Record<string, string> = {
  voucherDate: "전표일자", voucherNo: "전표번호", status: "상태", seqNo: "순번",
  lineType: "구분", accountCode: "계정코드", accountName: "계정명",
  partnerCode: "코드", partnerName: "거래처", summary: "적요",
  debitAmount: "차변금액", creditAmount: "대변금액",
};
const VP_SORT    = new Set(["voucherDate","voucherNo","seqNo","accountCode","accountName","partnerCode","partnerName","debitAmount","creditAmount"]);
const VP_ALIGN: Record<string, string> = {
  voucherDate: "text-center", voucherNo: "text-center", status: "text-center",
  seqNo: "text-center", lineType: "text-center", accountCode: "text-center",
  partnerCode: "text-center", debitAmount: "text-right", creditAmount: "text-right",
};

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function VoucherPrintPage() {
  const [search, setSearch]   = useState({ dateFrom: firstOfMonthStr(), dateTo: todayStr(), status: "" });
  const [list, setList]       = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);

  const [myFactoryCode, setMyFactoryCode] = useState("");
  const [myFactoryName, setMyFactoryName] = useState("");
  const [businessPlace, setBusinessPlace] = useState("");

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
    fetch(apiPath(`/api/accounting/voucher-print?${p}`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setList(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, businessPlace]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 전표 → 플랫 행 변환
  const rows = useMemo<FlatRow[]>(() =>
    list.flatMap((v) =>
      v.lines.map((l) => ({
        ...l,
        voucherId:   v.id,
        voucherNo:   v.voucherNo,
        voucherDate: v.voucherDate,
        status:      v.status,
      }))
    ),
    [list]
  );

  // 합계
  const totals = useMemo(() => ({
    debit:  rows.reduce((s, r) => s + r.debitAmount,  0),
    credit: rows.reduce((s, r) => s + r.creditAmount, 0),
  }), [rows]);

  // ── 그리드 훅 ───────────────────────────────────────────────────────────────

  const { sortedItems: sortedRows, sortKey: vpSortKey, sortDir: vpSortDir, toggleSort: vpToggleSort }
    = useSortableGrid(rows);
  const vpCol = useGridColumnSettings("accounting/voucher-print", [...VP_COLS]);
  const gtp = {
    dragKey: vpCol.dragKey, dropTargetKey: vpCol.dropTargetKey,
    onResizeEnd: vpCol.resize, onDragStartKey: vpCol.setDragKey,
    onDropKey: vpCol.reorder, onDragEndKey: () => vpCol.setDragKey(null),
    onDragOverKey: vpCol.setDropTargetKey,
  };

  // ── 스타일 ──────────────────────────────────────────────────────────────────

  const TH = "bg-muted/80 text-xs font-medium text-muted-foreground border border-border px-2 py-1 whitespace-nowrap";
  const TD = "text-xs border border-border px-2 py-1 whitespace-nowrap overflow-hidden";

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <PageHeader title="전표조회 및 출력" />

      {/* ── 검색 패널 ────────────────────────────────────────────────── */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex items-end gap-3 mb-3">

            {/* 회계구분 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">회계구분</label>
              <div className="flex gap-1">
                <Input value={myFactoryCode} readOnly className="h-7 text-xs w-12 text-center bg-muted text-muted-foreground" />
                <Input value={myFactoryName} readOnly className="h-7 text-xs w-48 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 전표일자 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">전표일자</label>
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

            {/* 전표상태 */}
            <div className="flex flex-col gap-1 shrink-0 w-28">
              <label className="text-xs font-medium text-muted-foreground">전표상태</label>
              <Select
                options={STATUS_OPTIONS}
                value={search.status}
                onChange={(v) => setSearch((p) => ({ ...p, status: v }))}
                className="!h-7 !py-0.5 !px-2 !pr-7 text-xs"
              />
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
              onClick={() => setSearch({ dateFrom: firstOfMonthStr(), dateTo: todayStr(), status: "" })}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 그리드 ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden bg-card">

        <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-medium">분개 명세</span>
          <span className="text-xs text-muted-foreground">
            총 <span className="font-semibold text-foreground">{list.length}</span>건
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs min-w-[900px]">
            <colgroup>
              {vpCol.colOrder.map((k) => (
                <col key={k} style={{ width: vpCol.colWidths[k] ? `${vpCol.colWidths[k]}px` : undefined }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr>
                {vpCol.colOrder.map((k) => (
                  <GridTh key={k} colKey={k} {...gtp}
                    className={cn(TH, VP_ALIGN[k])}
                    sortKey={VP_SORT.has(k) ? k : undefined}
                    currentSortKey={vpSortKey as string | null}
                    sortDir={vpSortDir}
                    onSort={(sk) => vpToggleSort(sk as keyof typeof sortedRows[0])}>
                    {VP_HEADERS[k]}
                  </GridTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={VP_COLS.length} className="text-center py-8 text-muted-foreground text-xs">조회 중...</td></tr>
              )}
              {!loading && sortedRows.length === 0 && (
                <tr><td colSpan={VP_COLS.length} className="text-center py-8 text-muted-foreground text-xs">조회된 전표가 없습니다.</td></tr>
              )}
              {!loading && sortedRows.map((row, idx) => (
                <tr key={`${row.voucherId}-${row.lineId}-${idx}`} className="hover:bg-muted/30 transition-colors">
                  {vpCol.colOrder.map((k) => {
                    const base = cn(TD, VP_ALIGN[k]);
                    if (k === "voucherDate")  return <td key={k} className={base}>{row.voucherDate}</td>;
                    if (k === "voucherNo")    return <td key={k} className={cn(base, "font-mono")}>{row.voucherNo}</td>;
                    if (k === "status")       return (
                      <td key={k} className={base}>
                        <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                          row.status === "승인" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                               : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}>{row.status === "미승인" ? "미결" : row.status}</span>
                      </td>
                    );
                    if (k === "seqNo")        return <td key={k} className={base}>{row.seqNo}</td>;
                    if (k === "lineType")     return (
                      <td key={k} className={base}>
                        <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                          row.lineType === "차변" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                 : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>{row.lineType}</span>
                      </td>
                    );
                    if (k === "accountCode")  return <td key={k} className={cn(base, "font-mono")}>{row.accountCode}</td>;
                    if (k === "accountName")  return <td key={k} className={base}>{row.accountName}</td>;
                    if (k === "partnerCode")  return <td key={k} className={cn(base, "font-mono")}>{row.partnerCode}</td>;
                    if (k === "partnerName")  return <td key={k} className={base}>{row.partnerName}</td>;
                    if (k === "summary")      return <td key={k} className={base}>{row.summary}</td>;
                    if (k === "debitAmount")  return <td key={k} className={base}>{row.debitAmount  > 0 ? fmt(row.debitAmount)  : ""}</td>;
                    if (k === "creditAmount") return <td key={k} className={base}>{row.creditAmount > 0 ? fmt(row.creditAmount) : ""}</td>;
                    return <td key={k} className={base} />;
                  })}
                </tr>
              ))}
            </tbody>
            {sortedRows.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50">
                  {vpCol.colOrder.map((k) => {
                    if (k === "debitAmount")  return <td key={k} className={cn(TD, "text-right font-semibold")}>{fmt(totals.debit)}</td>;
                    if (k === "creditAmount") return <td key={k} className={cn(TD, "text-right font-semibold")}>{fmt(totals.credit)}</td>;
                    if (k === "summary")      return <td key={k} className={cn(TD, "text-right font-medium")}>합 계</td>;
                    return <td key={k} className={TD} />;
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>
    </div>
  );
}
