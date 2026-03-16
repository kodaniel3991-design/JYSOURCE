import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

// 인증 없이 공장 목록 조회 (로그인 페이지에서 사용)
export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT FactoryCode, FactoryName
      FROM dbo.Factory
      WHERE IsActive = 1
      ORDER BY SortOrder, FactoryCode
    `);
    return NextResponse.json({ ok: true, factories: result.recordset });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, factories: [] });
  }
}
