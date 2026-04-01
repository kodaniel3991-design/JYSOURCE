import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

type ApplyItem = {
  poId:         number;
  specNo:       number;
  newUnitPrice: number;
  quantity:     number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: ApplyItem[] };
    const items = body.items ?? [];

    if (!items.length) {
      return NextResponse.json({ ok: false, message: "적용할 항목을 선택하세요." }, { status: 400 });
    }

    const pool = await getDbPool();
    let count = 0;

    for (const it of items) {
      const newAmount = it.newUnitPrice * it.quantity;
      await pool.request()
        .input("PoId",        sql.Int,          it.poId)
        .input("SpecNo",      sql.Int,          it.specNo)
        .input("UnitPrice",   sql.Decimal(18,4), it.newUnitPrice)
        .input("Amount",      sql.Decimal(18,2), newAmount)
        .query(`
          UPDATE dbo.PurchaseOrderItem
          SET UnitPrice = @UnitPrice,
              Amount    = @Amount
          WHERE PurchaseOrderId = @PoId
            AND SpecNo          = @SpecNo
        `);
      count++;
    }

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[price-verification/apply]", err);
    return NextResponse.json({ ok: false, message: "단가 적용 중 오류가 발생했습니다." }, { status: 500 });
  }
}
