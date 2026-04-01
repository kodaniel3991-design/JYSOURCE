import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT u.Id, u.Username, u.UserId, u.Email, u.PhoneNo, u.HireDate,
             u.Position, u.EmployeeNo, u.FactoryCode, f.FactoryName, u.IsActive, u.CreatedAt
      FROM dbo.AppUser u
      LEFT JOIN dbo.Factory f ON f.FactoryCode = u.FactoryCode
      ORDER BY u.CreatedAt DESC
    `);
    return NextResponse.json({ ok: true, users: result.recordset });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { username, password, factoryCode, isActive, userName, email, phoneNo, hireDate, position, employeeNo } = await request.json();

    if (!username?.trim() || !password) {
      return NextResponse.json(
        { ok: false, message: "아이디와 비밀번호는 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("Username",   sql.NVarChar(50),  username.trim())
      .input("Password",   sql.NVarChar(200), await hashPassword(password))
      .input("FactoryCode",sql.NVarChar(20),  factoryCode ?? null)
      .input("IsActive",   sql.Bit,           isActive ?? true)
      .input("UserId",     sql.NVarChar(50),  userName?.trim() || null)
      .input("Email",      sql.NVarChar(100), email?.trim() || null)
      .input("PhoneNo",    sql.NVarChar(20),  phoneNo?.trim() || null)
      .input("HireDate",   sql.Date,          hireDate || null)
      .input("Position",   sql.NVarChar(50),  position?.trim() || null)
      .input("EmployeeNo", sql.NVarChar(20),  employeeNo?.trim() || null)
      .query(`
        INSERT INTO dbo.AppUser (Username, Password, FactoryCode, IsActive, UserId, Email, PhoneNo, HireDate, Position, EmployeeNo)
        OUTPUT INSERTED.Id
        VALUES (@Username, @Password, @FactoryCode, @IsActive, @UserId, @Email, @PhoneNo, @HireDate, @Position, @EmployeeNo)
      `);

    return NextResponse.json({ ok: true, id: result.recordset[0].Id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UQ_AppUser_Username") || msg.includes("UNIQUE")) {
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 아이디입니다." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ ok: false, message: "등록 실패" }, { status: 500 });
  }
}
