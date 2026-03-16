import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

  try {
    const { password, factoryCode, isActive } = await request.json();
    const pool = await getDbPool();

    // 비밀번호 변경 여부에 따라 쿼리 분기
    if (password) {
      await pool
        .request()
        .input("Id", sql.Int, id)
        .input("Password", sql.NVarChar(200), password)
        .input("FactoryCode", sql.NVarChar(20), factoryCode ?? null)
        .input("IsActive", sql.Bit, isActive ?? true)
        .query(`
          UPDATE dbo.AppUser
          SET Password = @Password, FactoryCode = @FactoryCode, IsActive = @IsActive
          WHERE Id = @Id
        `);
    } else {
      await pool
        .request()
        .input("Id", sql.Int, id)
        .input("FactoryCode", sql.NVarChar(20), factoryCode ?? null)
        .input("IsActive", sql.Bit, isActive ?? true)
        .query(`
          UPDATE dbo.AppUser
          SET FactoryCode = @FactoryCode, IsActive = @IsActive
          WHERE Id = @Id
        `);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

  try {
    const pool = await getDbPool();
    await pool.request().input("Id", sql.Int, id).query(`
      DELETE FROM dbo.AppUser WHERE Id = @Id
    `);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
