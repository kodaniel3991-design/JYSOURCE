import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

async function ensureReceiptHistoryTable(pool: Awaited<ReturnType<typeof getDbPool>>) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.ReceiptHistory (
        Id INT IDENTITY(1,1) PRIMARY KEY, PurchaseOrderId INT NOT NULL,
        ReceiptNo NVARCHAR(30) NOT NULL, ProcessedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        Type NVARCHAR(10) NOT NULL, ItemCode NVARCHAR(50) NOT NULL, ItemName NVARCHAR(200) NULL,
        Qty DECIMAL(18,3) NOT NULL DEFAULT 0, ReceiptDate DATE NULL,
        Warehouse NVARCHAR(20) NULL, LotNo NVARCHAR(100) NULL, Note NVARCHAR(500) NULL,
        SeqNo INT NULL,
        CONSTRAINT FK_ReceiptHistory_PurchaseOrder FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id) ON DELETE CASCADE
      );
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND name = N'SeqNo')
    BEGIN
      ALTER TABLE dbo.ReceiptHistory ADD SeqNo INT NULL;
    END
  `);
}

function makeReturnNo(seq: number) {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `RTN-${d}-${String(seq).padStart(4, "0")}`;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const poId = Number(params.id);
    const body = await request.json();
    const items = (body.items ?? []) as {
      itemCode: string; itemName: string; specNo?: number;
      returnQty: number; receiptDate: string;
      warehouse: string; lotNo: string; note: string;
    }[];

    const targets = items.filter((i) => i.returnQty > 0);
    if (targets.length === 0)
      return NextResponse.json({ ok: false, message: "반품수량이 없습니다." }, { status: 400 });

    const pool = await getDbPool();
    await ensureReceiptHistoryTable(pool);

    // 매입확정(회계처리) 된 품목은 반품 불가
    const itemCodes = targets.map((i) => `N'${i.itemCode.replace(/'/g, "''")}'`).join(",");
    const lockCheck = await pool.request()
      .input("PurchaseOrderId", sql.Int, poId)
      .query(`
        SELECT COUNT(1) AS Cnt
        FROM dbo.PurchaseInputItem pii
        JOIN dbo.PurchaseInput pi ON pi.Id = pii.PurchaseInputId
        JOIN dbo.ReceiptHistory rh ON rh.Id = pii.ReceiptHistoryId
        WHERE rh.PurchaseOrderId = @PurchaseOrderId
          AND pii.ItemCode IN (${itemCodes})
          AND pi.Status = N'회계처리'
      `);
    if (Number(lockCheck.recordset[0].Cnt) > 0)
      return NextResponse.json({ ok: false, message: "매입확정(회계처리) 된 품목은 반품처리할 수 없습니다." }, { status: 423 });

    // 반품번호 생성
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const countResult = await pool.request()
      .input("Pattern", sql.NVarChar(20), `RTN-${dateStr}-%`)
      .query(`SELECT COUNT(1) AS Cnt FROM dbo.ReceiptHistory WHERE ReceiptNo LIKE @Pattern`);
    const seq = Number(countResult.recordset[0].Cnt) + 1;
    const returnNo = makeReturnNo(seq);
    const processedAt = new Date();

    for (const it of targets) {
      // ReceivedQty 감소 (SpecNo 있으면 행 특정, 없으면 ItemCode fallback)
      const updateReq = pool.request()
        .input("PurchaseOrderId", sql.Int, poId)
        .input("ItemCode", sql.NVarChar(50), it.itemCode)
        .input("ReturnQty", sql.Decimal(18, 3), it.returnQty);
      if (it.specNo != null) {
        updateReq.input("SpecNo", sql.Int, it.specNo);
        await updateReq.query(`
          UPDATE dbo.PurchaseOrderItem
          SET ReceivedQty = CASE WHEN ReceivedQty - @ReturnQty < 0 THEN 0 ELSE ReceivedQty - @ReturnQty END
          WHERE PurchaseOrderId = @PurchaseOrderId AND SpecNo = @SpecNo
        `);
      } else {
        await updateReq.query(`
          UPDATE dbo.PurchaseOrderItem
          SET ReceivedQty = CASE WHEN ReceivedQty - @ReturnQty < 0 THEN 0 ELSE ReceivedQty - @ReturnQty END
          WHERE PurchaseOrderId = @PurchaseOrderId AND ItemCode = @ItemCode
        `);
      }

      // 이력 삽입
      await pool.request()
        .input("PurchaseOrderId",  sql.Int,           poId)
        .input("ReceiptNo",        sql.NVarChar(30),  returnNo)
        .input("ProcessedAt",      sql.DateTime2,     processedAt)
        .input("Type",             sql.NVarChar(10),  "반품")
        .input("ItemCode",         sql.NVarChar(50),  it.itemCode)
        .input("ItemName",         sql.NVarChar(200), it.itemName ?? "")
        .input("Qty",              sql.Decimal(18, 3),it.returnQty)
        .input("ReceiptDate",      sql.Date,          it.receiptDate || null)
        .input("Warehouse",        sql.NVarChar(20),  it.warehouse ?? null)
        .input("LotNo",            sql.NVarChar(100), it.lotNo ?? null)
        .input("Note",             sql.NVarChar(500), it.note ?? null)
        .input("SeqNo",            sql.Int,           it.specNo ?? null)
        .query(`
          INSERT INTO dbo.ReceiptHistory
            (PurchaseOrderId, ReceiptNo, ProcessedAt, Type, ItemCode, ItemName, Qty, ReceiptDate, Warehouse, LotNo, Note, SeqNo)
          VALUES
            (@PurchaseOrderId, @ReceiptNo, @ProcessedAt, @Type, @ItemCode, @ItemName, @Qty, @ReceiptDate, @Warehouse, @LotNo, @Note, @SeqNo)
        `);
    }

    // 오더 상태 재계산
    const checkResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, poId)
      .query(`
        SELECT SUM(Quantity) AS TotalQty, SUM(ReceivedQty) AS TotalReceived
        FROM dbo.PurchaseOrderItem
        WHERE PurchaseOrderId = @PurchaseOrderId
      `);
    const totalQty = Number(checkResult.recordset[0].TotalQty ?? 0);
    const totalReceived = Number(checkResult.recordset[0].TotalReceived ?? 0);
    const newStatus = totalReceived <= 0 ? "issued" : totalReceived >= totalQty ? "received" : "partial";

    await pool.request()
      .input("Id", sql.Int, poId)
      .input("OrderStatus", sql.NVarChar(20), newStatus)
      .query(`UPDATE dbo.PurchaseOrder SET OrderStatus = @OrderStatus, UpdatedAt = GETDATE() WHERE Id = @Id`);

    return NextResponse.json({ ok: true, returnNo });
  } catch (error) {
    console.error("[purchase-receipts][POST/:id/return]", error);
    return NextResponse.json({ ok: false, message: "반품처리 실패" }, { status: 500 });
  }
}
