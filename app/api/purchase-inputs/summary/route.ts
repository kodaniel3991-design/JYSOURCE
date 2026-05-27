import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom     = searchParams.get("dateFrom")     || null;
  const dateTo       = searchParams.get("dateTo")       || null;
  const supplierCode = searchParams.get("supplierCode") || null;
  const itemCode     = searchParams.get("itemCode")     || null;
  const model        = searchParams.get("model")        || null;

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const result = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20),  factory)
      .input("DateFrom",      sql.Date,          dateFrom)
      .input("DateTo",        sql.Date,          dateTo)
      .input("SupplierCode",  sql.NVarChar(50),  supplierCode)
      .input("ItemCode",      sql.NVarChar(50),  itemCode)
      .input("Model",         sql.NVarChar(100), model)
      .query(`
        SELECT
          pi.SupplierCode,
          pi.SupplierName,
          pii.ItemCode,
          ISNULL(im.ItemName, pii.ItemName) AS ItemName,
          pii.Unit,
          SUM(pii.InputQty) AS TotalQty,
          SUM(CASE
            WHEN rh.UnitPrice IS NOT NULL
              THEN ROUND(pii.InputQty * rh.UnitPrice, 0)
            ELSE pii.InputAmount
          END) AS TotalAmount,
          FLOOR(SUM(CASE
            WHEN rh.UnitPrice IS NOT NULL
              THEN ROUND(pii.InputQty * rh.UnitPrice, 0)
            ELSE pii.InputAmount
          END) * 0.1) AS TotalTaxAmount,
          FLOOR(SUM(CASE
            WHEN rh.UnitPrice IS NOT NULL
              THEN ROUND(pii.InputQty * rh.UnitPrice, 0)
            ELSE pii.InputAmount
          END) * 1.1) AS TotalWithTax
        FROM dbo.PurchaseInput pi
        JOIN dbo.PurchaseInputItem pii ON pii.PurchaseInputId = pi.Id
        LEFT JOIN dbo.ReceiptHistory rh ON rh.Id = pii.ReceiptHistoryId
        LEFT JOIN dbo.ItemMaster im ON im.ItemNo = pii.ItemCode
        WHERE (@BusinessPlace IS NULL OR pi.BusinessPlace = @BusinessPlace)
          AND (@DateFrom      IS NULL OR pi.InputDate >= @DateFrom)
          AND (@DateTo        IS NULL OR pi.InputDate <= @DateTo)
          AND (@SupplierCode  IS NULL OR pi.SupplierCode = @SupplierCode)
          AND (@ItemCode      IS NULL OR pii.ItemCode LIKE '%' + @ItemCode + '%')
          AND (@Model         IS NULL OR im.VehicleModel LIKE '%' + @Model + '%')
        GROUP BY pi.SupplierCode, pi.SupplierName, pii.ItemCode, ISNULL(im.ItemName, pii.ItemName), pii.Unit
        ORDER BY pi.SupplierCode, pii.ItemCode
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      supplierCode:   String(r.SupplierCode   ?? ""),
      supplierName:   String(r.SupplierName   ?? ""),
      itemCode:       String(r.ItemCode       ?? ""),
      itemName:       String(r.ItemName       ?? ""),
      unit:           String(r.Unit           ?? ""),
      totalQty:       Number(r.TotalQty       ?? 0),
      totalAmount:    Number(r.TotalAmount    ?? 0),
      totalTaxAmount: Number(r.TotalTaxAmount ?? 0),
      totalWithTax:   Number(r.TotalWithTax   ?? 0),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-inputs/summary][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
