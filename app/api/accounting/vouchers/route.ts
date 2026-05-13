import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

const DEFAULT_ACCOUNT_CODE = "15300";
const DEFAULT_ACCOUNT_NAME = "원재료";
const VAT_ACCOUNT     = { code: "13500", name: "부가세대급금" };
const PAYABLE_ACCOUNT = { code: "25100", name: "외상매입금" };

async function ensureTables() {
  const pool = await getDbPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.AccountingVoucher') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.AccountingVoucher (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        VoucherNo     NVARCHAR(30)   NOT NULL,
        VoucherDate   DATE           NOT NULL,
        BusinessPlace NVARCHAR(20)   NULL,
        DeptCode      NVARCHAR(50)   NULL,
        DeptName      NVARCHAR(100)  NULL,
        SourceType    NVARCHAR(50)   NULL,
        SourceId      INT            NULL,
        Summary       NVARCHAR(500)  NULL,
        SupplierCode  NVARCHAR(50)   NULL,
        SupplierName  NVARCHAR(200)  NULL,
        TotalDebit    DECIMAL(18,0)  NULL DEFAULT 0,
        TotalCredit   DECIMAL(18,0)  NULL DEFAULT 0,
        Status        NVARCHAR(20)   NOT NULL DEFAULT N'미승인',
        CreatedAt     DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    END
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.AccountingVoucherLine') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.AccountingVoucherLine (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        VoucherId     INT            NOT NULL,
        SeqNo         INT            NOT NULL DEFAULT 0,
        LineType      NVARCHAR(10)   NOT NULL,
        AccountCode   NVARCHAR(20)   NOT NULL,
        AccountName   NVARCHAR(100)  NULL,
        PartnerCode   NVARCHAR(50)   NULL,
        PartnerName   NVARCHAR(200)  NULL,
        Summary       NVARCHAR(500)  NULL,
        DebitAmount   DECIMAL(18,0)  NOT NULL DEFAULT 0,
        CreditAmount  DECIMAL(18,0)  NOT NULL DEFAULT 0,
        CONSTRAINT FK_VoucherLine_Voucher
          FOREIGN KEY (VoucherId) REFERENCES dbo.AccountingVoucher(Id) ON DELETE CASCADE
      );
    END
  `);
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns
      WHERE object_id = OBJECT_ID(N'dbo.PurchaseInputItem') AND name = 'PurchaseType'
    )
      ALTER TABLE dbo.PurchaseInputItem ADD PurchaseType NVARCHAR(20) NULL
  `);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || null;
    const dateTo   = searchParams.get("dateTo")   || null;

    const factory = await getSessionFactory(request);
    const pool    = await getDbPool();
    await ensureTables();

    const result = await pool.request()
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        SELECT
          v.Id, v.VoucherNo,
          CONVERT(NVARCHAR(10), v.VoucherDate, 23) AS VoucherDate,
          v.SupplierCode, v.SupplierName, v.DeptCode, v.DeptName,
          v.TotalDebit, v.TotalCredit, v.Status, v.Summary, v.SourceId,
          CONVERT(NVARCHAR(19), v.CreatedAt, 120) AS CreatedAt
        FROM dbo.AccountingVoucher v
        WHERE v.SourceType = N'매입전표'
          AND (@BusinessPlace IS NULL OR v.BusinessPlace = @BusinessPlace)
          AND (@DateFrom IS NULL OR v.VoucherDate >= @DateFrom)
          AND (@DateTo   IS NULL OR v.VoucherDate <= @DateTo)
        ORDER BY v.Id DESC
      `);

    const items = (result.recordset as Record<string, unknown>[]).map((r) => ({
      id:           String(r.Id),
      voucherNo:    String(r.VoucherNo    ?? ""),
      voucherDate:  String(r.VoucherDate  ?? ""),
      supplierCode: String(r.SupplierCode ?? ""),
      supplierName: String(r.SupplierName ?? ""),
      deptCode:     String(r.DeptCode     ?? ""),
      deptName:     String(r.DeptName     ?? ""),
      totalDebit:   Number(r.TotalDebit   ?? 0),
      totalCredit:  Number(r.TotalCredit  ?? 0),
      status:       String(r.Status       ?? ""),
      summary:      String(r.Summary      ?? ""),
      sourceId:     r.SourceId ? String(r.SourceId) : null,
      createdAt:    String(r.CreatedAt    ?? ""),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[accounting/vouchers][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { ids: number[]; voucherDate: string };
    const { ids, voucherDate } = body;

    if (!ids?.length || !voucherDate) {
      return NextResponse.json(
        { ok: false, message: "처리할 항목과 전표일자를 입력하세요." },
        { status: 400 }
      );
    }

    const factory = await getSessionFactory(request);
    const pool    = await getDbPool();
    await ensureTables();

    const idList      = ids.map(Number).filter(Boolean);
    const placeholders = idList.map((_, i) => `@Id${i}`).join(",");

    const piReq = pool.request().input("BusinessPlace", sql.NVarChar(20), factory);
    idList.forEach((id, i) => piReq.input(`Id${i}`, sql.Int, id));

    const piResult = await piReq.query(`
      SELECT Id, InputNo, SupplierCode, SupplierName,
             TotalAmount, TaxAmount, TotalWithTax,
             DeptCode, DeptName, Summary, BusinessPlace
      FROM dbo.PurchaseInput
      WHERE Id IN (${placeholders})
        AND Status = N'확정'
        AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
    `);

    if (!piResult.recordset.length) {
      return NextResponse.json(
        { ok: false, message: "처리 가능한 확정 매입 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const createdIds: string[] = [];

    for (const pi of piResult.recordset as Record<string, unknown>[]) {
      const piId = Number(pi.Id);

      const itemResult = await pool.request()
        .input("PurchaseInputId", sql.Int, piId)
        .query(`
          SELECT i.InputAmount,
                 ISNULL(itc.PurchaseAccount,     N'') AS PurchaseAccount,
                 ISNULL(itc.PurchaseAccountName, N'') AS PurchaseAccountName
          FROM dbo.PurchaseInputItem i
          LEFT JOIN dbo.ItemMaster im    ON im.ItemNo       = i.ItemCode
          LEFT JOIN dbo.ItemTypeCode itc ON itc.ItemTypeCode = im.Form
          WHERE i.PurchaseInputId = @PurchaseInputId
        `);

      // Generate VoucherNo: AV-YYYYMMDD-XXXX
      const datePart = voucherDate.replace(/-/g, "");
      const cntRes   = await pool.request()
        .input("Pattern", sql.NVarChar(20), `AV-${datePart}-%`)
        .query(`SELECT COUNT(*) AS Cnt FROM dbo.AccountingVoucher WHERE VoucherNo LIKE @Pattern`);
      const seq       = Number((cntRes.recordset[0] as Record<string, unknown>).Cnt) + 1;
      const voucherNo = `AV-${datePart}-${String(seq).padStart(4, "0")}`;

      // Group items by PurchaseAccount → sum InputAmount
      const accountAmountMap = new Map<string, { code: string; name: string; amount: number }>();
      for (const item of itemResult.recordset as Record<string, unknown>[]) {
        const code = String(item.PurchaseAccount     || "") || DEFAULT_ACCOUNT_CODE;
        const name = String(item.PurchaseAccountName || "") || DEFAULT_ACCOUNT_NAME;
        const prev = accountAmountMap.get(code);
        if (prev) {
          prev.amount += Number(item.InputAmount ?? 0);
        } else {
          accountAmountMap.set(code, { code, name, amount: Number(item.InputAmount ?? 0) });
        }
      }

      const totalWithTax = Number(pi.TotalWithTax ?? 0);
      const taxAmount    = Number(pi.TaxAmount    ?? 0);
      const bp           = String(pi.BusinessPlace ?? factory ?? "");

      const vRes = await pool.request()
        .input("VoucherNo",    sql.NVarChar(30),  voucherNo)
        .input("VoucherDate",  sql.Date,          voucherDate)
        .input("BusinessPlace",sql.NVarChar(20),  bp)
        .input("DeptCode",     sql.NVarChar(50),  String(pi.DeptCode     ?? ""))
        .input("DeptName",     sql.NVarChar(100), String(pi.DeptName     ?? ""))
        .input("SourceType",   sql.NVarChar(50),  "매입전표")
        .input("SourceId",     sql.Int,           piId)
        .input("Summary",      sql.NVarChar(500), String(pi.Summary      ?? ""))
        .input("SupplierCode", sql.NVarChar(50),  String(pi.SupplierCode ?? ""))
        .input("SupplierName", sql.NVarChar(200), String(pi.SupplierName ?? ""))
        .input("TotalDebit",   sql.Decimal(18,0), totalWithTax)
        .input("TotalCredit",  sql.Decimal(18,0), totalWithTax)
        .query(`
          INSERT INTO dbo.AccountingVoucher
            (VoucherNo,VoucherDate,BusinessPlace,DeptCode,DeptName,SourceType,SourceId,
             Summary,SupplierCode,SupplierName,TotalDebit,TotalCredit)
          VALUES
            (@VoucherNo,@VoucherDate,@BusinessPlace,@DeptCode,@DeptName,@SourceType,@SourceId,
             @Summary,@SupplierCode,@SupplierName,@TotalDebit,@TotalCredit);
          SELECT SCOPE_IDENTITY() AS Id;
        `);

      const voucherId = Number((vRes.recordset[0] as Record<string, unknown>).Id);
      createdIds.push(String(voucherId));

      let seqNo = 0;

      // 차변①: per distinct PurchaseAccount
      for (const { code, name, amount } of Array.from(accountAmountMap.values())) {
        seqNo++;
        await pool.request()
          .input("VoucherId",    sql.Int,           voucherId)
          .input("SeqNo",        sql.Int,           seqNo)
          .input("LineType",     sql.NVarChar(10),  "차변")
          .input("AccountCode",  sql.NVarChar(20),  code)
          .input("AccountName",  sql.NVarChar(100), name)
          .input("PartnerCode",  sql.NVarChar(50),  String(pi.SupplierCode ?? ""))
          .input("PartnerName",  sql.NVarChar(200), String(pi.SupplierName ?? ""))
          .input("Summary",      sql.NVarChar(500), String(pi.Summary ?? ""))
          .input("DebitAmount",  sql.Decimal(18,0), amount)
          .input("CreditAmount", sql.Decimal(18,0), 0)
          .query(`
            INSERT INTO dbo.AccountingVoucherLine
              (VoucherId,SeqNo,LineType,AccountCode,AccountName,PartnerCode,PartnerName,
               Summary,DebitAmount,CreditAmount)
            VALUES
              (@VoucherId,@SeqNo,@LineType,@AccountCode,@AccountName,@PartnerCode,@PartnerName,
               @Summary,@DebitAmount,@CreditAmount)
          `);
      }

      // 차변②: 부가세대급금
      if (taxAmount > 0) {
        seqNo++;
        await pool.request()
          .input("VoucherId",    sql.Int,           voucherId)
          .input("SeqNo",        sql.Int,           seqNo)
          .input("LineType",     sql.NVarChar(10),  "차변")
          .input("AccountCode",  sql.NVarChar(20),  VAT_ACCOUNT.code)
          .input("AccountName",  sql.NVarChar(100), VAT_ACCOUNT.name)
          .input("PartnerCode",  sql.NVarChar(50),  String(pi.SupplierCode ?? ""))
          .input("PartnerName",  sql.NVarChar(200), String(pi.SupplierName ?? ""))
          .input("Summary",      sql.NVarChar(500), String(pi.Summary ?? ""))
          .input("DebitAmount",  sql.Decimal(18,0), taxAmount)
          .input("CreditAmount", sql.Decimal(18,0), 0)
          .query(`
            INSERT INTO dbo.AccountingVoucherLine
              (VoucherId,SeqNo,LineType,AccountCode,AccountName,PartnerCode,PartnerName,
               Summary,DebitAmount,CreditAmount)
            VALUES
              (@VoucherId,@SeqNo,@LineType,@AccountCode,@AccountName,@PartnerCode,@PartnerName,
               @Summary,@DebitAmount,@CreditAmount)
          `);
      }

      // 대변: 외상매입금
      seqNo++;
      await pool.request()
        .input("VoucherId",    sql.Int,           voucherId)
        .input("SeqNo",        sql.Int,           seqNo)
        .input("LineType",     sql.NVarChar(10),  "대변")
        .input("AccountCode",  sql.NVarChar(20),  PAYABLE_ACCOUNT.code)
        .input("AccountName",  sql.NVarChar(100), PAYABLE_ACCOUNT.name)
        .input("PartnerCode",  sql.NVarChar(50),  String(pi.SupplierCode ?? ""))
        .input("PartnerName",  sql.NVarChar(200), String(pi.SupplierName ?? ""))
        .input("Summary",      sql.NVarChar(500), String(pi.Summary ?? ""))
        .input("DebitAmount",  sql.Decimal(18,0), 0)
        .input("CreditAmount", sql.Decimal(18,0), totalWithTax)
        .query(`
          INSERT INTO dbo.AccountingVoucherLine
            (VoucherId,SeqNo,LineType,AccountCode,AccountName,PartnerCode,PartnerName,
             Summary,DebitAmount,CreditAmount)
          VALUES
            (@VoucherId,@SeqNo,@LineType,@AccountCode,@AccountName,@PartnerCode,@PartnerName,
             @Summary,@DebitAmount,@CreditAmount)
        `);

      // 상태를 '회계처리'로 변경
      await pool.request()
        .input("Id", sql.Int, piId)
        .query(`UPDATE dbo.PurchaseInput SET Status = N'회계처리' WHERE Id = @Id`);
    }

    return NextResponse.json({ ok: true, count: createdIds.length, createdIds });
  } catch (error) {
    console.error("[accounting/vouchers][POST]", error);
    return NextResponse.json({ ok: false, message: "전표 생성 실패" }, { status: 500 });
  }
}
