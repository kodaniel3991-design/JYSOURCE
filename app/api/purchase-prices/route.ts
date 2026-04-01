import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import type { PurchasePriceRecord } from "@/types/purchase-price";

function rowToRecord(r: {
  Id: number;
  ItemCode: string;
  ItemName: string;
  ItemSpec: string | null;
  SupplierName: string;
  Plant: string | null;
  ApplyDate: Date | string;
  ExpireDate: Date | string | null;
  UnitPrice: number;
  DevUnitPrice: number | null;
  DiscountRate: number | null;
  Currency: string | null;
  Remarks: string | null;
}): PurchasePriceRecord {
  const toDateStr = (v: Date | string | null) =>
    v == null ? "" : String(v).slice(0, 10);
  return {
    id: String(r.Id),
    itemCode: r.ItemCode ?? "",
    itemName: r.ItemName ?? "",
    itemSpec: r.ItemSpec ?? "",
    supplierCode: "",
    supplierName: r.SupplierName ?? "",
    applyDate: toDateStr(r.ApplyDate),
    unitPrice: Number(r.UnitPrice) ?? 0,
    expireDate: toDateStr(r.ExpireDate),
    currency: r.Currency ?? "KRW",
    currencyCode: r.Currency ?? "KRW",
    remarks: r.Remarks ?? undefined,
    plant: r.Plant ?? undefined,
    devUnitPrice: r.DevUnitPrice != null ? Number(r.DevUnitPrice) : undefined,
    discountRate: r.DiscountRate != null ? Number(r.DiscountRate) : undefined,
  };
}

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        Id, ItemCode, ItemName, ItemSpec, SupplierName, Plant,
        ApplyDate, ExpireDate, UnitPrice, DevUnitPrice, DiscountRate,
        Currency, Remarks
      FROM dbo.PurchasePrice
      ORDER BY UpdatedAt DESC, Id DESC
    `);

    const items: PurchasePriceRecord[] = (result.recordset ?? []).map(
      (r: Record<string, unknown>) =>
        rowToRecord({
          Id: r.Id as number,
          ItemCode: r.ItemCode as string,
          ItemName: r.ItemName as string,
          ItemSpec: r.ItemSpec as string | null,
          SupplierName: r.SupplierName as string,
          Plant: r.Plant as string | null,
          ApplyDate: r.ApplyDate as Date | string,
          ExpireDate: r.ExpireDate as Date | string | null,
          UnitPrice: r.UnitPrice as number,
          DevUnitPrice: r.DevUnitPrice as number | null,
          DiscountRate: r.DiscountRate as number | null,
          Currency: r.Currency as string | null,
          Remarks: r.Remarks as string | null,
        })
    );

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-prices][GET]", error);
    return NextResponse.json(
      { ok: false, message: "구매단가 조회 중 오류가 발생했습니다.", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemCode, itemName, itemSpec, supplierName, plant,
      applyDate, expireDate, unitPrice, devUnitPrice, discountRate,
      currency, currencyCode, remarks,
    } = body;

    if (!itemCode?.trim() || !supplierName?.trim() || !applyDate) {
      return NextResponse.json({ ok: false, message: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input("ItemCode",     sql.NVarChar(50),  itemCode.trim())
      .input("ItemName",     sql.NVarChar(200), itemName?.trim() ?? "")
      .input("ItemSpec",     sql.NVarChar(200), itemSpec?.trim() || null)
      .input("SupplierName", sql.NVarChar(200), supplierName.trim())
      .input("Plant",        sql.NVarChar(100), plant?.trim() || null)
      .input("ApplyDate",    sql.Date,          applyDate)
      .input("ExpireDate",   sql.Date,          expireDate || null)
      .input("UnitPrice",    sql.Decimal(18,4), Number(unitPrice))
      .input("DevUnitPrice", sql.Decimal(18,4), devUnitPrice != null ? Number(devUnitPrice) : null)
      .input("DiscountRate", sql.Decimal(5,2),  discountRate != null ? Number(discountRate) : null)
      .input("Currency",     sql.NVarChar(10),  currencyCode ?? currency ?? "KRW")
      .input("Remarks",      sql.NVarChar(500), remarks?.trim() || null)
      .query(`
        INSERT INTO dbo.PurchasePrice
          (ItemCode, ItemName, ItemSpec, SupplierName, Plant, ApplyDate, ExpireDate,
           UnitPrice, DevUnitPrice, DiscountRate, Currency, Remarks)
        OUTPUT INSERTED.Id
        VALUES
          (@ItemCode, @ItemName, @ItemSpec, @SupplierName, @Plant, @ApplyDate, @ExpireDate,
           @UnitPrice, @DevUnitPrice, @DiscountRate, @Currency, @Remarks)
      `);

    const newId = result.recordset[0]?.Id;
    return NextResponse.json({ ok: true, id: String(newId) });
  } catch (error) {
    console.error("[purchase-prices][POST]", error);
    return NextResponse.json({ ok: false, message: "등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
