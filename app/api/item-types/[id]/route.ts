import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, message: "잘못된 ID 입니다." }, { status: 400 });
    }

    const body = await request.json();
    const { itemTypeCode, itemTypeName } = body ?? {};

    if (!itemTypeCode || !itemTypeName) {
      return NextResponse.json(
        { ok: false, message: "품목유형코드와 품목유형명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);
    req.input("ItemTypeCode", sql.NVarChar(10), itemTypeCode);
    req.input("ItemTypeName", sql.NVarChar(100), itemTypeName);

    await req.query(`
      UPDATE dbo.ItemType
      SET ItemTypeCode = @ItemTypeCode,
          ItemTypeName = @ItemTypeName,
          UpdatedAt    = GETDATE()
      WHERE Id = @Id
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[item-types][PUT]", error);
    let message = "품목유형 수정 중 오류가 발생했습니다.";
    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 품목유형코드입니다.";
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, message: "잘못된 ID 입니다." }, { status: 400 });
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);
    await req.query(`DELETE FROM dbo.ItemType WHERE Id = @Id`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[item-types][DELETE]", error);
    return NextResponse.json(
      { ok: false, message: "품목유형 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
