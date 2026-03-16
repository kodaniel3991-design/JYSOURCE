import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

type IncomingPurchaser = {
  purchaserNo: string;
  purchaserName: string;
  transactionType?: string;
  businessNo?: string;
  representativeName?: string;
  businessTypeName?: string;
  businessItemName?: string;
  postalCode?: string;
  address?: string;
  phoneNo?: string;
  faxNo?: string;
  mobileNo?: string;
  email?: string;
  contactPerson?: string;
  contactDept?: string;
  suspensionDate?: string;
  suspensionReason?: string;
  registrant?: string;
  modifier?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: IncomingPurchaser[] };
    const items = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "등록할 구매처가 없습니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    let insertedCount = 0;
    let skippedCount = 0;

    for (const p of items) {
      if (!p.purchaserNo || !p.purchaserName) continue;

      const toDate = (v?: string) => {
        if (!v || !v.trim()) return null;
        const d = new Date(v.trim());
        return isNaN(d.getTime()) ? null : d;
      };

      const req = pool.request();
      req.input("PurchaserNo", sql.NVarChar(50), p.purchaserNo);
      req.input("PurchaserName", sql.NVarChar(200), p.purchaserName);
      req.input("TransactionType", sql.NVarChar(50), p.transactionType ?? null);
      req.input("BusinessNo", sql.NVarChar(50), p.businessNo ?? null);
      req.input("RepresentativeName", sql.NVarChar(100), p.representativeName ?? null);
      req.input("BusinessTypeName", sql.NVarChar(100), p.businessTypeName ?? null);
      req.input("BusinessItemName", sql.NVarChar(200), p.businessItemName ?? null);
      req.input("PostalCode", sql.NVarChar(20), p.postalCode ?? null);
      req.input("Address", sql.NVarChar(500), p.address ?? null);
      req.input("PhoneNo", sql.NVarChar(50), p.phoneNo ?? null);
      req.input("FaxNo", sql.NVarChar(50), p.faxNo ?? null);
      req.input("MobileNo", sql.NVarChar(50), p.mobileNo ?? null);
      req.input("Email", sql.NVarChar(200), p.email ?? null);
      req.input("ContactPerson", sql.NVarChar(100), p.contactPerson ?? null);
      req.input("ContactDept", sql.NVarChar(100), p.contactDept ?? null);
      req.input("SuspensionDate", sql.Date, toDate(p.suspensionDate));
      req.input("SuspensionReason", sql.NVarChar(200), p.suspensionReason ?? "거래중");
      req.input("Registrant", sql.NVarChar(100), p.registrant ?? "EXCEL 업로드");
      req.input("Modifier", sql.NVarChar(100), p.modifier ?? null);

      const result = await req.query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Purchaser WHERE PurchaserNo = @PurchaserNo)
BEGIN
  INSERT INTO dbo.Purchaser (
    PurchaserNo, PurchaserName, TransactionType, BusinessNo,
    RepresentativeName, BusinessTypeName, BusinessItemName,
    PostalCode, Address, PhoneNo, FaxNo, MobileNo, Email,
    ContactPerson, ContactDept, SuspensionDate, SuspensionReason,
    Registrant, Modifier
  )
  VALUES (
    @PurchaserNo, @PurchaserName, @TransactionType, @BusinessNo,
    @RepresentativeName, @BusinessTypeName, @BusinessItemName,
    @PostalCode, @Address, @PhoneNo, @FaxNo, @MobileNo, @Email,
    @ContactPerson, @ContactDept, @SuspensionDate, @SuspensionReason,
    @Registrant, @Modifier
  )
  SELECT 1 AS inserted
END
ELSE
  SELECT 0 AS inserted
`);

      const inserted = result.recordset[0]?.inserted ?? 0;
      if (inserted) insertedCount++;
      else skippedCount++;
    }

    return NextResponse.json({ ok: true, count: insertedCount, skipped: skippedCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[purchasers/import]", msg);
    return NextResponse.json(
      { ok: false, message: `DB 저장 중 오류가 발생했습니다: ${msg}` },
      { status: 500 }
    );
  }
}
