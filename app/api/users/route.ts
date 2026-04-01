import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDbPool } from "@/lib/db";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT u.Id, u.Username, u.UserId, u.Email, u.PhoneNo,
             u.Position, u.EmployeeNo, u.FactoryCode, f.FactoryName, u.IsActive
      FROM dbo.AppUser u
      LEFT JOIN dbo.Factory f ON f.FactoryCode = u.FactoryCode
      WHERE u.IsActive = 1
      ORDER BY u.Username
    `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
