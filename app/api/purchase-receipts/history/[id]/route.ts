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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

  try {
    const pool = await getDbPool();

    // 매입확정(회계처리) 상태이면 삭제 불가
    const lockCheck = await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT COUNT(1) AS Cnt
        FROM dbo.PurchaseInputItem pii
        WHERE pii.ReceiptHistoryId = @Id
      `);
    if (Number(lockCheck.recordset[0].Cnt) > 0)
      return NextResponse.json({ ok: false, message: "매입실적처리된 입고이력은 삭제할 수 없습니다." }, { status: 423 });

    // 기존 값 조회 (PurchaseOrderId 필요)
    const prev = await pool.request()
      .input("Id", sql.Int, id)
      .query(`SELECT PurchaseOrderId FROM dbo.ReceiptHistory WHERE Id = @Id`);
    if (!prev.recordset.length)
      return NextResponse.json({ ok: false, message: "이력을 찾을 수 없습니다." }, { status: 404 });

    const purchaseOrderId = Number(prev.recordset[0].PurchaseOrderId);

    // 이력 삭제
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM dbo.ReceiptHistory WHERE Id = @Id`);

    // 오더 상태 재계산 — ReceiptHistory 순 합계 기준
    const checkResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, purchaseOrderId)
      .query(`
        SELECT
          SUM(poi.Quantity) AS TotalQty,
          ISNULL(SUM(rh_agg.ReceivedQty), 0) AS TotalReceived
        FROM dbo.PurchaseOrderItem poi
        LEFT JOIN (
          SELECT SeqNo, SUM(CASE WHEN Type = N'입고' THEN Qty ELSE -Qty END) AS ReceivedQty
          FROM dbo.ReceiptHistory
          WHERE PurchaseOrderId = @PurchaseOrderId
          GROUP BY SeqNo
        ) rh_agg ON rh_agg.SeqNo = poi.SpecNo
        WHERE poi.PurchaseOrderId = @PurchaseOrderId
      `);
    const totalQty      = Number(checkResult.recordset[0].TotalQty ?? 0);
    const totalReceived = Number(checkResult.recordset[0].TotalReceived ?? 0);
    const newStatus = totalReceived <= 0 ? "issued" : totalReceived >= totalQty ? "received" : "partial";
    await pool.request()
      .input("Id",          sql.Int,          purchaseOrderId)
      .input("OrderStatus", sql.NVarChar(20), newStatus)
      .query(`UPDATE dbo.PurchaseOrder SET OrderStatus = @OrderStatus, UpdatedAt = GETDATE() WHERE Id = @Id`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[purchase-receipts/history][DELETE]", err);
    return NextResponse.json({ ok: false, message: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
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

    // 기존 값 조회
    const prev = await pool.request()
      .input("Id", sql.Int, id)
      .query(`SELECT PurchaseOrderId FROM dbo.ReceiptHistory WHERE Id = @Id`);
    if (!prev.recordset.length)
      return NextResponse.json({ ok: false, message: "이력을 찾을 수 없습니다." }, { status: 404 });

    // 이력 업데이트
    await pool.request()
      .input("Id",          sql.Int,            id)
      .input("ReceiptDate", sql.Date,           receiptDate || null)
      .input("Qty",         sql.Decimal(18, 3), qty)
      .input("UnitPrice",   sql.Decimal(18, 4), unitPrice ?? null)
      .query(`
        UPDATE dbo.ReceiptHistory
        SET ReceiptDate = @ReceiptDate,
            Qty         = @Qty,
            UnitPrice   = @UnitPrice
        WHERE Id = @Id
      `);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[purchase-receipts/history][PUT]", err);
    return NextResponse.json({ ok: false, message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
