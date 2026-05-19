import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom   = searchParams.get("dateFrom")   || null;
  const dateTo     = searchParams.get("dateTo")     || null;
  const deptFrom   = searchParams.get("deptFrom")   || null;
  const deptTo     = searchParams.get("deptTo")     || null;
  const sourceType = searchParams.get("sourceType") || null;

  try {
    const factory = await getSessionFactory(request);
    const pool    = await getDbPool();

    const result = await pool.request()
      .input("DateFrom",      sql.Date,          dateFrom)
      .input("DateTo",        sql.Date,          dateTo)
      .input("DeptFrom",      sql.NVarChar(50),  deptFrom)
      .input("DeptTo",        sql.NVarChar(50),  deptTo)
      .input("SourceType",    sql.NVarChar(50),  sourceType)
      .input("BusinessPlace", sql.NVarChar(20),  factory)
      .query(`
        SELECT
          vl.Id                                          AS LineId,
          vl.SeqNo,
          vl.LineType,
          vl.AccountCode,
          vl.AccountName,
          vl.PartnerCode,
          vl.PartnerName,
          vl.Summary                                     AS LineSummary,
          vl.DebitAmount,
          vl.CreditAmount,
          v.Id                                           AS VoucherId,
          v.VoucherNo,
          CONVERT(NVARCHAR(10), v.ApprovedAt, 23)        AS ApprovedDate,
          v.DeptCode,
          v.DeptName,
          v.SourceType,
          v.Status,
          v.Summary                                      AS VoucherSummary
        FROM dbo.AccountingVoucherLine vl
        JOIN dbo.AccountingVoucher v ON v.Id = vl.VoucherId
        WHERE v.Status = N'승인'
          AND (@BusinessPlace IS NULL OR v.BusinessPlace = @BusinessPlace)
          AND (@DateFrom   IS NULL OR CONVERT(DATE, v.ApprovedAt) >= @DateFrom)
          AND (@DateTo     IS NULL OR CONVERT(DATE, v.ApprovedAt) <= @DateTo)
          AND (@DeptFrom   IS NULL OR v.DeptCode    >= @DeptFrom)
          AND (@DeptTo     IS NULL OR v.DeptCode    <= @DeptTo)
          AND (@SourceType IS NULL OR v.SourceType  = @SourceType)
        ORDER BY v.ApprovedAt, v.VoucherNo, vl.SeqNo
      `);

    const items = (result.recordset as Record<string, unknown>[]).map((r) => ({
      lineId:         String(r.LineId       ?? ""),
      seqNo:          Number(r.SeqNo        ?? 0),
      lineType:       String(r.LineType     ?? ""),
      accountCode:    String(r.AccountCode  ?? ""),
      accountName:    String(r.AccountName  ?? ""),
      partnerCode:    String(r.PartnerCode  ?? ""),
      partnerName:    String(r.PartnerName  ?? ""),
      lineSummary:    String(r.LineSummary  ?? ""),
      debitAmount:    Number(r.DebitAmount  ?? 0),
      creditAmount:   Number(r.CreditAmount ?? 0),
      voucherId:      String(r.VoucherId    ?? ""),
      voucherNo:      String(r.VoucherNo    ?? ""),
      approvedDate:   String(r.ApprovedDate ?? ""),
      deptCode:       String(r.DeptCode     ?? ""),
      deptName:       String(r.DeptName     ?? ""),
      sourceType:     String(r.SourceType   ?? ""),
      status:         String(r.Status       ?? ""),
      voucherSummary: String(r.VoucherSummary ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[accounting/journal][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패", items: [] }, { status: 500 });
  }
}
