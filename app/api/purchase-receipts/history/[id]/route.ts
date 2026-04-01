import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

/** ReceiptHistory 에 UnitPrice 컬럼이 없으면 자동 추가 */
async function ensureUnitPriceColumn() {
  const pool = await getDbPool();
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns
      WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND name = 'UnitPrice'
    )
      ALTER TABLE dbo.ReceiptHistory ADD UnitPrice DECIMAL(18,4) NULL
  `);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

  try {
    const body = await request.json();
    const { receiptDate, qty, unitPrice } = body as {
      receiptDate: string;
      qty: number;
      unitPrice: number;
    };

    await ensureUnitPriceColumn();
    const pool = await getDbPool();

    // 매입확정(회계처리) 상태이면 수정 불가
    const lockCheck = await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT COUNT(1) AS Cnt
        FROM dbo.PurchaseInputItem pii
        JOIN dbo.PurchaseInput pi ON pi.Id = pii.PurchaseInputId
        WHERE pii.ReceiptHistoryId = @Id AND pi.Status = N'회계처리'
      `);
    if (Number(lockCheck.recordset[0].Cnt) > 0)
      return NextResponse.json({ ok: false, message: "매입확정(회계처리) 된 입고이력은 수정할 수 없습니다." }, { status: 423 });

    // 기존 값 조회 (qty 변경분 계산용)
    const prev = await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT Qty, PurchaseOrderId, ItemCode
        FROM dbo.ReceiptHistory WHERE Id = @Id
      `);
    if (!prev.recordset.length)
      return NextResponse.json({ ok: false, message: "이력을 찾을 수 없습니다." }, { status: 404 });

    const oldQty       = Number(prev.recordset[0].Qty ?? 0);
    const purchaseOrderId = Number(prev.recordset[0].PurchaseOrderId);
    const itemCode        = String(prev.recordset[0].ItemCode);
    const qtyDiff      = qty - oldQty;

    // 이력 업데이트
    await pool.request()
      .input("Id",          sql.Int,           id)
      .input("ReceiptDate", sql.Date,          receiptDate || null)
      .input("Qty",         sql.Decimal(18, 3), qty)
      .input("UnitPrice",   sql.Decimal(18, 4), unitPrice ?? null)
      .query(`
        UPDATE dbo.ReceiptHistory
        SET ReceiptDate = @ReceiptDate,
            Qty         = @Qty,
            UnitPrice   = @UnitPrice
        WHERE Id = @Id
      `);

    // 입고량이 바뀐 경우 PurchaseOrderItem.ReceivedQty 동기화
    if (qtyDiff !== 0) {
      await pool.request()
        .input("PurchaseOrderId", sql.Int,          purchaseOrderId)
        .input("ItemCode",        sql.NVarChar(50), itemCode)
        .input("QtyDiff",         sql.Decimal(18, 3), qtyDiff)
        .query(`
          UPDATE dbo.PurchaseOrderItem
          SET ReceivedQty = CASE
            WHEN ReceivedQty + @QtyDiff < 0 THEN 0
            ELSE ReceivedQty + @QtyDiff
          END
          WHERE PurchaseOrderId = @PurchaseOrderId AND ItemCode = @ItemCode
        `);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[purchase-receipts/history][PUT]", err);
    return NextResponse.json({ ok: false, message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
