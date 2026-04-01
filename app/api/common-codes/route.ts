import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "";

    const pool = await getDbPool();
    const req = pool.request();
    const where = category ? "WHERE Category = @Category" : "";
    if (category) req.input("Category", sql.NVarChar(50), category);

    const result = await req.query(`
      SELECT Id, Category, Code, Name, SortOrder
      FROM dbo.CommonCode
      ${where}
      ORDER BY SortOrder, Code
    `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[common-codes][GET]", error);
    return NextResponse.json({ ok: false, message: "공통코드 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category, code, name, sortOrder } = await request.json() ?? {};
    if (!category?.trim() || !code?.trim() || !name?.trim()) {
      return NextResponse.json({ ok: false, message: "분류, 코드, 명칭은 필수입니다." }, { status: 400 });
    }
    const pool = await getDbPool();
    const result = await pool.request()
      .input("Category",  sql.NVarChar(50),  category.trim())
      .input("Code",      sql.NVarChar(50),  code.trim())
      .input("Name",      sql.NVarChar(200), name.trim())
      .input("SortOrder", sql.Int,           sortOrder ?? 0)
      .query(`
        INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder)
        OUTPUT INSERTED.Id
        VALUES (@Category, @Code, @Name, @SortOrder)
      `);
    return NextResponse.json({ ok: true, id: result.recordset[0]?.Id });
  } catch (error) {
    console.error("[common-codes][POST]", error);
    const msg = error instanceof Error && /UNIQUE|duplicate/i.test(error.message)
      ? "이미 존재하는 코드입니다." : "공통코드 등록 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
