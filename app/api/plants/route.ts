import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("Category", sql.NVarChar(50), "plant")
      .query(`
        SELECT Code AS PlantCode, Name AS PlantName
        FROM dbo.CommonCode
        WHERE Category = @Category
        ORDER BY SortOrder, Code
      `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[plants][GET]", error);
    return NextResponse.json({ ok: false, message: "사업장 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
