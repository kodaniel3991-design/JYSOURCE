import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, message: "잘못된 ID 입니다." }, { status: 400 });
    }

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
    req.input("Id", sql.Int, id);
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

    await req.query(`
      UPDATE dbo.ItemTypeCode
      SET
        ItemTypeCode = @ItemTypeCode,
        ItemTypeName = @ItemTypeName,
        ProcurementType = @ProcurementType,
        SalesAccount = @SalesAccount,
        SalesAccountName = @SalesAccountName,
        SalesCounterAccount = @SalesCounterAccount,
        SalesCounterAccountName = @SalesCounterAccountName,
        PurchaseAccount = @PurchaseAccount,
        PurchaseAccountName = @PurchaseAccountName,
        PurchaseCounterAccount = @PurchaseCounterAccount,
        PurchaseCounterAccountName = @PurchaseCounterAccountName,
        UpdatedAt = GETDATE()
      WHERE Id = @Id
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[item-type-codes][PUT]", error);
    let message = "품목형태코드 수정 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 형태코드입니다.";
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, message: "잘못된 ID 입니다." }, { status: 400 });
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);
    await req.query(`DELETE FROM dbo.ItemTypeCode WHERE Id = @Id`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[item-type-codes][DELETE]", error);
    return NextResponse.json(
      { ok: false, message: "품목형태코드 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
