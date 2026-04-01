import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT Id, InputNo, SupplierCode, SupplierName, MgmtNo,
               CONVERT(NVARCHAR(10), InputDate, 23) AS InputDate,
               Status, BuyerCode, BuyerName, AltVoucherNo, Note, Summary,
               DeptCode, DeptName, DeductionAmount,
               TotalAmount, TaxAmount, TotalWithTax, PaymentAmount
        FROM dbo.PurchaseInput WHERE Id = @Id
      `);

    if (!result.recordset.length)
      return NextResponse.json({ ok: false }, { status: 404 });

    const r = result.recordset[0] as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      header: {
        id:             String(r.Id),
        inputNo:        String(r.InputNo        ?? ""),
        supplierCode:   String(r.SupplierCode   ?? ""),
        supplierName:   String(r.SupplierName   ?? ""),
        mgmtNo:         String(r.MgmtNo         ?? ""),
        inputDate:      String(r.InputDate       ?? ""),
        status:         String(r.Status          ?? ""),
        buyerCode:      String(r.BuyerCode       ?? ""),
        buyerName:      String(r.BuyerName       ?? ""),
        altVoucherNo:   String(r.AltVoucherNo    ?? ""),
        note:           String(r.Note            ?? ""),
        summary:        String(r.Summary         ?? ""),
        deptCode:       String(r.DeptCode        ?? ""),
        deptName:       String(r.DeptName        ?? ""),
        deductionAmount:Number(r.DeductionAmount ?? 0),
        totalAmount:    Number(r.TotalAmount     ?? 0),
        taxAmount:      Number(r.TaxAmount       ?? 0),
        totalWithTax:   Number(r.TotalWithTax    ?? 0),
        paymentAmount:  Number(r.PaymentAmount   ?? 0),
      },
    });
  } catch (error) {
    console.error("[purchase-inputs/[id]][GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const body = await request.json();
    const { supplierCode, supplierName, mgmtNo, inputDate, status,
            buyerCode, buyerName, altVoucherNo, note, summary,
            deptCode, deptName, deductionAmount } = body;

    const pool = await getDbPool();
    await pool.request()
      .input("Id",             sql.Int,          id)
      .input("SupplierCode",   sql.NVarChar(50),  supplierCode)
      .input("SupplierName",   sql.NVarChar(200), supplierName  || null)
      .input("MgmtNo",         sql.NVarChar(50),  mgmtNo        || null)
      .input("InputDate",      sql.Date,          inputDate)
      .input("Status",         sql.NVarChar(20),  status        || "입력중")
      .input("BuyerCode",      sql.NVarChar(50),  buyerCode     || null)
      .input("BuyerName",      sql.NVarChar(100), buyerName     || null)
      .input("AltVoucherNo",   sql.NVarChar(50),  altVoucherNo  || null)
      .input("Note",           sql.NVarChar(500), note          || null)
      .input("Summary",        sql.NVarChar(500), summary       || null)
      .input("DeptCode",       sql.NVarChar(50),  deptCode      || null)
      .input("DeptName",       sql.NVarChar(100), deptName      || null)
      .input("DeductionAmount",sql.Decimal(18,0), deductionAmount || 0)
      .query(`
        UPDATE dbo.PurchaseInput SET
          SupplierCode=@SupplierCode, SupplierName=@SupplierName, MgmtNo=@MgmtNo,
          InputDate=@InputDate, Status=@Status, BuyerCode=@BuyerCode, BuyerName=@BuyerName,
          AltVoucherNo=@AltVoucherNo, Note=@Note, Summary=@Summary,
          DeptCode=@DeptCode, DeptName=@DeptName, DeductionAmount=@DeductionAmount
        WHERE Id = @Id
      `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-inputs/[id]][PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const pool = await getDbPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM dbo.PurchaseInput WHERE Id = @Id`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-inputs/[id]][DELETE]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
