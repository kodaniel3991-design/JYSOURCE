import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemCode    = searchParams.get("itemCode")    ?? "";
  const supplierName = searchParams.get("supplierName") ?? "";

  try {
    const pool = await getDbPool();

    // 테이블이 없으면 빈 배열 반환
    const exists = await pool.request().query(`
      SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'dbo.PurchasePriceHistory')
    `);
    if (!exists.recordset.length) {
      return NextResponse.json({ ok: true, items: [] });
    }

    let where = "WHERE 1=1";
    if (itemCode.trim())     where += ` AND ItemCode    LIKE '%' + '${itemCode.trim().replace(/'/g,"''")}' + '%'`;
    if (supplierName.trim()) where += ` AND SupplierName LIKE '%' + '${supplierName.trim().replace(/'/g,"''")}' + '%'`;

    const result = await pool.request().query(`
      SELECT TOP 500
        Id, PurchasePriceId, ItemCode, ItemName, SupplierName,
        PreviousUnitPrice, NewUnitPrice,
        CONVERT(NVARCHAR(10), PreviousApplyDate, 23)  AS PreviousApplyDate,
        CONVERT(NVARCHAR(10), NewApplyDate, 23)        AS NewApplyDate,
        CONVERT(NVARCHAR(10), PreviousExpireDate, 23)  AS PreviousExpireDate,
        CONVERT(NVARCHAR(10), NewExpireDate, 23)        AS NewExpireDate,
        ChangeType,
        Reason,
        CONVERT(NVARCHAR(16), ChangedAt, 120)          AS ChangedAt
      FROM dbo.PurchasePriceHistory
      ${where}
      ORDER BY ChangedAt DESC, Id DESC
    `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      id:                  String(r.Id),
      purchasePriceId:     Number(r.PurchasePriceId),
      itemCode:            String(r.ItemCode     ?? ""),
      itemName:            String(r.ItemName     ?? ""),
      supplierName:        String(r.SupplierName ?? ""),
      previousUnitPrice:   r.PreviousUnitPrice  != null ? Number(r.PreviousUnitPrice)  : null,
      newUnitPrice:        r.NewUnitPrice        != null ? Number(r.NewUnitPrice)        : null,
      previousApplyDate:   r.PreviousApplyDate  ? String(r.PreviousApplyDate)  : null,
      newApplyDate:        r.NewApplyDate        ? String(r.NewApplyDate)        : null,
      previousExpireDate:  r.PreviousExpireDate ? String(r.PreviousExpireDate) : null,
      newExpireDate:       r.NewExpireDate       ? String(r.NewExpireDate)       : null,
      changeType:          String(r.ChangeType  ?? ""),
      reason:              r.Reason ? String(r.Reason) : "",
      changedAt:           String(r.ChangedAt   ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[purchase-prices/history][GET]", err);
    return NextResponse.json({ ok: false, message: "이력 조회 실패", items: [] }, { status: 500 });
  }
}
