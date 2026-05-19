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

// ── 타입 ──────────────────────────────────────────────────────────────────────

type JournalLine = {
  lineId: string;
  seqNo: number;
  lineType: string;
  accountCode: string;
  accountName: string;
  partnerCode: string;
  partnerName: string;
  lineSummary: string;
  debitAmount: number;
  creditAmount: number;
  voucherId: string;
  voucherNo: string;
  approvedDate: string;
  deptCode: string;
  deptName: string;
  sourceType: string;
  status: string;
  voucherSummary: string;
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
const fmt = (n: number) => n === 0 ? "" : n.toLocaleString("ko-KR");

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [search, setSearch] = useState({
    dateFrom: firstOfMonthStr(),
    dateTo:   todayStr(),
  });
  const [lines,   setLines]   = useState<JournalLine[]>([]);
  const [loading, setLoading] = useState(false);

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

  // 조회
  const loadList = useCallback(() => {
    const p = new URLSearchParams();
    if (search.dateFrom) p.set("dateFrom", search.dateFrom);
    if (search.dateTo)   p.set("dateTo",   search.dateTo);
    setLoading(true);
    fetch(apiPath(`/api/accounting/journal?${p}`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setLines(d.items ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 전표별 첫 행 여부 계산

  const rows = useMemo(() => {
    const seen = new Set<string>();
    return lines.map((line) => {
      const isFirst = !seen.has(line.voucherId);
      if (isFirst) seen.add(line.voucherId);
      return { ...line, isFirst };
    });
  }, [lines]);

  // 차변·대변 합계
  const totals = useMemo(() => ({
    debit:  lines.reduce((s, l) => s + l.debitAmount,  0),
    credit: lines.reduce((s, l) => s + l.creditAmount, 0),
  }), [lines]);

  // 전표 건수
  const voucherCount = useMemo(() => new Set(lines.map((l) => l.voucherId)).size, [lines]);

  // 날짜 포맷: YYYY-MM-DD → YY/MM/DD
  const fmtDate = (d: string) => {
    if (!d || d.length < 10) return "";
    return `${d.slice(2, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}`;
  };

  // 계정 표시: [코드] 계정명
  const fmtAccount = (code: string, name: string) =>
    code ? `[${code}] ${name ?? ""}` : (name ?? "");

  // ── 스타일 ──────────────────────────────────────────────────────────────────
  const TH  = "bg-muted/80 text-xs font-medium text-muted-foreground border border-border px-1.5 py-1 whitespace-nowrap text-center";
  const TD  = "text-xs border border-border px-1.5 py-0.5 whitespace-nowrap overflow-hidden";
  const TDF = "text-xs border border-border px-1.5 py-0.5 whitespace-nowrap bg-muted/50 font-semibold";

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <PageHeader title="분개장" />

      {/* ── 검색 패널 ────────────────────────────────────────────────── */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-end gap-3 mb-3">

            {/* 회계구분 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">회계구분</label>
              <div className="flex gap-1">
                <Input value={myFactoryCode} readOnly className="h-7 text-xs w-12 text-center bg-muted text-muted-foreground" />
                <Input value={myFactoryName} readOnly className="h-7 text-xs w-48 bg-muted text-muted-foreground" />
              </div>
            </div>

            {/* 기표기간 */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-xs font-medium text-muted-foreground">기표기간</label>
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

      {/* ── 그리드 ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden bg-card">

        <div className="shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-medium">분개장</span>
          <span className="text-xs text-muted-foreground">
            전표 <span className="font-semibold text-foreground">{voucherCount}</span>건 /
            행 <span className="font-semibold text-foreground">{lines.length}</span>건
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: 1060 }}>
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 48 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 176 }} />
              <col style={{ width: 176 }} />
              <col style={{ width: 130 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 48 }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              {/* 그룹 헤더 */}
              <tr>
                <th colSpan={2} className={cn(TH, "border-r-2 border-border")}>구분[기표]</th>
                <th colSpan={2} className={cn(TH, "border-r-2 border-border")}>차&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;변</th>
                <th colSpan={2} className={cn(TH, "border-r-2 border-border")}>대&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;변</th>
                <th className={TH}>적&nbsp;&nbsp;요</th>
                <th className={TH}>거&nbsp;&nbsp;래&nbsp;&nbsp;처</th>
                <th colSpan={2} className={cn(TH, "border-l-2 border-border")}>구분[결의]</th>
              </tr>
              {/* 세부 헤더 */}
              <tr>
                <th className={cn(TH, "text-center")}>년/월/일</th>
                <th className={cn(TH, "text-center border-r-2 border-border")}>번호</th>
                <th className={cn(TH, "text-right")}>금&nbsp;&nbsp;&nbsp;액</th>
                <th className={cn(TH, "border-r-2 border-border")}>계정과목</th>
                <th className={TH}>계정과목</th>
                <th className={cn(TH, "text-right border-r-2 border-border")}>금&nbsp;&nbsp;&nbsp;액</th>
                <th className={TH}>적&nbsp;&nbsp;요</th>
                <th className={TH}>거래처</th>
                <th className={cn(TH, "text-center border-l-2 border-border")}>년/월/일</th>
                <th className={cn(TH, "text-center")}>번호</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground text-xs">조회 중...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground text-xs">조회된 데이터가 없습니다.</td>
                </tr>
              )}
              {!loading && rows.map((row) => {
                const isDebit  = row.lineType === "차변";
                const isCredit = row.lineType === "대변";
                const accountDisplay = fmtAccount(row.accountCode, row.accountName);
                const partnerDisplay = row.partnerCode
                  ? `[${row.partnerCode}] ${row.partnerName}`
                  : row.partnerName;

                return (
                  <tr
                    key={row.lineId}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isCredit && "bg-blue-50/20 dark:bg-blue-950/10",
                    )}
                  >
                    {/* 구분[기표] 년/월/일 */}
                    <td className={cn(TD, "text-center")}>
                      {row.isFirst ? fmtDate(row.approvedDate) : ""}
                    </td>
                    {/* 기표 번호 */}
                    <td className={cn(TD, "text-center font-mono border-r-2 border-border")}>
                      {row.isFirst ? row.voucherNo : ""}
                    </td>

                    {/* 차변 금액 */}
                    <td className={cn(TD, "text-right tabular-nums")}>
                      {isDebit ? fmt(row.debitAmount) : ""}
                    </td>
                    {/* 차변 계정과목 */}
                    <td className={cn(TD, "border-r-2 border-border")}>
                      {isDebit ? accountDisplay : ""}
                    </td>

                    {/* 대변 계정과목 */}
                    <td className={cn(TD, "pl-4")}>
                      {isCredit ? accountDisplay : ""}
                    </td>
                    {/* 대변 금액 */}
                    <td className={cn(TD, "text-right tabular-nums border-r-2 border-border")}>
                      {isCredit ? fmt(row.creditAmount) : ""}
                    </td>

                    {/* 적요 */}
                    <td className={TD}>{row.lineSummary}</td>
                    {/* 거래처 */}
                    <td className={TD}>{partnerDisplay}</td>

                    {/* 구분[결의] 년/월/일 */}
                    <td className={cn(TD, "text-center border-l-2 border-border")}>
                      {row.isFirst ? fmtDate(row.approvedDate) : ""}
                    </td>
                    {/* 결의 번호 */}
                    <td className={cn(TD, "text-center font-mono")}>
                      {row.isFirst ? row.voucherNo : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} className={cn(TDF, "text-right border-r-2 border-border")}>합&nbsp;&nbsp;계</td>
                  <td className={cn(TDF, "text-right tabular-nums")}>{totals.debit.toLocaleString("ko-KR")}</td>
                  <td className={cn(TDF, "border-r-2 border-border")} />
                  <td className={TDF} />
                  <td className={cn(TDF, "text-right tabular-nums border-r-2 border-border")}>{totals.credit.toLocaleString("ko-KR")}</td>
                  <td colSpan={4} className={TDF} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>
    </div>
  );
}
