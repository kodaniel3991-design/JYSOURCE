import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || null;
    const dateTo   = searchParams.get("dateTo")   || null;

    const factory = await getSessionFactory(request);
    const pool    = await getDbPool();

    // 테이블이 없으면 빈 결과 반환
    const tableCheck = await pool.request().query(
      `SELECT 1 AS HasTable WHERE OBJECT_ID(N'dbo.AccountingVoucher') IS NOT NULL`
    );
    if (!tableCheck.recordset.length) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // ApprovedAt / ApprovedBy 컬럼이 없으면 추가
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AccountingVoucher') AND name = 'ApprovedAt')
        ALTER TABLE dbo.AccountingVoucher ADD ApprovedAt DATETIME2 NULL;
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AccountingVoucher') AND name = 'ApprovedBy')
        ALTER TABLE dbo.AccountingVoucher ADD ApprovedBy NVARCHAR(100) NULL;
    `);

    const result = await pool.request()
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        SELECT
          v.Id,
          v.VoucherNo,
          CONVERT(NVARCHAR(10), v.VoucherDate, 23)  AS VoucherDate,
          v.SupplierCode, v.SupplierName,
          v.TotalDebit, v.TotalCredit,
          v.Status, v.Summary,
          v.SourceId, v.SourceType,
          v.DeptCode, v.DeptName,
          CONVERT(NVARCHAR(10), v.CreatedAt,    23) AS CreatedDate,
          CONVERT(NVARCHAR(10), v.ApprovedAt,  23) AS ApprovedDate,
          CASE
            WHEN v.ApprovedBy IS NOT NULL AND u.UserId IS NOT NULL
              THEN v.ApprovedBy + N'-' + u.UserId
            ELSE v.ApprovedBy
          END AS ApprovedBy,
          l.Id          AS LineId,
          l.SeqNo,
          l.LineType,
          l.AccountCode,
          l.AccountName,
          l.PartnerCode,
          l.PartnerName,
          l.Summary     AS LineSummary,
          l.DebitAmount,
          l.CreditAmount
        FROM dbo.AccountingVoucher v
        LEFT JOIN dbo.AppUser u ON u.Username = v.ApprovedBy
        LEFT JOIN dbo.AccountingVoucherLine l ON l.VoucherId = v.Id
        WHERE (@BusinessPlace IS NULL OR v.BusinessPlace = @BusinessPlace)
          AND (@DateFrom IS NULL OR v.VoucherDate >= @DateFrom)
          AND (@DateTo   IS NULL OR v.VoucherDate <= @DateTo)
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
      status: string; summary: string;
      sourceId: string | null; sourceType: string;
      deptCode: string; deptName: string;
      createdDate: string; approvedDate: string; approvedBy: string;
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
          sourceType:   String(r.SourceType   ?? ""),
          deptCode:     String(r.DeptCode     ?? ""),
          deptName:     String(r.DeptName     ?? ""),
          createdDate:  String(r.CreatedDate  ?? ""),
          approvedDate: String(r.ApprovedDate ?? ""),
          approvedBy:   String(r.ApprovedBy   ?? ""),
          lines:        [],
        });
      }
      if (r.LineId) {
        map.get(key)!.lines.push({
          lineId:       String(r.LineId),
          seqNo:        Number(r.SeqNo        ?? 0),
          lineType:     String(r.LineType      ?? ""),
          accountCode:  String(r.AccountCode   ?? ""),
          accountName:  String(r.AccountName   ?? ""),
          partnerCode:  String(r.PartnerCode   ?? ""),
          partnerName:  String(r.PartnerName   ?? ""),
          summary:      String(r.LineSummary   ?? ""),
          debitAmount:  Number(r.DebitAmount   ?? 0),
          creditAmount: Number(r.CreditAmount  ?? 0),
        });
      }
    }

    return NextResponse.json({ ok: true, items: Array.from(map.values()) });
  } catch (error) {
    console.error("[accounting/vouchers-management][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { ids: string[] };
    const { ids } = body;
    if (!ids?.length) {
      return NextResponse.json({ ok: false, message: "삭제할 전표를 선택하세요." }, { status: 400 });
    }

    const factory  = await getSessionFactory(request);
    const pool     = await getDbPool();
    const idList   = ids.map(Number).filter(Boolean);
    const ph       = idList.map((_, i) => `@Id${i}`).join(",");

    const req = pool.request().input("BusinessPlace", sql.NVarChar(20), factory);
    idList.forEach((id, i) => req.input(`Id${i}`, sql.Int, id));

    // 미승인 전표만 조회 (승인된 것은 제외)
    const check = await req.query(`
      SELECT Id, SourceId FROM dbo.AccountingVoucher
      WHERE Id IN (${ph})
        AND Status = N'미승인'
        AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
    `);

    if (!check.recordset.length) {
      return NextResponse.json({ ok: false, message: "삭제 가능한 전표가 없습니다. (미승인 상태만 삭제 가능)" }, { status: 400 });
    }

    const deletableIds  = (check.recordset as Record<string, unknown>[]).map((r) => Number(r.Id));
    const sourceIds     = (check.recordset as Record<string, unknown>[])
      .map((r) => Number(r.SourceId))
      .filter(Boolean);

    const delPh = deletableIds.map((_, i) => `@DelId${i}`).join(",");
    const delReq = pool.request();
    deletableIds.forEach((id, i) => delReq.input(`DelId${i}`, sql.Int, id));

    // AccountingVoucher 삭제 (AccountingVoucherLine은 CASCADE)
    await delReq.query(`DELETE FROM dbo.AccountingVoucher WHERE Id IN (${delPh})`);

    // 연결된 PurchaseInput 상태 복원: 회계처리 → 확정
    if (sourceIds.length) {
      const srcPh  = sourceIds.map((_, i) => `@SrcId${i}`).join(",");
      const srcReq = pool.request();
      sourceIds.forEach((id, i) => srcReq.input(`SrcId${i}`, sql.Int, id));
      await srcReq.query(`
        UPDATE dbo.PurchaseInput SET Status = N'확정'
        WHERE Id IN (${srcPh}) AND Status = N'회계처리'
      `);
    }

    return NextResponse.json({ ok: true, count: deletableIds.length });
  } catch (error) {
    console.error("[accounting/vouchers-management][DELETE]", error);
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
