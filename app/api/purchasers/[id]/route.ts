import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, message: "잘못된 ID 입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const p = body ?? {};

    if (!p.purchaserNo || !p.purchaserName) {
      return NextResponse.json(
        { ok: false, message: "구매처번호와 구매처명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();

    req.input("Id", sql.Int, id);
    req.input("PurchaserNo", sql.NVarChar(50), p.purchaserNo);
    req.input("PurchaserName", sql.NVarChar(200), p.purchaserName);
    req.input("TransactionType", sql.NVarChar(50), p.transactionType || null);
    req.input("BusinessNo", sql.NVarChar(50), p.businessNo || null);
    req.input("RepresentativeName", sql.NVarChar(100), p.representativeName || null);
    req.input("BusinessTypeName", sql.NVarChar(100), p.businessTypeName || null);
    req.input("BusinessItemName", sql.NVarChar(200), p.businessItemName || null);
    req.input("PostalCode", sql.NVarChar(20), p.postalCode || null);
    req.input("Address", sql.NVarChar(500), p.address || null);
    req.input("PhoneNo", sql.NVarChar(50), p.phoneNo || null);
    req.input("FaxNo", sql.NVarChar(50), p.faxNo || null);
    req.input("MobileNo", sql.NVarChar(50), p.mobileNo || null);
    req.input("Email", sql.NVarChar(200), p.email || null);
    req.input("ContactPerson", sql.NVarChar(100), p.contactPerson || null);
    req.input("ContactDept", sql.NVarChar(100), p.contactDept || null);
    req.input("SuspensionDate", sql.Date, p.suspensionDate || null);
    req.input("SuspensionReason", sql.NVarChar(200), p.suspensionReason || "거래중");
    req.input("Modifier", sql.NVarChar(100), p.modifier || null);

    await req.query(`
      UPDATE dbo.Purchaser SET
        PurchaserNo       = @PurchaserNo,
        PurchaserName     = @PurchaserName,
        TransactionType   = @TransactionType,
        BusinessNo        = @BusinessNo,
        RepresentativeName = @RepresentativeName,
        BusinessTypeName  = @BusinessTypeName,
        BusinessItemName  = @BusinessItemName,
        PostalCode        = @PostalCode,
        Address           = @Address,
        PhoneNo           = @PhoneNo,
        FaxNo             = @FaxNo,
        MobileNo          = @MobileNo,
        Email             = @Email,
        ContactPerson     = @ContactPerson,
        ContactDept       = @ContactDept,
        SuspensionDate    = @SuspensionDate,
        SuspensionReason  = @SuspensionReason,
        Modifier          = @Modifier,
        UpdatedAt         = GETDATE()
      WHERE Id = @Id
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchasers][PUT]", error);
    let message = "구매처 수정 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 구매처번호입니다.";
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
      return NextResponse.json(
        { ok: false, message: "잘못된 ID 입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);
    await req.query(`DELETE FROM dbo.Purchaser WHERE Id = @Id`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchasers][DELETE]", error);
    return NextResponse.json(
      { ok: false, message: "구매처 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
