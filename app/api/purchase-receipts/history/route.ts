import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom    = searchParams.get("dateFrom") || null;
  const dateTo      = searchParams.get("dateTo")   || null;
  const itemCode    = searchParams.get("itemCode")  || null;
  const poNumber    = searchParams.get("poNumber")  || null;
  const warehouse   = searchParams.get("warehouse") || null;
  const supplierCode= searchParams.get("supplierCode") || null;
  const type        = searchParams.get("type")      || null; // '입고' | '반품'
  const model       = searchParams.get("model")      || null;

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    // ReceiptHistory 테이블 없으면 자동 생성
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND type = 'U')
      BEGIN
        CREATE TABLE dbo.ReceiptHistory (
          Id INT IDENTITY(1,1) PRIMARY KEY, PurchaseOrderId INT NOT NULL,
          ReceiptNo NVARCHAR(30) NOT NULL, ProcessedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          Type NVARCHAR(10) NOT NULL, ItemCode NVARCHAR(50) NOT NULL, ItemName NVARCHAR(200) NULL,
          Qty DECIMAL(18,3) NOT NULL DEFAULT 0, ReceiptDate DATE NULL,
          Warehouse NVARCHAR(20) NULL, LotNo NVARCHAR(100) NULL, Note NVARCHAR(500) NULL,
          CONSTRAINT FK_ReceiptHistory_PurchaseOrder FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id) ON DELETE CASCADE
        );
      END
    `);

    // UnitPrice 컬럼 없으면 자동 추가
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND name = 'UnitPrice'
      )
        ALTER TABLE dbo.ReceiptHistory ADD UnitPrice DECIMAL(18,4) NULL
    `);

    const req = pool.request()
      .input("DateFrom",     sql.Date,          dateFrom || null)
      .input("DateTo",       sql.Date,          dateTo   || null)
      .input("ItemCode",     sql.NVarChar(50),  itemCode || null)
      .input("PoNumber",     sql.NVarChar(30),  poNumber || null)
      .input("Warehouse",    sql.NVarChar(20),  warehouse || null)
      .input("SupplierCode", sql.NVarChar(50),  supplierCode || null)
      .input("Type",         sql.NVarChar(10),  type || null)
      .input("BusinessPlace",sql.NVarChar(20),  factory)
      .input("Model",        sql.NVarChar(100), model || null);

    const result = await req.query(`
      SELECT
        rh.Id,
        rh.ReceiptNo,
        CONVERT(NVARCHAR(16), rh.ProcessedAt, 120) AS ProcessedAt,
        rh.Type,
        rh.ItemCode,
        rh.ItemName,
        rh.Qty,
        CONVERT(NVARCHAR(10), rh.ReceiptDate, 23) AS ReceiptDate,
        rh.Warehouse,
        rh.LotNo,
        rh.Note,
        po.PoNumber,
        po.SupplierCode,
        po.SupplierName,
        po.BuyerName,
        po.BusinessPlace,
        ISNULL(rh.SeqNo, poi.SpecNo) AS SpecNo,
        ISNULL(rh.UnitPrice, poi.UnitPrice) AS UnitPrice,
        poi.Quantity AS OrderedQty,
        im.StorageLocation,
        im.Unit,
        im.VehicleModel
      FROM dbo.ReceiptHistory rh
      JOIN dbo.PurchaseOrder po ON po.Id = rh.PurchaseOrderId
      LEFT JOIN dbo.PurchaseOrderItem poi
        ON poi.PurchaseOrderId = rh.PurchaseOrderId
        AND (
          (rh.SeqNo IS NOT NULL AND poi.SpecNo    = rh.SeqNo)
          OR
          (rh.SeqNo IS NULL     AND poi.ItemCode  = rh.ItemCode
            AND poi.SpecNo = (
              SELECT MIN(SpecNo) FROM dbo.PurchaseOrderItem
              WHERE PurchaseOrderId = rh.PurchaseOrderId AND ItemCode = rh.ItemCode
            )
          )
        )
      LEFT JOIN dbo.ItemMaster im ON im.ItemNo = rh.ItemCode
      WHERE 1=1
        AND (@DateFrom      IS NULL OR rh.ReceiptDate   >= @DateFrom)
        AND (@DateTo        IS NULL OR rh.ReceiptDate   <= @DateTo)
        AND (@ItemCode      IS NULL OR rh.ItemCode      LIKE @ItemCode + '%')
        AND (@PoNumber      IS NULL OR po.PoNumber      LIKE '%' + @PoNumber + '%')
        AND (@Warehouse     IS NULL OR rh.Warehouse     = @Warehouse)
        AND (@SupplierCode  IS NULL OR po.SupplierCode  LIKE @SupplierCode + '%')
        AND (@Type          IS NULL OR rh.Type          = @Type)
        AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        AND (@Model         IS NULL OR im.VehicleModel  LIKE '%' + @Model + '%')
      ORDER BY po.PoNumber ASC, ISNULL(rh.SeqNo, poi.SpecNo) ASC, rh.ProcessedAt DESC
    `);

    const items = result.recordset.map((r: Record<string, unknown>) => {
      const qty       = Number(r.Qty ?? 0);
      const unitPrice = Number(r.UnitPrice ?? 0);
      return {
        id:           String(r.Id),
        receiptNo:    String(r.ReceiptNo ?? ""),
        processedAt:  String(r.ProcessedAt ?? ""),
        type:         String(r.Type ?? ""),
        itemCode:     String(r.ItemCode ?? ""),
        itemName:     String(r.ItemName ?? ""),
        qty,
        receiptDate:  String(r.ReceiptDate ?? ""),
        warehouse:    String(r.Warehouse ?? ""),
        lotNo:        String(r.LotNo ?? ""),
        note:         String(r.Note ?? ""),
        poNumber:     String(r.PoNumber ?? ""),
        supplierCode: String(r.SupplierCode ?? ""),
        supplierName: String(r.SupplierName ?? ""),
        buyerName:    String(r.BuyerName ?? ""),
        businessPlace:String(r.BusinessPlace ?? ""),
        specNo:          Number(r.SpecNo ?? 0),
        unitPrice,
        receiptAmount:   Math.round(qty * unitPrice),
        orderedQty:      Number(r.OrderedQty ?? 0),
        storageLocation: String(r.StorageLocation ?? ""),
        unit:            String(r.Unit ?? ""),
        vehicleModel:    String(r.VehicleModel ?? ""),
      };
    });

    const totalQty    = items.reduce((s, i) => s + i.qty, 0);
    const totalAmount = items.reduce((s, i) => s + i.receiptAmount, 0);

    return NextResponse.json({ ok: true, items, totalQty, totalAmount });
  } catch (error) {
    console.error("[purchase-receipts/history][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
