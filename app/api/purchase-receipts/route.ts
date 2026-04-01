import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();
    const result = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        SELECT
          po.Id, po.PoNumber, po.OrderStatus,
          po.SupplierCode, po.SupplierName,
          po.BuyerCode, po.BuyerName,
          CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
          po.TotalAmount
        FROM dbo.PurchaseOrder po
        WHERE po.OrderStatus IN ('issued', 'confirmed', 'partial', 'received')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        ORDER BY po.UpdatedAt DESC, po.CreatedAt DESC
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      id:           String(r.Id),
      orderNumber:  String(r.PoNumber ?? ""),
      orderStatus:  String(r.OrderStatus ?? ""),
      supplierId:   String(r.SupplierCode ?? ""),
      supplierName: String(r.SupplierName ?? ""),
      buyerCode:    String(r.BuyerCode ?? ""),
      buyerName:    String(r.BuyerName ?? ""),
      orderDate:    String(r.OrderDate ?? ""),
      totalAmount:  Number(r.TotalAmount ?? 0),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-receipts][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
