import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierCode  = searchParams.get("supplierCode")  || null;
  const dateFrom      = searchParams.get("dateFrom")      || null;
  const dateTo        = searchParams.get("dateTo")        || null;
  const itemCodeFrom  = searchParams.get("itemCodeFrom")  || null;
  const itemCodeTo    = searchParams.get("itemCodeTo")    || null;
  const model         = searchParams.get("model")         || null;

  if (!supplierCode) {
    return NextResponse.json({ ok: false, message: "구매처번호는 필수입니다." }, { status: 400 });
  }

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    // PurchaseInputItem 테이블 없으면 자동 생성
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PurchaseInputItem') AND type = 'U')
      BEGIN
        CREATE TABLE dbo.PurchaseInputItem (
          Id               INT IDENTITY(1,1) PRIMARY KEY,
          PurchaseInputId  INT           NOT NULL,
          SeqNo            INT           NOT NULL DEFAULT 0,
          ReceiptHistoryId INT           NULL,
          ReceiptNo        NVARCHAR(30)  NULL,
          ItemCode         NVARCHAR(50)  NOT NULL,
          ItemName         NVARCHAR(200) NULL,
          Unit             NVARCHAR(20)  NULL,
          InputQty         DECIMAL(18,3) NOT NULL DEFAULT 0,
          InputAmount      DECIMAL(18,0) NOT NULL DEFAULT 0,
          ConvertedAmount  DECIMAL(18,0) NULL DEFAULT 0,
          TaxAmount        DECIMAL(18,0) NULL DEFAULT 0,
          TotalWithTax     DECIMAL(18,0) NULL DEFAULT 0,
          Note             NVARCHAR(500) NULL,
          PurchaseOrderNo  NVARCHAR(50)  NULL
        );
      END
    `);

    const result = await pool.request()
      .input("SupplierCode",  sql.NVarChar(50),  supplierCode)
      .input("DateFrom",      sql.Date,          dateFrom)
      .input("DateTo",        sql.Date,          dateTo)
      .input("ItemCodeFrom",  sql.NVarChar(50),  itemCodeFrom)
      .input("ItemCodeTo",    sql.NVarChar(50),  itemCodeTo)
      .input("Model",         sql.NVarChar(100), model)
      .input("BusinessPlace", sql.NVarChar(20),  factory)
      .query(`
        SELECT
          rh.Id,
          rh.ReceiptNo,
          rh.ItemCode,
          rh.ItemName,
          rh.Qty,
          CONVERT(NVARCHAR(10), rh.ReceiptDate, 23)    AS ReceiptDate,
          im.Unit,
          ISNULL(rh.UnitPrice, poi.UnitPrice)          AS UnitPrice,
          rh.Qty * ISNULL(rh.UnitPrice, poi.UnitPrice) AS ReceiptAmount,
          po.PoNumber,
          po.SupplierCode,
          po.SupplierName,
          im.VehicleModel
        FROM dbo.ReceiptHistory rh
        JOIN dbo.PurchaseOrder po
          ON po.Id = rh.PurchaseOrderId
        LEFT JOIN dbo.PurchaseOrderItem poi
          ON poi.PurchaseOrderId = rh.PurchaseOrderId AND poi.ItemCode = rh.ItemCode
        LEFT JOIN dbo.ItemMaster im
          ON im.ItemNo = rh.ItemCode
        WHERE po.SupplierCode = @SupplierCode
          AND rh.Type = '입고'
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
          AND NOT EXISTS (
            SELECT 1 FROM dbo.PurchaseInputItem pii WHERE pii.ReceiptHistoryId = rh.Id
          )
          AND (@DateFrom     IS NULL OR rh.ReceiptDate >= @DateFrom)
          AND (@DateTo       IS NULL OR rh.ReceiptDate <= @DateTo)
          AND (@ItemCodeFrom IS NULL OR rh.ItemCode    >= @ItemCodeFrom)
          AND (@ItemCodeTo   IS NULL OR rh.ItemCode    <= @ItemCodeTo)
          AND (@Model        IS NULL OR im.VehicleModel LIKE '%' + @Model + '%')
        ORDER BY rh.ReceiptDate DESC, rh.ItemCode
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => {
      const qty          = Number(r.Qty           ?? 0);
      const unitPrice    = Number(r.UnitPrice      ?? 0);
      const receiptAmt   = Number(r.ReceiptAmount  ?? qty * unitPrice);
      const taxAmt       = Math.round(receiptAmt * 0.1);
      return {
        id:           String(r.Id),
        receiptNo:    String(r.ReceiptNo    ?? ""),
        itemCode:     String(r.ItemCode     ?? ""),
        itemName:     String(r.ItemName     ?? ""),
        unit:         String(r.Unit         ?? ""),
        unreceiptQty: qty,
        inputQty:     qty,
        receiptDate:  String(r.ReceiptDate  ?? ""),
        unitPrice,
        receiptAmount: receiptAmt,
        taxAmount:     taxAmt,
        totalWithTax:  receiptAmt + taxAmt,
        poNumber:      String(r.PoNumber     ?? ""),
        supplierCode:  String(r.SupplierCode ?? ""),
        supplierName:  String(r.SupplierName ?? ""),
        vehicleModel:  String(r.VehicleModel ?? ""),
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-inputs/unreceived][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
