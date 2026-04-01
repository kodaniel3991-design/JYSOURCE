import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ ok: false, message: "유효하지 않은 ID입니다." }, { status: 400 });

    const pool = await getDbPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM dbo.CommonCode WHERE Id = @Id");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[common-codes/[id]][DELETE]", error);
    return NextResponse.json({ ok: false, message: "공통코드 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
