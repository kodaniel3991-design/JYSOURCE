import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, message: "잘못된 ID 입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { modelCode, modelName, primaryCustomerCode, primaryCustomerName } = body ?? {};

    if (!modelCode || !modelName) {
      return NextResponse.json(
        { ok: false, message: "모델코드와 모델명은 필수입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);
    req.input("ModelCode", sql.NVarChar(50), modelCode);
    req.input("ModelName", sql.NVarChar(200), modelName);
    req.input("PrimaryCustomerCode", sql.NVarChar(50), primaryCustomerCode || null);
    req.input("PrimaryCustomerName", sql.NVarChar(200), primaryCustomerName || null);

    await req.query(`
      UPDATE dbo.ModelCode
      SET
        ModelCode = @ModelCode,
        ModelName = @ModelName,
        PrimaryCustomerCode = @PrimaryCustomerCode,
        PrimaryCustomerName = @PrimaryCustomerName,
        UpdatedAt = GETDATE()
      WHERE Id = @Id
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[model-codes][PUT]", error);
    let message = "모델코드 수정 중 오류가 발생했습니다.";

    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 모델코드입니다.";
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
      return NextResponse.json(
        { ok: false, message: "잘못된 ID 입니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const req = pool.request();
    req.input("Id", sql.Int, id);

    await req.query(`
      DELETE FROM dbo.ModelCode
      WHERE Id = @Id
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[model-codes][DELETE]", error);
    return NextResponse.json(
      { ok: false, message: "모델코드 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

