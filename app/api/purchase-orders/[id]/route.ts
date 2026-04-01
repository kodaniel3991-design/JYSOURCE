import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import type { POStatus } from "@/types/purchase";

const STATUS_MAP: Record<string, POStatus> = {
  draft: "draft", approved: "approved", issued: "issued",
  confirmed: "confirmed", partial: "partial", received: "received",
  closed: "closed", cancelled: "cancelled",
};
function toStatus(s: unknown): POStatus {
  return (typeof s === "string" && STATUS_MAP[s]) ? STATUS_MAP[s] : "draft";
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getDbPool();

    const poResult = await pool.request()
      .input("Id", sql.Int, Number(params.id))
      .query(`
        SELECT
          po.Id, po.PoNumber, po.OrderStatus,
          po.SupplierCode, po.SupplierName, po.CurrencyCode,
          po.PaymentType, po.PaymentTerms, po.BuyerCode, po.BuyerName,
          po.SupplierQuotationNo, po.SupplierContactPerson, po.AdvancePayment,
          CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
          po.VatRate, po.ImportType, po.BusinessPlace,
          po.PackagingStatus, po.InspectionCondition, po.DeliveryCondition,
          po.OtherCondition, po.Notes, po.TotalAmount
        FROM dbo.PurchaseOrder po
        WHERE po.Id = @Id
      `);

    if (poResult.recordset.length === 0) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }

    const r = poResult.recordset[0] as Record<string, unknown>;

    const itemsResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, Number(params.id))
      .query(`
        SELECT
          SpecNo, ItemCode, ItemName, Material, Specification,
          Warehouse, Quantity, ReceivedQty, UnitPrice, Amount,
          IsProvisionalPrice,
          CONVERT(NVARCHAR(10), DueDate, 23) AS DueDate
        FROM dbo.PurchaseOrderItem
        WHERE PurchaseOrderId = @PurchaseOrderId
        ORDER BY SpecNo
      `);

    const basicForm = {
      orderStatus:            toStatus(r.OrderStatus),
      supplierId:             String(r.SupplierCode ?? ""),
      supplierName:           String(r.SupplierName ?? ""),
      currencyCode:           String(r.CurrencyCode ?? ""),
      paymentType:            String(r.PaymentType ?? ""),
      paymentTerms:           String(r.PaymentTerms ?? ""),
      buyerCode:              String(r.BuyerCode ?? ""),
      buyerName:              String(r.BuyerName ?? ""),
      supplierQuotationNo:    String(r.SupplierQuotationNo ?? ""),
      supplierContactPerson:  String(r.SupplierContactPerson ?? ""),
      advancePayment:         String(r.AdvancePayment ?? ""),
      orderDate:              String(r.OrderDate ?? ""),
      vatRate:                String(r.VatRate ?? ""),
      importType:             String(r.ImportType ?? ""),
      businessPlace:          String(r.BusinessPlace ?? ""),
      packagingStatus:        String(r.PackagingStatus ?? ""),
      inspectionCondition:    String(r.InspectionCondition ?? ""),
      deliveryCondition:      String(r.DeliveryCondition ?? ""),
      otherCondition:         String(r.OtherCondition ?? ""),
      notes:                  String(r.Notes ?? ""),
    };

    const specItems = itemsResult.recordset.map((it: Record<string, unknown>) => ({
      itemCode:          String(it.ItemCode ?? ""),
      itemName:          String(it.ItemName ?? ""),
      material:          String(it.Material ?? ""),
      specification:     String(it.Specification ?? ""),
      warehouse:         String(it.Warehouse ?? ""),
      quantity:          Number(it.Quantity ?? 0),
      receivedQty:       Number(it.ReceivedQty ?? 0),
      unitPrice:         Number(it.UnitPrice ?? 0),
      amount:            Number(it.Amount ?? 0),
      isProvisionalPrice: Boolean(it.IsProvisionalPrice),
      dueDate:           String(it.DueDate ?? ""),
    }));

    return NextResponse.json({
      ok: true,
      data: {
        id: String(r.Id),
        orderNumber: String(r.PoNumber ?? ""),
        totalAmount: Number(r.TotalAmount ?? 0),
        basicForm,
        specItems,
      },
    });
  } catch (error) {
    console.error("[purchase-orders][GET/:id]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const totalAmount = (items as { amount?: number }[]).reduce((s, i) => s + (i.amount ?? 0), 0);

    const pool = await getDbPool();

    // 이 오더에 연결된 매입확정(회계처리) 실적이 있으면 수정 불가
    const lockCheck = await pool.request()
      .input("PurchaseOrderId", sql.Int, Number(params.id))
      .query(`
        SELECT COUNT(1) AS Cnt
        FROM dbo.PurchaseInputItem pii
        JOIN dbo.PurchaseInput pi ON pi.Id = pii.PurchaseInputId
        JOIN dbo.ReceiptHistory rh ON rh.Id = pii.ReceiptHistoryId
        WHERE rh.PurchaseOrderId = @PurchaseOrderId
          AND pi.Status = N'회계처리'
      `);
    if (Number(lockCheck.recordset[0].Cnt) > 0)
      return NextResponse.json({ ok: false, message: "매입확정(회계처리) 된 실적이 연결된 구매오더는 수정할 수 없습니다." }, { status: 423 });

    await pool.request()
      .input("Id",                    sql.Int,          Number(params.id))
      .input("OrderStatus",           sql.NVarChar(20),  orderStatus ?? "draft")
      .input("SupplierCode",          sql.NVarChar(50),  supplierId ?? null)
      .input("SupplierName",          sql.NVarChar(200), supplierName ?? null)
      .input("CurrencyCode",          sql.NVarChar(10),  currencyCode ?? null)
      .input("PaymentType",           sql.NVarChar(50),  paymentType ?? null)
      .input("PaymentTerms",          sql.NVarChar(50),  paymentTerms ?? null)
      .input("BuyerCode",             sql.NVarChar(50),  buyerCode ?? null)
      .input("BuyerName",             sql.NVarChar(100), buyerName ?? null)
      .input("SupplierQuotationNo",   sql.NVarChar(100), supplierQuotationNo ?? null)
      .input("SupplierContactPerson", sql.NVarChar(100), supplierContactPerson ?? null)
      .input("AdvancePayment",        sql.NVarChar(50),  advancePayment ?? null)
      .input("OrderDate",             sql.Date,          orderDate || null)
      .input("VatRate",               sql.NVarChar(10),  vatRate ?? null)
      .input("ImportType",            sql.NVarChar(20),  importType ?? null)
      .input("BusinessPlace",         sql.NVarChar(20),  businessPlace ?? null)
      .input("PackagingStatus",       sql.NVarChar(100), packagingStatus ?? null)
      .input("InspectionCondition",   sql.NVarChar(200), inspectionCondition ?? null)
      .input("DeliveryCondition",     sql.NVarChar(200), deliveryCondition ?? null)
      .input("OtherCondition",        sql.NVarChar(200), otherCondition ?? null)
      .input("Notes",                 sql.NVarChar(2000),notes ?? null)
      .input("TotalAmount",           sql.Decimal(18, 2),totalAmount)
      .query(`
        UPDATE dbo.PurchaseOrder SET
          OrderStatus = @OrderStatus, SupplierCode = @SupplierCode,
          SupplierName = @SupplierName, CurrencyCode = @CurrencyCode,
          PaymentType = @PaymentType, PaymentTerms = @PaymentTerms,
          BuyerCode = @BuyerCode, BuyerName = @BuyerName,
          SupplierQuotationNo = @SupplierQuotationNo,
          SupplierContactPerson = @SupplierContactPerson,
          AdvancePayment = @AdvancePayment, OrderDate = @OrderDate,
          VatRate = @VatRate, ImportType = @ImportType,
          BusinessPlace = @BusinessPlace, PackagingStatus = @PackagingStatus,
          InspectionCondition = @InspectionCondition,
          DeliveryCondition = @DeliveryCondition, OtherCondition = @OtherCondition,
          Notes = @Notes, TotalAmount = @TotalAmount,
          UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);

    // 명세: 기존 삭제 후 재삽입
    await pool.request()
      .input("PurchaseOrderId", sql.Int, Number(params.id))
      .query(`DELETE FROM dbo.PurchaseOrderItem WHERE PurchaseOrderId = @PurchaseOrderId`);

    if (Array.isArray(items) && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx] as Record<string, unknown>;
        if (!String(it.itemCode ?? "").trim()) continue;
        await pool.request()
          .input("PurchaseOrderId",    sql.Int,          Number(params.id))
          .input("SpecNo",             sql.Int,          idx + 1)
          .input("ItemCode",           sql.NVarChar(50), String(it.itemCode ?? ""))
          .input("ItemName",           sql.NVarChar(200),String(it.itemName ?? ""))
          .input("Material",           sql.NVarChar(100),String(it.material ?? ""))
          .input("Specification",      sql.NVarChar(200),String(it.specification ?? ""))
          .input("Warehouse",          sql.NVarChar(20), String(it.warehouse ?? ""))
          .input("Quantity",           sql.Decimal(18,3),Number(it.quantity ?? 0))
          .input("ReceivedQty",        sql.Decimal(18,3),Number(it.receivedQty ?? 0))
          .input("UnitPrice",          sql.Decimal(18,2),Number(it.unitPrice ?? 0))
          .input("Amount",             sql.Decimal(18,2),Number(it.amount ?? 0))
          .input("IsProvisionalPrice", sql.Bit,          it.isProvisionalPrice ? 1 : 0)
          .input("DueDate",            sql.Date,         String(it.dueDate ?? "") || null)
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-orders][PUT/:id]", error);
    return NextResponse.json({ ok: false, message: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getDbPool();
    // 자식 레코드(명세) 먼저 삭제 후 부모(오더) 삭제
    await pool.request()
      .input("Id", sql.Int, Number(params.id))
      .query(`
        DELETE FROM dbo.PurchaseOrderItem WHERE PurchaseOrderId = @Id;
        DELETE FROM dbo.PurchaseOrder WHERE Id = @Id;
      `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[purchase-orders][DELETE/:id]", error);
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
