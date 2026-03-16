import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        Id, PurchaserNo, PurchaserName, TransactionType, BusinessNo,
        RepresentativeName, BusinessTypeName, BusinessItemName,
        PostalCode, Address, PhoneNo, FaxNo, MobileNo, Email,
        ContactPerson, ContactDept,
        CONVERT(NVARCHAR(10), SuspensionDate, 120) AS SuspensionDate,
        SuspensionReason, Registrant, Modifier
      FROM dbo.Purchaser
      ORDER BY UpdatedAt DESC, CreatedAt DESC
    `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[purchasers][GET]", error);
    return NextResponse.json(
      { ok: false, message: "구매처 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
    req.input("Registrant", sql.NVarChar(100), p.registrant || null);
    req.input("Modifier", sql.NVarChar(100), p.modifier || null);

    const result = await req.query(`
      INSERT INTO dbo.Purchaser (
        PurchaserNo, PurchaserName, TransactionType, BusinessNo,
        RepresentativeName, BusinessTypeName, BusinessItemName,
        PostalCode, Address, PhoneNo, FaxNo, MobileNo, Email,
        ContactPerson, ContactDept, SuspensionDate, SuspensionReason,
        Registrant, Modifier
      )
      OUTPUT INSERTED.Id
      VALUES (
        @PurchaserNo, @PurchaserName, @TransactionType, @BusinessNo,
        @RepresentativeName, @BusinessTypeName, @BusinessItemName,
        @PostalCode, @Address, @PhoneNo, @FaxNo, @MobileNo, @Email,
        @ContactPerson, @ContactDept, @SuspensionDate, @SuspensionReason,
        @Registrant, @Modifier
      )
    `);

    return NextResponse.json({ ok: true, id: result.recordset[0].Id });
  } catch (error) {
    console.error("[purchasers][POST]", error);
    let message = "구매처 저장 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 구매처번호입니다.";
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
