import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

async function ensureReceiptHistoryTable(pool: Awaited<ReturnType<typeof getDbPool>>) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.ReceiptHistory (
        Id              INT            IDENTITY(1,1) PRIMARY KEY,
        PurchaseOrderId INT            NOT NULL,
        ReceiptNo       NVARCHAR(30)   NOT NULL,
        ProcessedAt     DATETIME2      NOT NULL DEFAULT GETDATE(),
        Type            NVARCHAR(10)   NOT NULL,
        ItemCode        NVARCHAR(50)   NOT NULL,
        ItemName        NVARCHAR(200)  NULL,
        Qty             DECIMAL(18,3)  NOT NULL DEFAULT 0,
        ReceiptDate     DATE           NULL,
        Warehouse       NVARCHAR(20)   NULL,
        LotNo           NVARCHAR(100)  NULL,
        Note            NVARCHAR(500)  NULL,
        SeqNo           INT            NULL,
        CONSTRAINT FK_ReceiptHistory_PurchaseOrder
          FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id) ON DELETE CASCADE
      );
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND name = N'SeqNo')
    BEGIN
      ALTER TABLE dbo.ReceiptHistory ADD SeqNo INT NULL;
    END
  `);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getDbPool();
    const poId = Number(params.id);

    // 테이블 없으면 자동 생성
    await ensureReceiptHistoryTable(pool);

    // 명세 행 조회 (ItemMaster JOIN으로 단위/모델/저장위치 포함)
    const specResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, poId)
      .query(`
        SELECT
          poi.SpecNo, poi.ItemCode, poi.ItemName, poi.Specification, poi.Warehouse,
          poi.Quantity AS OrderedQty,
          poi.ReceivedQty,
          CASE WHEN poi.Quantity - poi.ReceivedQty < 0 THEN 0 ELSE poi.Quantity - poi.ReceivedQty END AS PendingQty,
          ISNULL(im.Unit, '')            AS Unit,
          ISNULL(im.VehicleModel, '')    AS VehicleModel,
          ISNULL(im.StorageLocation, '') AS StorageLocation
        FROM dbo.PurchaseOrderItem poi
        LEFT JOIN dbo.ItemMaster im ON im.ItemNo = poi.ItemCode
        WHERE poi.PurchaseOrderId = @PurchaseOrderId
        ORDER BY poi.SpecNo
      `);

    const specRows = specResult.recordset.map((r: Record<string, unknown>) => ({
      seq:             Number(r.SpecNo ?? 0),
      itemCode:        String(r.ItemCode ?? ""),
      itemName:        String(r.ItemName ?? ""),
      specification:   String(r.Specification ?? ""),
      warehouse:       String(r.Warehouse ?? ""),
      orderedQty:      Number(r.OrderedQty ?? 0),
      receivedQty:     Number(r.ReceivedQty ?? 0),
      pendingQty:      Number(r.PendingQty ?? 0),
      inputQty:        0,
      returnQty:       0,
      receiptDate:     new Date().toISOString().slice(0, 10),
      lotNo:           "",
      note:            "",
      unit:            String(r.Unit ?? ""),
      vehicleModel:    String(r.VehicleModel ?? ""),
      storageLocation: String(r.StorageLocation ?? ""),
    }));

    // 입고 히스토리 조회 (ItemMaster JOIN으로 단위/모델/저장위치 포함)
    const histResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, poId)
      .query(`
        SELECT
          rh.Id, rh.ReceiptNo,
          CONVERT(NVARCHAR(16), rh.ProcessedAt, 120) AS ProcessedAt,
          rh.Type, rh.ItemCode, rh.ItemName,
          rh.Qty,
          CONVERT(NVARCHAR(10), rh.ReceiptDate, 23) AS ReceiptDate,
          rh.Warehouse, rh.LotNo, rh.Note, rh.SeqNo,
          ISNULL(im.Unit, '')            AS Unit,
          ISNULL(im.VehicleModel, '')    AS VehicleModel,
          ISNULL(im.StorageLocation, '') AS StorageLocation
        FROM dbo.ReceiptHistory rh
        LEFT JOIN dbo.ItemMaster im ON im.ItemNo = rh.ItemCode
        WHERE rh.PurchaseOrderId = @PurchaseOrderId
        ORDER BY rh.ProcessedAt DESC
      `);

    const history = histResult.recordset.map((r: Record<string, unknown>) => ({
      id:              String(r.Id),
      receiptNo:       String(r.ReceiptNo ?? ""),
      processedAt:     String(r.ProcessedAt ?? "").replace("T", " "),
      type:            String(r.Type ?? "") as "입고" | "반품",
      itemCode:        String(r.ItemCode ?? ""),
      itemName:        String(r.ItemName ?? ""),
      qty:             Number(r.Qty ?? 0),
      receiptDate:     String(r.ReceiptDate ?? ""),
      warehouse:       String(r.Warehouse ?? ""),
      lotNo:           String(r.LotNo ?? ""),
      note:            String(r.Note ?? ""),
      unit:            String(r.Unit ?? ""),
      vehicleModel:    String(r.VehicleModel ?? ""),
      storageLocation: String(r.StorageLocation ?? ""),
      specNo:          r.SeqNo != null ? Number(r.SeqNo) : null,
    }));

    return NextResponse.json({ ok: true, specRows, history });
  } catch (error) {
    console.error("[purchase-receipts][GET/:id]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
