import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { purchaseOrderSummaries } from "@/lib/mock/purchase-orders";
import type { PurchaseOrderSummary, POStatus } from "@/types/purchase";

const STATUS_MAP: Record<string, POStatus> = {
  draft: "draft",
  approved: "approved",
  issued: "issued",
  partial_receipt: "partial_receipt",
  closed: "closed",
};

function toStatus(s: unknown): POStatus {
  if (typeof s !== "string") return "draft";
  return STATUS_MAP[s] ?? "draft";
}

function rowToSummary(r: {
  Id: number;
  PoNumber: string;
  SupplierCode: string | null;
  SupplierName: string | null;
  ItemCount: number;
  TotalAmount: number;
  DueDate: string | null;
  OrderStatus: string;
  AssignedTo: string | null;
}): PurchaseOrderSummary {
  return {
    id: String(r.Id),
    poNumber: r.PoNumber ?? "",
    supplierId: r.SupplierCode ?? "",
    supplierName: r.SupplierName ?? "",
    itemCount: Number(r.ItemCount) ?? 0,
    totalAmount: Number(r.TotalAmount) ?? 0,
    dueDate: r.DueDate ? String(r.DueDate).slice(0, 10) : "",
    status: toStatus(r.OrderStatus),
    assignedTo: r.AssignedTo ?? "",
  };
}

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        po.Id,
        po.PoNumber,
        po.SupplierCode,
        po.SupplierName,
        (SELECT COUNT(1) FROM dbo.PurchaseOrderItem it WHERE it.PurchaseOrderId = po.Id) AS ItemCount,
        po.TotalAmount,
        CONVERT(NVARCHAR(10), po.DueDate, 120) AS DueDate,
        po.OrderStatus,
        po.AssignedTo
      FROM dbo.PurchaseOrder po
      ORDER BY po.UpdatedAt DESC, po.CreatedAt DESC
    `);

    const items: PurchaseOrderSummary[] = (result.recordset ?? []).map((r: any) =>
      rowToSummary({
        Id: r.Id,
        PoNumber: r.PoNumber,
        SupplierCode: r.SupplierCode,
        SupplierName: r.SupplierName,
        ItemCount: r.ItemCount,
        TotalAmount: r.TotalAmount,
        DueDate: r.DueDate,
        OrderStatus: r.OrderStatus,
        AssignedTo: r.AssignedTo,
      })
    );

    if (items.length === 0) {
      return NextResponse.json({
        ok: true,
        items: purchaseOrderSummaries,
        fallback: "DB 데이터가 없어 목 데이터를 반환했습니다.",
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-orders][GET]", error);
    return NextResponse.json({
      ok: true,
      items: purchaseOrderSummaries,
      fallback: "DB 연결 실패로 목 데이터를 반환했습니다.",
    });
  }
}
