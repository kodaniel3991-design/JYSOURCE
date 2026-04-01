import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

// ── 이력 테이블 자동 생성 ─────────────────────────────────────────────────────
async function ensureHistoryTable() {
  const pool = await getDbPool();
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.tables
      WHERE object_id = OBJECT_ID(N'dbo.PurchasePriceHistory')
    )
    CREATE TABLE dbo.PurchasePriceHistory (
      Id                INT            IDENTITY(1,1) PRIMARY KEY,
      PurchasePriceId   INT            NOT NULL,
      ItemCode          NVARCHAR(50)   NOT NULL,
      ItemName          NVARCHAR(200)  NOT NULL,
      SupplierName      NVARCHAR(200)  NOT NULL,
      PreviousUnitPrice DECIMAL(18,4)  NULL,
      NewUnitPrice      DECIMAL(18,4)  NULL,
      PreviousApplyDate DATE           NULL,
      NewApplyDate      DATE           NULL,
      PreviousExpireDate DATE          NULL,
      NewExpireDate      DATE          NULL,
      ChangeType        NVARCHAR(10)   NOT NULL,  -- '수정' | '삭제'
      Reason            NVARCHAR(500)  NULL,
      ChangedAt         DATETIME       NOT NULL DEFAULT GETDATE(),
      ChangedBy         NVARCHAR(100)  NULL
    )
  `);
}

// ── PUT: 단건 수정 ────────────────────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID입니다." }, { status: 400 });

  try {
    const body = await request.json();
    const {
      itemCode, itemName, itemSpec, supplierName, plant,
      applyDate, expireDate, unitPrice, devUnitPrice, discountRate,
      currency, currencyCode, remarks, editReason,
    } = body;

    if (!itemCode?.trim() || !supplierName?.trim() || !applyDate) {
      return NextResponse.json({ ok: false, message: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    await ensureHistoryTable();
    const pool = await getDbPool();

    // 수정 전 현재 값 조회
    const prev = await pool.request()
      .input("Id", sql.Int, id)
      .query(`SELECT UnitPrice, ApplyDate, ExpireDate FROM dbo.PurchasePrice WHERE Id = @Id`);

    if (!prev.recordset.length) {
      return NextResponse.json({ ok: false, message: "데이터를 찾을 수 없습니다." }, { status: 404 });
    }

    const old = prev.recordset[0];
    const newUnitPrice  = Number(unitPrice);
    const newApplyDate  = applyDate ?? null;
    const newExpireDate = expireDate || null;
    const currCode      = currencyCode ?? currency ?? "KRW";

    // 본 데이터 업데이트
    await pool.request()
      .input("Id",            sql.Int,           id)
      .input("ItemCode",      sql.NVarChar(50),  itemCode.trim())
      .input("ItemName",      sql.NVarChar(200), itemName?.trim() ?? "")
      .input("ItemSpec",      sql.NVarChar(200), itemSpec?.trim() || null)
      .input("SupplierName",  sql.NVarChar(200), supplierName.trim())
      .input("Plant",         sql.NVarChar(100), plant?.trim() || null)
      .input("ApplyDate",     sql.Date,          newApplyDate)
      .input("ExpireDate",    sql.Date,          newExpireDate)
      .input("UnitPrice",     sql.Decimal(18,4), newUnitPrice)
      .input("DevUnitPrice",  sql.Decimal(18,4), devUnitPrice != null ? Number(devUnitPrice) : null)
      .input("DiscountRate",  sql.Decimal(5,2),  discountRate != null ? Number(discountRate) : null)
      .input("Currency",      sql.NVarChar(10),  currCode)
      .input("Remarks",       sql.NVarChar(500), remarks?.trim() || null)
      .query(`
        UPDATE dbo.PurchasePrice SET
          ItemCode     = @ItemCode,
          ItemName     = @ItemName,
          ItemSpec     = @ItemSpec,
          SupplierName = @SupplierName,
          Plant        = @Plant,
          ApplyDate    = @ApplyDate,
          ExpireDate   = @ExpireDate,
          UnitPrice    = @UnitPrice,
          DevUnitPrice = @DevUnitPrice,
          DiscountRate = @DiscountRate,
          Currency     = @Currency,
          Remarks      = @Remarks,
          UpdatedAt    = GETDATE()
        WHERE Id = @Id
      `);

    // 단가 또는 적용일자가 변경된 경우에만 이력 기록
    const priceChanged = Number(old.UnitPrice) !== newUnitPrice;
    const applyChanged = String(old.ApplyDate ?? "").slice(0,10) !== String(newApplyDate ?? "").slice(0,10);
    const expireChanged = String(old.ExpireDate ?? "").slice(0,10) !== String(newExpireDate ?? "").slice(0,10);

    if (priceChanged || applyChanged || expireChanged) {
      await pool.request()
        .input("PurchasePriceId",    sql.Int,          id)
        .input("ItemCode",           sql.NVarChar(50),  itemCode.trim())
        .input("ItemName",           sql.NVarChar(200), itemName?.trim() ?? "")
        .input("SupplierName",       sql.NVarChar(200), supplierName.trim())
        .input("PreviousUnitPrice",  sql.Decimal(18,4), Number(old.UnitPrice))
        .input("NewUnitPrice",       sql.Decimal(18,4), newUnitPrice)
        .input("PreviousApplyDate",  sql.Date,          old.ApplyDate ?? null)
        .input("NewApplyDate",       sql.Date,          newApplyDate)
        .input("PreviousExpireDate", sql.Date,          old.ExpireDate ?? null)
        .input("NewExpireDate",      sql.Date,          newExpireDate)
        .input("ChangeType",         sql.NVarChar(10),  "수정")
        .input("Reason",             sql.NVarChar(500), editReason?.trim() || null)
        .query(`
          INSERT INTO dbo.PurchasePriceHistory
            (PurchasePriceId, ItemCode, ItemName, SupplierName,
             PreviousUnitPrice, NewUnitPrice,
             PreviousApplyDate, NewApplyDate,
             PreviousExpireDate, NewExpireDate,
             ChangeType, Reason)
          VALUES
            (@PurchasePriceId, @ItemCode, @ItemName, @SupplierName,
             @PreviousUnitPrice, @NewUnitPrice,
             @PreviousApplyDate, @NewApplyDate,
             @PreviousExpireDate, @NewExpireDate,
             @ChangeType, @Reason)
        `);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[purchase-prices][PUT]", err);
    return NextResponse.json({ ok: false, message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── DELETE: 단건 삭제 ─────────────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false, message: "잘못된 ID입니다." }, { status: 400 });

  try {
    await ensureHistoryTable();
    const pool = await getDbPool();

    // 삭제 전 현재 값 조회
    const prev = await pool.request()
      .input("Id", sql.Int, id)
      .query(`SELECT ItemCode, ItemName, SupplierName, UnitPrice, ApplyDate, ExpireDate FROM dbo.PurchasePrice WHERE Id = @Id`);

    if (!prev.recordset.length) {
      return NextResponse.json({ ok: false, message: "데이터를 찾을 수 없습니다." }, { status: 404 });
    }

    const old = prev.recordset[0];

    // 삭제 이력 기록
    await pool.request()
      .input("PurchasePriceId",    sql.Int,          id)
      .input("ItemCode",           sql.NVarChar(50),  String(old.ItemCode ?? ""))
      .input("ItemName",           sql.NVarChar(200), String(old.ItemName ?? ""))
      .input("SupplierName",       sql.NVarChar(200), String(old.SupplierName ?? ""))
      .input("PreviousUnitPrice",  sql.Decimal(18,4), Number(old.UnitPrice))
      .input("PreviousApplyDate",  sql.Date,          old.ApplyDate ?? null)
      .input("PreviousExpireDate", sql.Date,          old.ExpireDate ?? null)
      .input("ChangeType",         sql.NVarChar(10),  "삭제")
      .query(`
        INSERT INTO dbo.PurchasePriceHistory
          (PurchasePriceId, ItemCode, ItemName, SupplierName,
           PreviousUnitPrice, NewUnitPrice,
           PreviousApplyDate, NewApplyDate,
           PreviousExpireDate, NewExpireDate,
           ChangeType, Reason)
        VALUES
          (@PurchasePriceId, @ItemCode, @ItemName, @SupplierName,
           @PreviousUnitPrice, NULL,
           @PreviousApplyDate, NULL,
           @PreviousExpireDate, NULL,
           @ChangeType, NULL)
      `);

    // 실제 삭제
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM dbo.PurchasePrice WHERE Id = @Id`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[purchase-prices][DELETE]", err);
    return NextResponse.json({ ok: false, message: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
