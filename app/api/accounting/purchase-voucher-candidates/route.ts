import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bpParam  = searchParams.get("businessPlace") || null;
    const dateFrom = searchParams.get("dateFrom")      || null;
    const dateTo   = searchParams.get("dateTo")        || null;

    const factory       = await getSessionFactory(request);
    const businessPlace = bpParam ?? factory;
    const pool          = await getDbPool();

    const result = await pool.request()
      .input("DateFrom",      sql.Date,         dateFrom)
      .input("DateTo",        sql.Date,         dateTo)
      .input("BusinessPlace", sql.NVarChar(20), businessPlace)
      .query(`
        SELECT
          p.Id, p.InputNo, p.SupplierCode, p.SupplierName,
          CONVERT(NVARCHAR(10), p.InputDate, 23) AS InputDate,
          p.TotalAmount, p.TaxAmount, p.TotalWithTax,
          p.DeptCode, p.DeptName, p.Summary, p.BusinessPlace,
          i.Id AS ItemId, i.SeqNo, i.ItemCode, i.ItemName, i.Unit,
          i.InputQty,
          i.InputAmount  AS ItemInputAmount,
          i.TaxAmount    AS ItemTaxAmount,
          i.TotalWithTax AS ItemTotalWithTax,
          ISNULL(itc.ItemTypeName,          N'') AS PurchaseType,
          ISNULL(itc.PurchaseAccount,       N'') AS PurchaseAccount,
          ISNULL(itc.PurchaseAccountName,   N'') AS PurchaseAccountName
        FROM dbo.PurchaseInput p
        LEFT JOIN dbo.PurchaseInputItem i   ON i.PurchaseInputId = p.Id
        LEFT JOIN dbo.ItemMaster im         ON im.ItemNo = i.ItemCode
        LEFT JOIN dbo.ItemTypeCode itc      ON itc.ItemTypeCode = im.Form
        WHERE p.Status = N'확정'
          AND (@BusinessPlace IS NULL OR p.BusinessPlace = @BusinessPlace)
          AND (@DateFrom IS NULL OR p.InputDate >= @DateFrom)
          AND (@DateTo        IS NULL OR p.InputDate <= @DateTo)
        ORDER BY p.Id DESC, i.SeqNo
      `);

    type CandidateItem = {
      id: string; inputNo: string; supplierCode: string; supplierName: string;
      inputDate: string; totalAmount: number; taxAmount: number; totalWithTax: number;
      deptCode: string; deptName: string; summary: string; businessPlace: string;
      items: Array<{
        id: string; seqNo: number; itemCode: string; itemName: string; unit: string;
        inputQty: number; inputAmount: number; taxAmount: number; totalWithTax: number;
        purchaseType: string; purchaseAccount: string; purchaseAccountName: string;
      }>;
    };

    const map = new Map<string, CandidateItem>();

    for (const r of result.recordset as Record<string, unknown>[]) {
      const key = String(r.Id);
      if (!map.has(key)) {
        map.set(key, {
          id:            key,
          inputNo:       String(r.InputNo       ?? ""),
          supplierCode:  String(r.SupplierCode  ?? ""),
          supplierName:  String(r.SupplierName  ?? ""),
          inputDate:     String(r.InputDate     ?? ""),
          totalAmount:   Number(r.TotalAmount   ?? 0),
          taxAmount:     Number(r.TaxAmount     ?? 0),
          totalWithTax:  Number(r.TotalWithTax  ?? 0),
          deptCode:      String(r.DeptCode      ?? ""),
          deptName:      String(r.DeptName      ?? ""),
          summary:       String(r.Summary       ?? ""),
          businessPlace: String(r.BusinessPlace ?? ""),
          items:         [],
        });
      }
      if (r.ItemId) {
        map.get(key)!.items.push({
          id:                  String(r.ItemId),
          seqNo:               Number(r.SeqNo               ?? 0),
          itemCode:            String(r.ItemCode            ?? ""),
          itemName:            String(r.ItemName            ?? ""),
          unit:                String(r.Unit                ?? ""),
          inputQty:            Number(r.InputQty            ?? 0),
          inputAmount:         Number(r.ItemInputAmount     ?? 0),
          taxAmount:           Number(r.ItemTaxAmount       ?? 0),
          totalWithTax:        Number(r.ItemTotalWithTax    ?? 0),
          purchaseType:        String(r.PurchaseType        ?? ""),
          purchaseAccount:     String(r.PurchaseAccount     ?? ""),
          purchaseAccountName: String(r.PurchaseAccountName ?? ""),
        });
      }
    }

    return NextResponse.json({ ok: true, items: Array.from(map.values()) });
  } catch (error) {
    console.error("[purchase-voucher-candidates][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
