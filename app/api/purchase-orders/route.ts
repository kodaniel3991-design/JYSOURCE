import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";
import type { POStatus } from "@/types/purchase";

const STATUS_MAP: Record<string, POStatus> = {
  draft: "draft", approved: "approved", issued: "issued",
  confirmed: "confirmed", partial: "partial", received: "received",
  closed: "closed", cancelled: "cancelled",
};
function toStatus(s: unknown): POStatus {
  return (typeof s === "string" && STATUS_MAP[s]) ? STATUS_MAP[s] : "draft";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom     = searchParams.get("dateFrom")     || null;
    const dateTo       = searchParams.get("dateTo")       || null;
    const status       = searchParams.get("status")       || null;
    const poNumber     = searchParams.get("poNumber")     || null;
    const supplierCode = searchParams.get("supplierCode") || null;
    const itemCode     = searchParams.get("itemCode")     || null;
    const model        = searchParams.get("model")        || null;

    const factory = await getSessionFactory(request);
    const pool = await getDbPool();
    const result = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20),  factory)
      .input("DateFrom",      sql.Date,          dateFrom)
      .input("DateTo",        sql.Date,          dateTo)
      .input("Status",        sql.NVarChar(20),  status)
      .input("PoNumber",      sql.NVarChar(100), poNumber)
      .input("SupplierCode",  sql.NVarChar(50),  supplierCode)
      .input("ItemCode",      sql.NVarChar(50),  itemCode)
      .input("Model",         sql.NVarChar(100), model)
      .query(`
        SELECT
          po.Id, po.PoNumber, po.OrderStatus,
          po.SupplierCode, po.SupplierName,
          po.BuyerCode, po.BuyerName,
          CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
          po.TotalAmount,
          (SELECT COUNT(1) FROM dbo.PurchaseOrderItem i WHERE i.PurchaseOrderId = po.Id) AS ItemCount
        FROM dbo.PurchaseOrder po
        WHERE (@BusinessPlace  IS NULL OR po.BusinessPlace = @BusinessPlace)
          AND (@DateFrom       IS NULL OR po.OrderDate >= @DateFrom)
          AND (@DateTo         IS NULL OR po.OrderDate <= @DateTo)
          AND (@Status         IS NULL OR po.OrderStatus = @Status)
          AND (@PoNumber       IS NULL OR po.PoNumber LIKE '%' + @PoNumber + '%'
                                       OR po.SupplierName LIKE '%' + @PoNumber + '%')
          AND (@SupplierCode   IS NULL OR po.SupplierCode = @SupplierCode)
          AND (@ItemCode       IS NULL OR EXISTS (
                SELECT 1 FROM dbo.PurchaseOrderItem poi
                WHERE poi.PurchaseOrderId = po.Id
                  AND poi.ItemCode LIKE '%' + @ItemCode + '%'
              ))
          AND (@Model          IS NULL OR EXISTS (
                SELECT 1 FROM dbo.PurchaseOrderItem poi2
                JOIN dbo.ItemMaster im ON im.ItemNo = poi2.ItemCode
                WHERE poi2.PurchaseOrderId = po.Id
                  AND im.VehicleModel = @Model
              ))
        ORDER BY po.PoNumber DESC
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => ({
      id:           String(r.Id),
      orderNumber:  String(r.PoNumber ?? ""),
      orderStatus:  toStatus(r.OrderStatus),
      supplierId:   String(r.SupplierCode ?? ""),
      supplierName: String(r.SupplierName ?? ""),
      buyerCode:    String(r.BuyerCode ?? ""),
      buyerName:    String(r.BuyerName ?? ""),
      orderDate:    String(r.OrderDate ?? ""),
      totalAmount:  Number(r.TotalAmount ?? 0),
      itemCount:    Number(r.ItemCount ?? 0),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-orders][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderStatus, supplierId, supplierName, currencyCode,
      paymentType, paymentTerms, buyerCode, buyerName,
      supplierQuotationNo, supplierContactPerson, advancePayment,
      orderDate, vatRate, importType, businessPlace,
      packagingStatus, inspectionCondition, deliveryCondition,
      otherCondition, notes, items = [],
    } = body;

    const pool = await getDbPool();

    // PoNumber 생성: PO-YYYY-NNNN
    const year = new Date().getFullYear();
    const countResult = await pool.request()
      .input("Prefix", sql.NVarChar(10), `PO-${year}-%`)
      .query(`SELECT COUNT(1) AS Cnt FROM dbo.PurchaseOrder WHERE PoNumber LIKE @Prefix`);
    const seq = Number(countResult.recordset[0].Cnt) + 1;
    const poNumber = `PO-${year}-${String(seq).padStart(4, "0")}`;

    const totalAmount = (items as { amount?: number }[]).reduce((s, i) => s + (i.amount ?? 0), 0);

    const insertResult = await pool.request()
      .input("PoNumber",              sql.NVarChar(20),   poNumber)
      .input("OrderStatus",           sql.NVarChar(20),   orderStatus ?? "draft")
      .input("SupplierCode",          sql.NVarChar(50),   supplierId ?? null)
      .input("SupplierName",          sql.NVarChar(200),  supplierName ?? null)
      .input("CurrencyCode",          sql.NVarChar(10),   currencyCode ?? null)
      .input("PaymentType",           sql.NVarChar(50),   paymentType ?? null)
      .input("PaymentTerms",          sql.NVarChar(50),   paymentTerms ?? null)
      .input("BuyerCode",             sql.NVarChar(50),   buyerCode ?? null)
      .input("BuyerName",             sql.NVarChar(100),  buyerName ?? null)
      .input("SupplierQuotationNo",   sql.NVarChar(100),  supplierQuotationNo ?? null)
      .input("SupplierContactPerson", sql.NVarChar(100),  supplierContactPerson ?? null)
      .input("AdvancePayment",        sql.NVarChar(50),   advancePayment ?? null)
      .input("OrderDate",             sql.Date,           orderDate || null)
      .input("VatRate",               sql.NVarChar(10),   vatRate ?? null)
      .input("ImportType",            sql.NVarChar(20),   importType ?? null)
      .input("BusinessPlace",         sql.NVarChar(20),   businessPlace ?? null)
      .input("PackagingStatus",       sql.NVarChar(100),  packagingStatus ?? null)
      .input("InspectionCondition",   sql.NVarChar(200),  inspectionCondition ?? null)
      .input("DeliveryCondition",     sql.NVarChar(200),  deliveryCondition ?? null)
      .input("OtherCondition",        sql.NVarChar(200),  otherCondition ?? null)
      .input("Notes",                 sql.NVarChar(2000), notes ?? null)
      .input("TotalAmount",           sql.Decimal(18, 2), totalAmount)
      .query(`
        INSERT INTO dbo.PurchaseOrder
          (PoNumber, OrderStatus, SupplierCode, SupplierName, CurrencyCode,
           PaymentType, PaymentTerms, BuyerCode, BuyerName, SupplierQuotationNo,
           SupplierContactPerson, AdvancePayment, OrderDate, VatRate, ImportType,
           BusinessPlace, PackagingStatus, InspectionCondition, DeliveryCondition,
           OtherCondition, Notes, TotalAmount)
        OUTPUT INSERTED.Id
        VALUES
          (@PoNumber, @OrderStatus, @SupplierCode, @SupplierName, @CurrencyCode,
           @PaymentType, @PaymentTerms, @BuyerCode, @BuyerName, @SupplierQuotationNo,
           @SupplierContactPerson, @AdvancePayment, @OrderDate, @VatRate, @ImportType,
           @BusinessPlace, @PackagingStatus, @InspectionCondition, @DeliveryCondition,
           @OtherCondition, @Notes, @TotalAmount)
      `);

    const newId = insertResult.recordset[0].Id;

    // 명세 아이템 저장
    if (Array.isArray(items) && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx] as Record<string, unknown>;
        if (!String(it.itemCode ?? "").trim()) continue;
        await pool.request()
          .input("PurchaseOrderId",   sql.Int,          newId)
          .input("SpecNo",            sql.Int,          idx + 1)
          .input("ItemCode",          sql.NVarChar(50), String(it.itemCode ?? ""))
          .input("ItemName",          sql.NVarChar(200),String(it.itemName ?? ""))
          .input("Material",          sql.NVarChar(100),String(it.material ?? ""))
          .input("Specification",     sql.NVarChar(200),String(it.specification ?? ""))
          .input("Warehouse",         sql.NVarChar(20), String(it.warehouse ?? ""))
          .input("Quantity",          sql.Decimal(18,3),Number(it.quantity ?? 0))
          .input("ReceivedQty",       sql.Decimal(18,3),Number(it.receivedQty ?? 0))
          .input("UnitPrice",         sql.Decimal(18,2),Number(it.unitPrice ?? 0))
          .input("Amount",            sql.Decimal(18,2),Number(it.amount ?? 0))
          .input("IsProvisionalPrice",sql.Bit,          it.isProvisionalPrice ? 1 : 0)
          .input("DueDate",           sql.Date,         String(it.dueDate ?? "") || null)
          .query(`
            INSERT INTO dbo.PurchaseOrderItem
              (PurchaseOrderId, SpecNo, ItemCode, ItemName, Material, Specification,
               Warehouse, Quantity, ReceivedQty, UnitPrice, Amount, IsProvisionalPrice, DueDate)
            VALUES
              (@PurchaseOrderId, @SpecNo, @ItemCode, @ItemName, @Material, @Specification,
               @Warehouse, @Quantity, @ReceivedQty, @UnitPrice, @Amount, @IsProvisionalPrice, @DueDate)
          `);
      }
    }

    return NextResponse.json({ ok: true, id: newId, poNumber });
  } catch (error) {
    console.error("[purchase-orders][POST]", error);
    return NextResponse.json({ ok: false, message: "등록 실패" }, { status: 500 });
  }
}
