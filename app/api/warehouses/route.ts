import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("Category", sql.NVarChar(50), "warehouse")
      .query(`
        SELECT Code AS WarehouseCode, Name AS WarehouseName
        FROM dbo.CommonCode
        WHERE Category = @Category
        ORDER BY SortOrder, Code
      `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error("[warehouses][GET]", error);
    return NextResponse.json({ ok: false, message: "창고 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
