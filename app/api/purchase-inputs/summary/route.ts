import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom     = searchParams.get("dateFrom")     || null;
  const dateTo       = searchParams.get("dateTo")       || null;
  const supplierCode = searchParams.get("supplierCode") || null;
  const itemCode     = searchParams.get("itemCode")     || null;

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const result = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("SupplierCode",  sql.NVarChar(50), supplierCode)
      .input("ItemCode",      sql.NVarChar(50), itemCode)
      .query(`
        SELECT
          pi.SupplierCode,
          pi.SupplierName,
          pii.ItemCode,
          pii.ItemName,
          pii.Unit,
          SUM(pii.InputQty)     AS TotalQty,
          SUM(pii.InputAmount)  AS TotalAmount,
          SUM(pii.TaxAmount)    AS TotalTaxAmount,
          SUM(pii.TotalWithTax) AS TotalWithTax
        FROM dbo.PurchaseInput pi
        JOIN dbo.PurchaseInputItem pii ON pii.PurchaseInputId = pi.Id
        WHERE (@BusinessPlace IS NULL OR pi.BusinessPlace = @BusinessPlace)
          AND (@DateFrom      IS NULL OR pi.InputDate >= @DateFrom)
          AND (@DateTo        IS NULL OR pi.InputDate <= @DateTo)
          AND (@SupplierCode  IS NULL OR pi.SupplierCode = @SupplierCode)
          AND (@ItemCode      IS NULL OR pii.ItemCode LIKE '%' + @ItemCode + '%')
        GROUP BY pi.SupplierCode, pi.SupplierName, pii.ItemCode, pii.ItemName, pii.Unit
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
