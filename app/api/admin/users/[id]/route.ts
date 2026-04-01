import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { hashPassword } from "@/lib/auth/password";
import { encryptText } from "@/lib/auth/crypto";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

  try {
    const body = await request.json();
    const { password, emailPassword, factoryCode, isActive, userName, email, phoneNo, hireDate, position, employeeNo } = body;
    const pool = await getDbPool();

    if (password) {
      // 비밀번호 변경 전용 (비밀번호 변경 시트에서 호출)
      await pool
        .request()
        .input("Id",       sql.Int,          id)
        .input("Password", sql.NVarChar(200), await hashPassword(password))
        .query(`UPDATE dbo.AppUser SET Password = @Password WHERE Id = @Id`);
    } else if ("emailPassword" in body) {
      // 메일 비밀번호 변경 전용 — 컬럼 추가와 UPDATE를 분리 (배치 파싱 오류 방지)
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns
          WHERE object_id = OBJECT_ID(N'dbo.AppUser') AND name = 'EmailPassword'
        )
          ALTER TABLE dbo.AppUser ADD EmailPassword NVARCHAR(500) NULL
      `);
      const trimmed = emailPassword?.trim() || null;
      const encrypted = trimmed ? encryptText(trimmed) : null;
      await pool
        .request()
        .input("Id",            sql.Int,          id)
        .input("EmailPassword", sql.NVarChar(500), encrypted)
        .query(`UPDATE dbo.AppUser SET EmailPassword = @EmailPassword WHERE Id = @Id`);
    } else {
      // 일반 정보 수정
      await pool
        .request()
        .input("Id",         sql.Int,          id)
        .input("FactoryCode",sql.NVarChar(20),  factoryCode ?? null)
        .input("IsActive",   sql.Bit,           isActive ?? true)
        .input("UserId",     sql.NVarChar(50),  userName?.trim() || null)
        .input("Email",      sql.NVarChar(100), email?.trim() || null)
        .input("PhoneNo",    sql.NVarChar(20),  phoneNo?.trim() || null)
        .input("HireDate",   sql.Date,          hireDate || null)
        .input("Position",   sql.NVarChar(50),  position?.trim() || null)
        .input("EmployeeNo", sql.NVarChar(20),  employeeNo?.trim() || null)
        .query(`
          UPDATE dbo.AppUser
          SET FactoryCode = @FactoryCode, IsActive = @IsActive,
              UserId = @UserId, Email = @Email, PhoneNo = @PhoneNo,
              HireDate = @HireDate, Position = @Position, EmployeeNo = @EmployeeNo
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
