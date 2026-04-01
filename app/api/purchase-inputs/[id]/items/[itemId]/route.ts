import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const id     = Number(params.id);
  const itemId = Number(params.itemId);
  if (!id || !itemId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const pool = await getDbPool();
    await pool.request()
      .input("Id",              sql.Int, itemId)
      .input("PurchaseInputId", sql.Int, id)
      .query(`DELETE FROM dbo.PurchaseInputItem WHERE Id=@Id AND PurchaseInputId=@PurchaseInputId`);

    // 헤더 합계 재계산
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        UPDATE dbo.PurchaseInput SET
          TotalAmount  = (SELECT ISNULL(SUM(InputAmount),0)  FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id),
          TaxAmount    = (SELECT ISNULL(SUM(TaxAmount),0)    FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id),
          TotalWithTax = (SELECT ISNULL(SUM(TotalWithTax),0) FROM dbo.PurchaseInputItem WHERE PurchaseInputId=@Id)
        WHERE Id=@Id
      `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-inputs/[id]/items/[itemId]][DELETE]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
