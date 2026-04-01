import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("PurchaseInputId", sql.Int, id)
      .query(`
        SELECT Id, SeqNo, ReceiptHistoryId, ReceiptNo,
               ItemCode, ItemName, Unit,
               InputQty, InputAmount, ConvertedAmount,
               TaxAmount, TotalWithTax, Note, PurchaseOrderNo
        FROM dbo.PurchaseInputItem
        WHERE PurchaseInputId = @PurchaseInputId
        ORDER BY SeqNo
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      id:               String(r.Id),
      seqNo:            Number(r.SeqNo           ?? 0),
      receiptHistoryId: r.ReceiptHistoryId ? String(r.ReceiptHistoryId) : null,
      receiptNo:        String(r.ReceiptNo        ?? ""),
      itemCode:         String(r.ItemCode         ?? ""),
      itemName:         String(r.ItemName         ?? ""),
      unit:             String(r.Unit             ?? ""),
      inputQty:         Number(r.InputQty         ?? 0),
      inputAmount:      Number(r.InputAmount      ?? 0),
      convertedAmount:  Number(r.ConvertedAmount  ?? 0),
      taxAmount:        Number(r.TaxAmount        ?? 0),
      totalWithTax:     Number(r.TotalWithTax     ?? 0),
      note:             String(r.Note             ?? ""),
      purchaseOrderNo:  String(r.PurchaseOrderNo  ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-inputs/[id]/items][GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const rows = await request.json() as Array<{
      receiptHistoryId?: number;
      receiptNo?: string;
      itemCode: string;
      itemName?: string;
      unit?: string;
      inputQty: number;
      inputAmount: number;
      taxAmount?: number;
      note?: string;
      purchaseOrderNo?: string;
    }>;

    const pool = await getDbPool();

    const seqRes = await pool.request()
      .input("PurchaseInputId", sql.Int, id)
      .query(`SELECT ISNULL(MAX(SeqNo),0) AS MaxSeq FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@PurchaseInputId`);
    let seqNo = Number(seqRes.recordset[0].MaxSeq);

    for (const row of rows) {
      seqNo++;
      const taxAmt   = row.taxAmount   ?? Math.round(row.inputAmount * 0.1);
      const totalAmt = row.inputAmount + taxAmt;

      await pool.request()
        .input("PurchaseInputId",  sql.Int,          id)
        .input("SeqNo",            sql.Int,          seqNo)
        .input("ReceiptHistoryId", sql.Int,          row.receiptHistoryId || null)
        .input("ReceiptNo",        sql.NVarChar(30), row.receiptNo        || null)
        .input("ItemCode",         sql.NVarChar(50), row.itemCode)
        .input("ItemName",         sql.NVarChar(200),row.itemName         || null)
        .input("Unit",             sql.NVarChar(20), row.unit             || null)
        .input("InputQty",         sql.Decimal(18,3),row.inputQty)
        .input("InputAmount",      sql.Decimal(18,0),row.inputAmount)
        .input("ConvertedAmount",  sql.Decimal(18,0),row.inputAmount)
        .input("TaxAmount",        sql.Decimal(18,0),taxAmt)
        .input("TotalWithTax",     sql.Decimal(18,0),totalAmt)
        .input("Note",             sql.NVarChar(500),row.note             || null)
        .input("PurchaseOrderNo",  sql.NVarChar(50), row.purchaseOrderNo  || null)
        .query(`
          INSERT INTO dbo.PurchaseInputItem
            (PurchaseInputId,SeqNo,ReceiptHistoryId,ReceiptNo,ItemCode,ItemName,Unit,
             InputQty,InputAmount,ConvertedAmount,TaxAmount,TotalWithTax,Note,PurchaseOrderNo)
          VALUES
            (@PurchaseInputId,@SeqNo,@ReceiptHistoryId,@ReceiptNo,@ItemCode,@ItemName,@Unit,
             @InputQty,@InputAmount,@ConvertedAmount,@TaxAmount,@TotalWithTax,@Note,@PurchaseOrderNo)
        `);
    }

    // 헤더 합계 재계산 + 상태를 "회계처리"로 변경
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        UPDATE dbo.PurchaseInput SET
          TotalAmount  = (SELECT ISNULL(SUM(InputAmount),0)  FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id),
          TaxAmount    = (SELECT ISNULL(SUM(TaxAmount),0)    FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id),
          TotalWithTax = (SELECT ISNULL(SUM(TotalWithTax),0) FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id),
          Status       = N'회계처리'
        WHERE Id=@Id
      `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-inputs/[id]/items][POST]", error);
    return NextResponse.json({ ok: false, message: "매입 처리 실패" }, { status: 500 });
  }
}
