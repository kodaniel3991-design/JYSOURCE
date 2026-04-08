import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom    = searchParams.get("dateFrom")    || null;
    const dateTo      = searchParams.get("dateTo")      || null;
    const orderDateFrom = searchParams.get("orderDateFrom") || null;
    const orderDateTo   = searchParams.get("orderDateTo")   || null;
    const viewMode    = searchParams.get("viewMode")    || "차종별"; // 차종별 | 거래처별

    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const result = await pool.request()
      .input("BusinessPlace",  sql.NVarChar(20), factory)
      .input("DateFrom",       sql.Date,         dateFrom)
      .input("DateTo",         sql.Date,         dateTo)
      .input("OrderDateFrom",  sql.Date,         orderDateFrom)
      .input("OrderDateTo",    sql.Date,         orderDateTo)
      .query(`
        SELECT
          po.PoNumber,
          po.SupplierCode,
          po.SupplierName,
          CONVERT(NVARCHAR(10), po.OrderDate, 23)  AS OrderDate,
          po.OrderStatus,
          poi.SpecNo,
          poi.ItemCode,
          poi.ItemName,
          ISNULL(poi.Specification, '')             AS Specification,
          ISNULL(im.Unit, '')                       AS Unit,
          ISNULL(im.VehicleModel, '')               AS VehicleModel,
          poi.Quantity                              AS OrderQty,
          ISNULL(poi.UnitPrice, 0)                  AS UnitPrice,
          ISNULL(poi.Amount, 0)                     AS OrderAmount,
          CONVERT(NVARCHAR(10), poi.DueDate, 23)    AS DueDate,
          ISNULL(SUM(CASE WHEN rh.Type = N'입고' THEN rh.Qty ELSE 0 END)
               - SUM(CASE WHEN rh.Type = N'반품' THEN rh.Qty ELSE 0 END), 0) AS ReceiveQty,
          ISNULL(SUM(CASE WHEN rh.Type = N'입고' THEN ISNULL(rh.Qty,0) * ISNULL(rh.UnitPrice, ISNULL(poi.UnitPrice,0)) ELSE 0 END)
               - SUM(CASE WHEN rh.Type = N'반품' THEN ISNULL(rh.Qty,0) * ISNULL(rh.UnitPrice, ISNULL(poi.UnitPrice,0)) ELSE 0 END), 0) AS ReceiveAmount
        FROM dbo.PurchaseOrderItem poi
        JOIN dbo.PurchaseOrder po ON po.Id = poi.PurchaseOrderId
        LEFT JOIN dbo.ItemMaster im ON im.ItemNo = poi.ItemCode
        LEFT JOIN dbo.ReceiptHistory rh
               ON rh.PurchaseOrderId = po.Id AND rh.ItemCode = poi.ItemCode
        WHERE po.OrderStatus IN ('issued','confirmed','partial','received','closed')
          AND (@BusinessPlace  IS NULL OR po.BusinessPlace = @BusinessPlace)
          AND (@DateFrom       IS NULL OR poi.DueDate      >= @DateFrom)
          AND (@DateTo         IS NULL OR poi.DueDate      <= @DateTo)
          AND (@OrderDateFrom  IS NULL OR po.OrderDate     >= @OrderDateFrom)
          AND (@OrderDateTo    IS NULL OR po.OrderDate     <= @OrderDateTo)
        GROUP BY
          po.PoNumber, po.SupplierCode, po.SupplierName, po.OrderDate, po.OrderStatus,
          poi.SpecNo, poi.ItemCode, poi.ItemName, poi.Specification,
          im.Unit, im.VehicleModel,
          poi.Quantity, poi.UnitPrice, poi.Amount, poi.DueDate
        ORDER BY po.PoNumber, poi.SpecNo
      `);

    const items = result.recordset.map((r: Record<string, unknown>) => {
      const orderQty     = Number(r.OrderQty    ?? 0);
      const orderAmount  = Number(r.OrderAmount ?? 0);
      const receiveQty   = Number(r.ReceiveQty  ?? 0);
      const receiveAmount= Number(r.ReceiveAmount ?? 0);
      const unreceived   = orderQty   - receiveQty;
      const unreceivedAmt= orderAmount - receiveAmount;
      const rate = orderQty > 0 ? Math.round((receiveQty / orderQty) * 100) : 0;

      return {
        poNumber:         String(r.PoNumber     ?? ""),
        supplierCode:     String(r.SupplierCode ?? ""),
        supplierName:     String(r.SupplierName ?? ""),
        orderDate:        String(r.OrderDate    ?? ""),
        orderStatus:      String(r.OrderStatus  ?? ""),
        specNo:           Number(r.SpecNo       ?? 0),
        itemCode:         String(r.ItemCode     ?? ""),
        itemName:         String(r.ItemName     ?? ""),
        specification:    String(r.Specification ?? ""),
        unit:             String(r.Unit         ?? ""),
        vehicleModel:     String(r.VehicleModel ?? ""),
        orderQty,
        unitPrice:        Number(r.UnitPrice    ?? 0),
        orderAmount,
        dueDate:          String(r.DueDate      ?? ""),
        receiveQty,
        receiveAmount,
        unreceivedQty:    unreceived,
        unreceivedAmount: unreceivedAmt,
        receiptRate:      rate,
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[performance/receipts][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
