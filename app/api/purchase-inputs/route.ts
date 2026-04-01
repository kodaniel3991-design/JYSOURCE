import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

async function ensureTables() {
  const pool = await getDbPool();
  // BusinessPlace 컬럼 없으면 자동 추가
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns
      WHERE object_id = OBJECT_ID(N'dbo.PurchaseInput') AND name = 'BusinessPlace'
    )
      ALTER TABLE dbo.PurchaseInput ADD BusinessPlace NVARCHAR(20) NULL
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PurchaseInput') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.PurchaseInput (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        InputNo         NVARCHAR(20)  NOT NULL,
        SupplierCode    NVARCHAR(50)  NOT NULL,
        SupplierName    NVARCHAR(200) NULL,
        MgmtNo          NVARCHAR(50)  NULL,
        InputDate       DATE          NOT NULL,
        Status          NVARCHAR(20)  NOT NULL DEFAULT '입력중',
        BuyerCode       NVARCHAR(50)  NULL,
        BuyerName       NVARCHAR(100) NULL,
        AltVoucherNo    NVARCHAR(50)  NULL,
        Note            NVARCHAR(500) NULL,
        Summary         NVARCHAR(500) NULL,
        DeptCode        NVARCHAR(50)  NULL,
        DeptName        NVARCHAR(100) NULL,
        DeductionAmount DECIMAL(18,0) NULL DEFAULT 0,
        TotalAmount     DECIMAL(18,0) NULL DEFAULT 0,
        TaxAmount       DECIMAL(18,0) NULL DEFAULT 0,
        TotalWithTax    DECIMAL(18,0) NULL DEFAULT 0,
        PaymentAmount   DECIMAL(18,0) NULL DEFAULT 0,
        CreatedAt       DATETIME2     NOT NULL DEFAULT GETDATE()
      );
    END
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PurchaseInputItem') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.PurchaseInputItem (
        Id                INT IDENTITY(1,1) PRIMARY KEY,
        PurchaseInputId   INT           NOT NULL,
        SeqNo             INT           NOT NULL DEFAULT 0,
        ReceiptHistoryId  INT           NULL,
        ReceiptNo         NVARCHAR(30)  NULL,
        ItemCode          NVARCHAR(50)  NOT NULL,
        ItemName          NVARCHAR(200) NULL,
        Unit              NVARCHAR(20)  NULL,
        InputQty          DECIMAL(18,3) NOT NULL DEFAULT 0,
        InputAmount       DECIMAL(18,0) NOT NULL DEFAULT 0,
        ConvertedAmount   DECIMAL(18,0) NULL DEFAULT 0,
        TaxAmount         DECIMAL(18,0) NULL DEFAULT 0,
        TotalWithTax      DECIMAL(18,0) NULL DEFAULT 0,
        Note              NVARCHAR(500) NULL,
        PurchaseOrderNo   NVARCHAR(50)  NULL,
        CONSTRAINT FK_PurchaseInputItem_PurchaseInput
          FOREIGN KEY (PurchaseInputId) REFERENCES dbo.PurchaseInput(Id) ON DELETE CASCADE
      );
    END
  `);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierCode = searchParams.get("supplierCode") || null;
  const dateFrom     = searchParams.get("dateFrom")     || null;
  const dateTo       = searchParams.get("dateTo")       || null;

  try {
    await ensureTables();
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const result = await pool.request()
      .input("SupplierCode",  sql.NVarChar(50), supplierCode)
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        SELECT Id, InputNo, SupplierCode, SupplierName,
               CONVERT(NVARCHAR(10), InputDate, 23) AS InputDate,
               TotalAmount, TaxAmount, TotalWithTax, PaymentAmount,
               BuyerCode, BuyerName, Status, DeptCode
        FROM dbo.PurchaseInput
        WHERE 1=1
          AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
          AND (@SupplierCode  IS NULL OR SupplierCode LIKE @SupplierCode + '%')
          AND (@DateFrom      IS NULL OR InputDate >= @DateFrom)
          AND (@DateTo        IS NULL OR InputDate <= @DateTo)
        ORDER BY Id DESC
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      id:           String(r.Id),
      inputNo:      String(r.InputNo      ?? ""),
      supplierCode: String(r.SupplierCode ?? ""),
      supplierName: String(r.SupplierName ?? ""),
      inputDate:    String(r.InputDate    ?? ""),
      totalAmount:  Number(r.TotalAmount  ?? 0),
      taxAmount:    Number(r.TaxAmount    ?? 0),
      totalWithTax: Number(r.TotalWithTax ?? 0),
      paymentAmount:Number(r.PaymentAmount?? 0),
      buyerCode:    String(r.BuyerCode    ?? ""),
      buyerName:    String(r.BuyerName    ?? ""),
      status:       String(r.Status       ?? ""),
      deptCode:     String(r.DeptCode     ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-inputs][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierCode, supplierName, mgmtNo, inputDate, status,
            buyerCode, buyerName, altVoucherNo, note, summary,
            deptCode, deptName, deductionAmount } = body;

    if (!supplierCode || !inputDate) {
      return NextResponse.json({ ok: false, message: "구매처번호와 매입일자는 필수입니다." }, { status: 400 });
    }

    const factory = await getSessionFactory(request);
    await ensureTables();
    const pool = await getDbPool();

    const cntRes = await pool.request().query(`
      SELECT ISNULL(MAX(CAST(InputNo AS BIGINT)), 10000) + 1 AS NextNo
      FROM dbo.PurchaseInput WHERE ISNUMERIC(InputNo) = 1
    `);
    const inputNo = String(cntRes.recordset[0].NextNo);

    const ins = await pool.request()
      .input("InputNo",         sql.NVarChar(20),  inputNo)
      .input("SupplierCode",    sql.NVarChar(50),  supplierCode)
      .input("SupplierName",    sql.NVarChar(200), supplierName   || null)
      .input("MgmtNo",          sql.NVarChar(50),  mgmtNo         || null)
      .input("InputDate",       sql.Date,          inputDate)
      .input("Status",          sql.NVarChar(20),  status         || "입력중")
      .input("BuyerCode",       sql.NVarChar(50),  buyerCode      || null)
      .input("BuyerName",       sql.NVarChar(100), buyerName      || null)
      .input("AltVoucherNo",    sql.NVarChar(50),  altVoucherNo   || null)
      .input("Note",            sql.NVarChar(500), note           || null)
      .input("Summary",         sql.NVarChar(500), summary        || null)
      .input("DeptCode",        sql.NVarChar(50),  deptCode       || null)
      .input("DeptName",        sql.NVarChar(100), deptName       || null)
      .input("DeductionAmount", sql.Decimal(18,0), deductionAmount || 0)
      .input("BusinessPlace",   sql.NVarChar(20),  factory)
      .query(`
        INSERT INTO dbo.PurchaseInput
          (InputNo,SupplierCode,SupplierName,MgmtNo,InputDate,Status,
           BuyerCode,BuyerName,AltVoucherNo,Note,Summary,DeptCode,DeptName,DeductionAmount,BusinessPlace)
        VALUES
          (@InputNo,@SupplierCode,@SupplierName,@MgmtNo,@InputDate,@Status,
           @BuyerCode,@BuyerName,@AltVoucherNo,@Note,@Summary,@DeptCode,@DeptName,@DeductionAmount,@BusinessPlace);
        SELECT SCOPE_IDENTITY() AS Id;
      `);

    const id = String(ins.recordset[0].Id);
    return NextResponse.json({ ok: true, id, inputNo });
  } catch (error) {
    console.error("[purchase-inputs][POST]", error);
    return NextResponse.json({ ok: false, message: "저장 실패" }, { status: 500 });
  }
}
