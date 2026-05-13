import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bpParam   = searchParams.get("businessPlace") || null;
    const dateFrom  = searchParams.get("dateFrom")      || null;
    const dateTo    = searchParams.get("dateTo")        || null;
    const statusRaw = searchParams.get("status")        || null;

    const factory       = await getSessionFactory(request);
    const businessPlace = bpParam ?? factory;
    const pool          = await getDbPool();

    // "미결" → DB '미승인', "승인" → DB '승인', 그 외 전체
    const statusFilter = statusRaw === "미결" ? "미승인" : statusRaw === "승인" ? "승인" : null;

    const result = await pool.request()
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), businessPlace)
      .input("Status",        sql.NVarChar(20), statusFilter)
      .query(`
        SELECT
          v.Id,
          v.VoucherNo,
          CONVERT(NVARCHAR(10), v.VoucherDate, 23) AS VoucherDate,
          v.SupplierCode, v.SupplierName,
          v.TotalDebit, v.TotalCredit,
          v.Status, v.Summary, v.SourceId,
          l.Id         AS LineId,
          l.SeqNo,
          l.LineType,
          l.AccountCode,
          l.AccountName,
          l.PartnerCode,
          l.PartnerName,
          l.Summary    AS LineSummary,
          l.DebitAmount,
          l.CreditAmount
        FROM dbo.AccountingVoucher v
        LEFT JOIN dbo.AccountingVoucherLine l ON l.VoucherId = v.Id
        WHERE v.SourceType = N'매입전표'
          AND (@BusinessPlace IS NULL OR v.BusinessPlace = @BusinessPlace)
          AND (@DateFrom IS NULL OR v.VoucherDate >= @DateFrom)
          AND (@DateTo   IS NULL OR v.VoucherDate <= @DateTo)
          AND (@Status   IS NULL OR v.Status = @Status)
        ORDER BY v.Id DESC, l.SeqNo
      `);

    type VoucherLine = {
      lineId: string; seqNo: number; lineType: string;
      accountCode: string; accountName: string;
      partnerCode: string; partnerName: string;
      summary: string; debitAmount: number; creditAmount: number;
    };
    type Voucher = {
      id: string; voucherNo: string; voucherDate: string;
      supplierCode: string; supplierName: string;
      totalDebit: number; totalCredit: number;
      status: string; summary: string; sourceId: string | null;
      lines: VoucherLine[];
    };

    const map = new Map<string, Voucher>();
    for (const r of result.recordset as Record<string, unknown>[]) {
      const key = String(r.Id);
      if (!map.has(key)) {
        map.set(key, {
          id:           key,
          voucherNo:    String(r.VoucherNo    ?? ""),
          voucherDate:  String(r.VoucherDate  ?? ""),
          supplierCode: String(r.SupplierCode ?? ""),
          supplierName: String(r.SupplierName ?? ""),
          totalDebit:   Number(r.TotalDebit   ?? 0),
          totalCredit:  Number(r.TotalCredit  ?? 0),
          status:       String(r.Status       ?? ""),
          summary:      String(r.Summary      ?? ""),
          sourceId:     r.SourceId ? String(r.SourceId) : null,
          lines:        [],
        });
      }
      if (r.LineId) {
        map.get(key)!.lines.push({
          lineId:        String(r.LineId),
          seqNo:         Number(r.SeqNo         ?? 0),
          lineType:      String(r.LineType       ?? ""),
          accountCode:   String(r.AccountCode    ?? ""),
          accountName:   String(r.AccountName    ?? ""),
          partnerCode:   String(r.PartnerCode    ?? ""),
          partnerName:   String(r.PartnerName    ?? ""),
          summary:       String(r.LineSummary    ?? ""),
          debitAmount:   Number(r.DebitAmount    ?? 0),
          creditAmount:  Number(r.CreditAmount   ?? 0),
        });
      }
    }

    return NextResponse.json({ ok: true, items: Array.from(map.values()) });
  } catch (error) {
    console.error("[accounting/voucher-print][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
