import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

/** EXCEL 업로드로 들어오는 한 행 (기존 PurchasePrice 테이블 컬럼 기준) */
type IncomingPurchasePrice = {
  itemCode: string;
  itemName: string;
  itemSpec?: string;
  supplierName: string;
  plant?: string;
  applyDate: string;
  expireDate: string;
  unitPrice: number;
  devUnitPrice?: number;
  discountRate?: number;
  currency?: string;
  remarks?: string;
};

function toDate(v: string | undefined): Date | null {
  if (!v || !String(v).trim()) return null;
  const d = new Date(String(v).trim());
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: IncomingPurchasePrice[] };
    const items = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "등록할 구매단가 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    let insertedCount = 0;
    let invalidCount = 0;

    for (const p of items) {
      if (!p.itemCode?.trim() || !p.itemName?.trim() || !p.supplierName?.trim()) {
        invalidCount++;
        continue;
      }
      const applyDate = toDate(p.applyDate);
      const expireDate = toDate(p.expireDate);
      if (!applyDate || !expireDate) {
        invalidCount++;
        continue;
      }

      const unitPrice = Number(p.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        invalidCount++;
        continue;
      }

      try {
        const req = pool.request();
        req.input("ItemCode", sql.NVarChar(50), p.itemCode.trim());
        req.input("ItemName", sql.NVarChar(200), p.itemName.trim());
        req.input("ItemSpec", sql.NVarChar(200), (p.itemSpec ?? "").trim() || null);
        req.input("SupplierName", sql.NVarChar(200), p.supplierName.trim());
        req.input("Plant", sql.NVarChar(100), (p.plant ?? "").trim() || null);
        req.input("ApplyDate", sql.Date, applyDate);
        req.input("ExpireDate", sql.Date, expireDate);
        req.input("UnitPrice", sql.Decimal(18, 4), unitPrice);
        req.input("DevUnitPrice", sql.Decimal(18, 4), p.devUnitPrice != null ? Number(p.devUnitPrice) : null);
        req.input("DiscountRate", sql.Decimal(5, 2), p.discountRate != null ? Number(p.discountRate) : 0);
        req.input("Currency", sql.NVarChar(10), (p.currency ?? "KRW").trim() || "KRW");
        req.input("Remarks", sql.NVarChar(500), (p.remarks ?? "").trim() || null);

        await req.query(`
          INSERT INTO dbo.PurchasePrice (
            ItemCode, ItemName, ItemSpec, SupplierName, Plant, ApplyDate, ExpireDate,
            UnitPrice, DevUnitPrice, DiscountRate, Currency, Remarks
          )
          VALUES (
            @ItemCode, @ItemName, @ItemSpec, @SupplierName, @Plant, @ApplyDate, @ExpireDate,
            @UnitPrice, @DevUnitPrice, @DiscountRate, @Currency, @Remarks
          )
        `);
        insertedCount++;
      } catch (rowErr) {
        invalidCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      count: insertedCount,
      invalid: invalidCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[purchase-prices/import]", msg);
    return NextResponse.json(
      { ok: false, message: `DB 저장 중 오류가 발생했습니다: ${msg}` },
      { status: 500 }
    );
  }
}
