import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT c.Id, c.CategoryKey, c.Label, c.Description, c.SortOrder,
             COUNT(cc.Id) AS CodeCount
      FROM dbo.CommonCodeCategory c
      LEFT JOIN dbo.CommonCode cc ON cc.Category = c.CategoryKey
      GROUP BY c.Id, c.CategoryKey, c.Label, c.Description, c.SortOrder
      ORDER BY c.SortOrder, c.CategoryKey
    `);
    return NextResponse.json({ ok: true, categories: result.recordset });
  } catch (error) {
    console.error("[common-codes/categories][GET]", error);
    return NextResponse.json({ ok: false, message: "분류 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categoryKey, label, description, sortOrder } = await request.json() ?? {};
    if (!categoryKey?.trim() || !label?.trim()) {
      return NextResponse.json({ ok: false, message: "분류코드와 분류명은 필수입니다." }, { status: 400 });
    }
    const pool = await getDbPool();
    const result = await pool.request()
      .input("CategoryKey", sql.NVarChar(50), categoryKey.trim())
      .input("Label",       sql.NVarChar(100), label.trim())
      .input("Description", sql.NVarChar(500), description?.trim() || null)
      .input("SortOrder",   sql.Int,            sortOrder ?? 0)
      .query(`
        INSERT INTO dbo.CommonCodeCategory (CategoryKey, Label, Description, SortOrder)
        OUTPUT INSERTED.Id
        VALUES (@CategoryKey, @Label, @Description, @SortOrder)
      `);
    return NextResponse.json({ ok: true, id: result.recordset[0]?.Id });
  } catch (error) {
    console.error("[common-codes/categories][POST]", error);
    const msg = error instanceof Error && /UNIQUE|duplicate/i.test(error.message)
      ? "이미 존재하는 분류코드입니다." : "분류 등록 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
