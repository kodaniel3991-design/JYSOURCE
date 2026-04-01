import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") || null;
  const dateTo   = searchParams.get("dateTo")   || null;

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const result = await pool.request()
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        SELECT
          pi.SupplierCode,
          pi.SupplierName,
          pii.ItemCode,
          pii.ItemName,
          ISNULL(NULLIF(im.VehicleModel, ''), '(미지정)') AS VehicleModel,
          ISNULL(NULLIF(itc.ItemTypeName, ''),
            ISNULL(NULLIF(im.Form, ''), '(미지정)'))       AS Form,
          pii.InputQty,
          pii.InputAmount,
          pii.TaxAmount,
          pii.TotalWithTax,
          CONVERT(NVARCHAR(10), pi.InputDate, 23) AS InputDate
        FROM dbo.PurchaseInput pi
        JOIN dbo.PurchaseInputItem pii
          ON pii.PurchaseInputId = pi.Id
        LEFT JOIN dbo.ItemMaster im
          ON im.ItemNo = pii.ItemCode
        LEFT JOIN dbo.ItemTypeCode itc
          ON itc.ItemTypeCode = im.Form
        WHERE pi.Status = '회계처리'
          AND (@BusinessPlace IS NULL OR pi.BusinessPlace = @BusinessPlace)
          AND (@DateFrom IS NULL OR pi.InputDate >= @DateFrom)
          AND (@DateTo   IS NULL OR pi.InputDate <= @DateTo)
        ORDER BY
          ISNULL(NULLIF(im.VehicleModel, ''), '(미지정)'),
          ISNULL(NULLIF(itc.ItemTypeName, ''), ISNULL(NULLIF(im.Form, ''), '(미지정)')),
          pi.SupplierCode,
          pii.ItemCode
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      supplierCode:  String(r.SupplierCode  ?? ""),
      supplierName:  String(r.SupplierName  ?? ""),
      itemCode:      String(r.ItemCode      ?? ""),
      itemName:      String(r.ItemName      ?? ""),
      vehicleModel:  String(r.VehicleModel  ?? "(미지정)"),
      form:          String(r.Form          ?? "(미지정)"),
      inputQty:      Number(r.InputQty      ?? 0),
      inputAmount:   Number(r.InputAmount   ?? 0),
      taxAmount:     Number(r.TaxAmount     ?? 0),
      totalWithTax:  Number(r.TotalWithTax  ?? 0),
      inputDate:     String(r.InputDate     ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-inputs/closing][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패", items: [] }, { status: 500 });
  }
}
