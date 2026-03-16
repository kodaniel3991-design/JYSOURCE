import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT FactoryCode, FactoryName, SortOrder, IsActive
      FROM dbo.Factory
      ORDER BY SortOrder, FactoryCode
    `);
    return NextResponse.json({ ok: true, factories: result.recordset });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { factoryCode, factoryName, sortOrder, isActive } = await request.json();

    if (!factoryCode?.trim() || !factoryName?.trim()) {
      return NextResponse.json(
        { ok: false, message: "공장코드와 공장명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    await pool
      .request()
      .input("FactoryCode", sql.NVarChar(20), factoryCode.trim().toUpperCase())
      .input("FactoryName", sql.NVarChar(100), factoryName.trim())
      .input("SortOrder", sql.Int, sortOrder ?? 0)
      .input("IsActive", sql.Bit, isActive ?? true)
      .query(`
        INSERT INTO dbo.Factory (FactoryCode, FactoryName, SortOrder, IsActive)
        VALUES (@FactoryCode, @FactoryName, @SortOrder, @IsActive)
      `);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("PRIMARY KEY") || msg.includes("duplicate")) {
      return NextResponse.json(
        { ok: false, message: "이미 존재하는 공장코드입니다." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ ok: false, message: "등록 실패" }, { status: 500 });
  }
}
