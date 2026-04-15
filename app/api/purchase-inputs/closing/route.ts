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
          po.SupplierCode,
          po.SupplierName,
          rh.ItemCode,
          ISNULL(rh.ItemName, im.ItemName)                           AS ItemName,
          ISNULL(NULLIF(im.VehicleModel, ''), N'(미지정)')           AS VehicleModel,
          ISNULL(NULLIF(itc.ItemTypeName, ''),
            ISNULL(NULLIF(im.Form, ''), N'(미지정)'))                AS Form,
          rh.Qty                                                     AS InputQty,
          ROUND(rh.Qty * ISNULL(poi.UnitPrice, 0), 0)               AS InputAmount,
          ROUND(rh.Qty * ISNULL(poi.UnitPrice, 0) * 0.1, 0)         AS TaxAmount,
          ROUND(rh.Qty * ISNULL(poi.UnitPrice, 0) * 1.1, 0)         AS TotalWithTax,
          CONVERT(NVARCHAR(10), rh.ReceiptDate, 23)                  AS InputDate
        FROM dbo.ReceiptHistory rh
        JOIN dbo.PurchaseOrder po
          ON po.Id = rh.PurchaseOrderId
        LEFT JOIN dbo.PurchaseOrderItem poi
          ON poi.PurchaseOrderId = rh.PurchaseOrderId
          AND (
            (rh.SeqNo IS NOT NULL AND poi.SpecNo = rh.SeqNo)
            OR
            (rh.SeqNo IS NULL
              AND poi.ItemCode = rh.ItemCode
              AND poi.SpecNo = (
                SELECT MIN(SpecNo) FROM dbo.PurchaseOrderItem
                WHERE PurchaseOrderId = rh.PurchaseOrderId AND ItemCode = rh.ItemCode
              )
            )
          )
        LEFT JOIN dbo.ItemMaster im
          ON im.ItemNo = rh.ItemCode
        LEFT JOIN dbo.ItemTypeCode itc
          ON itc.ItemTypeCode = im.Form
        WHERE rh.Type = N'입고'
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
          AND (@DateFrom      IS NULL OR rh.ReceiptDate  >= @DateFrom)
          AND (@DateTo        IS NULL OR rh.ReceiptDate  <= @DateTo)
        ORDER BY
          ISNULL(NULLIF(im.VehicleModel, ''), N'(미지정)'),
          ISNULL(NULLIF(itc.ItemTypeName, ''), ISNULL(NULLIF(im.Form, ''), N'(미지정)')),
          po.SupplierCode,
          rh.ItemCode
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
