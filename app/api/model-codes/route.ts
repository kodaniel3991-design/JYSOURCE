import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        Id,
        ModelCode,
        ModelName,
        PrimaryCustomerCode,
        PrimaryCustomerName
      FROM dbo.ModelCode
      ORDER BY UpdatedAt DESC, CreatedAt DESC
    `);

    return NextResponse.json({
      ok: true,
      items: result.recordset,
    });
  } catch (error) {
    console.error("[model-codes][GET]", error);
    return NextResponse.json(
      { ok: false, message: "모델코드 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    req.input("ModelCode", sql.NVarChar(50), modelCode);
    req.input("ModelName", sql.NVarChar(200), modelName);
    req.input("PrimaryCustomerCode", sql.NVarChar(50), primaryCustomerCode || null);
    req.input("PrimaryCustomerName", sql.NVarChar(200), primaryCustomerName || null);

    const result = await req.query(`
      INSERT INTO dbo.ModelCode (
        ModelCode,
        ModelName,
        PrimaryCustomerCode,
        PrimaryCustomerName
      )
      OUTPUT INSERTED.Id
      VALUES (
        @ModelCode,
        @ModelName,
        @PrimaryCustomerCode,
        @PrimaryCustomerName
      )
    `);

    const insertedId = result.recordset[0]?.Id;

    return NextResponse.json({ ok: true, id: insertedId });
  } catch (error) {
    console.error("[model-codes][POST]", error);
    let message = "모델코드 저장 중 오류가 발생했습니다.";

    if (error instanceof Error && /UNIQUE KEY|duplicate/i.test(error.message)) {
      message = "이미 존재하는 모델코드입니다.";
    }

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

