import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        Id,
        ItemTypeCode,
        ItemTypeName,
        ProcurementType,
        SalesAccount,
        SalesAccountName,
        SalesCounterAccount,
        SalesCounterAccountName,
        PurchaseAccount,
        PurchaseAccountName,
        PurchaseCounterAccount,
        PurchaseCounterAccountName
      FROM dbo.ItemTypeCode
      ORDER BY ItemTypeCode ASC
    `);

    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[item-type-codes][GET]", error);
    return NextResponse.json(
      { ok: false, message: "품목형태코드 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemTypeCode, itemTypeName, procurementType,
      salesAccount, salesAccountName, salesCounterAccount, salesCounterAccountName,
      purchaseAccount, purchaseAccountName, purchaseCounterAccount, purchaseCounterAccountName,
    } = body ?? {};

    if (!itemTypeCode || !itemTypeName) {
      return NextResponse.json(
        { ok: false, message: "형태코드와 품목형태명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("ItemTypeCode", sql.NVarChar(10), itemTypeCode);
    req.input("ItemTypeName", sql.NVarChar(100), itemTypeName);
    req.input("ProcurementType", sql.NVarChar(100), procurementType || null);
    req.input("SalesAccount", sql.NVarChar(20), salesAccount || null);
    req.input("SalesAccountName", sql.NVarChar(100), salesAccountName || null);
    req.input("SalesCounterAccount", sql.NVarChar(20), salesCounterAccount || null);
    req.input("SalesCounterAccountName", sql.NVarChar(100), salesCounterAccountName || null);
    req.input("PurchaseAccount", sql.NVarChar(20), purchaseAccount || null);
    req.input("PurchaseAccountName", sql.NVarChar(100), purchaseAccountName || null);
    req.input("PurchaseCounterAccount", sql.NVarChar(20), purchaseCounterAccount || null);
    req.input("PurchaseCounterAccountName", sql.NVarChar(100), purchaseCounterAccountName || null);

    const result = await req.query(`
      INSERT INTO dbo.ItemTypeCode (
        ItemTypeCode, ItemTypeName, ProcurementType,
        SalesAccount, SalesAccountName, SalesCounterAccount, SalesCounterAccountName,
        PurchaseAccount, PurchaseAccountName, PurchaseCounterAccount, PurchaseCounterAccountName
      )
      OUTPUT INSERTED.Id
      VALUES (
        @ItemTypeCode, @ItemTypeName, @ProcurementType,
        @SalesAccount, @SalesAccountName, @SalesCounterAccount, @SalesCounterAccountName,
        @PurchaseAccount, @PurchaseAccountName, @PurchaseCounterAccount, @PurchaseCounterAccountName
      )
    `);

    return NextResponse.json({ ok: true, id: result.recordset[0]?.Id });
  } catch (error) {
    console.error("[item-type-codes][POST]", error);
    let message = "품목형태코드 저장 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 형태코드입니다.";
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
