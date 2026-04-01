import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDbPool } from "@/lib/db";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("Username", session.username)
      .query(`SELECT UserId, Email FROM dbo.AppUser WHERE Username = @Username AND IsActive = 1`);
    const userId = result.recordset[0]?.UserId ?? null;
    const email  = result.recordset[0]?.Email  ?? null;

    return NextResponse.json({
      ok: true,
      username: session.username,
      factory: session.factory,
      userId,
      email,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      username: session.username,
      factory: session.factory,
      userId: null,
    });
  }
}
