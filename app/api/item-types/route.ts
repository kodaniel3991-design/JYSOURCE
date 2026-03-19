import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT Id, ItemTypeCode, ItemTypeName
      FROM dbo.ItemType
      ORDER BY ItemTypeCode ASC
    `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[item-types][GET]", error);
    return NextResponse.json(
      { ok: false, message: "품목유형 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemTypeCode, itemTypeName } = body ?? {};

    if (!itemTypeCode || !itemTypeName) {
      return NextResponse.json(
        { ok: false, message: "품목유형코드와 품목유형명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("ItemTypeCode", sql.NVarChar(10), itemTypeCode);
    req.input("ItemTypeName", sql.NVarChar(100), itemTypeName);

    const result = await req.query(`
      INSERT INTO dbo.ItemType (ItemTypeCode, ItemTypeName)
      OUTPUT INSERTED.Id
      VALUES (@ItemTypeCode, @ItemTypeName)
    `);

    return NextResponse.json({ ok: true, id: result.recordset[0]?.Id });
  } catch (error) {
    console.error("[item-types][POST]", error);
    let message = "품목유형 저장 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 품목유형코드입니다.";
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
