import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function PUT(
  request: Request,
  { params }: { params: { code: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { factoryName, sortOrder, isActive } = await request.json();

    if (!factoryName?.trim()) {
      return NextResponse.json(
        { ok: false, message: "공장명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    await pool
      .request()
      .input("FactoryCode", sql.NVarChar(20), params.code)
      .input("FactoryName", sql.NVarChar(100), factoryName.trim())
      .input("SortOrder", sql.Int, sortOrder ?? 0)
      .input("IsActive", sql.Bit, isActive ?? true)
      .query(`
        UPDATE dbo.Factory
        SET FactoryName = @FactoryName, SortOrder = @SortOrder, IsActive = @IsActive
        WHERE FactoryCode = @FactoryCode
      `);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const pool = await getDbPool();
    await pool
      .request()
      .input("FactoryCode", sql.NVarChar(20), params.code)
      .query(`DELETE FROM dbo.Factory WHERE FactoryCode = @FactoryCode`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("REFERENCE") || msg.includes("FK_")) {
      return NextResponse.json(
        { ok: false, message: "해당 공장에 소속된 사용자가 있어 삭제할 수 없습니다." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
