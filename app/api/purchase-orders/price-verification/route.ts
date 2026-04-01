import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate    = searchParams.get("startDate")    ?? "";
  const endDate      = searchParams.get("endDate")      ?? "";
  const supplierCode = searchParams.get("supplierCode") ?? "";
  const supplierName = searchParams.get("supplierName") ?? "";
  const itemCode     = searchParams.get("itemCode")     ?? "";
  const model        = searchParams.get("model")        ?? "";

  if (!startDate || !endDate) {
    return NextResponse.json({ ok: false, message: "발주일 범위를 입력하세요.", items: [] }, { status: 400 });
  }

  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();
    const req  = pool.request()
      .input("StartDate",     sql.Date,          startDate)
      .input("EndDate",       sql.Date,          endDate)
      .input("SupplierCode",  sql.NVarChar(50),  supplierCode || null)
      .input("SupplierName",  sql.NVarChar(200), supplierName || null)
      .input("ItemCode",      sql.NVarChar(100), itemCode     || null)
      .input("Model",         sql.NVarChar(100), model        || null)
      .input("BusinessPlace", sql.NVarChar(20),  factory);

    const result = await req.query(`
      SELECT
        po.Id              AS PoId,
        po.PoNumber,
        CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
        po.SupplierCode,
        po.SupplierName,
        poi.SpecNo,
        poi.ItemCode,
        poi.ItemName,
        poi.Quantity,
        poi.UnitPrice                  AS PoUnitPrice,
        pp.UnitPrice                   AS CurrentUnitPrice,
        CONVERT(NVARCHAR(10), pp.ApplyDate, 23) AS PriceApplyDate,
        ISNULL(im.VehicleModel, '')    AS VehicleModel
      FROM dbo.PurchaseOrder po
      JOIN dbo.PurchaseOrderItem poi
        ON poi.PurchaseOrderId = po.Id
      LEFT JOIN dbo.ItemMaster im
        ON im.ItemNo = poi.ItemCode
      CROSS APPLY (
        SELECT TOP 1 UnitPrice, ApplyDate
        FROM dbo.PurchasePrice pp2
        WHERE pp2.ItemCode    = poi.ItemCode
          AND (pp2.ApplyDate IS NULL OR pp2.ApplyDate >= @StartDate)
        ORDER BY pp2.ApplyDate DESC
      ) pp
      WHERE po.OrderDate BETWEEN @StartDate AND @EndDate
        AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        AND (@SupplierCode IS NULL OR po.SupplierCode LIKE '%' + @SupplierCode + '%')
        AND (@SupplierName IS NULL OR po.SupplierName LIKE '%' + @SupplierName + '%')
        AND (@ItemCode     IS NULL OR poi.ItemCode    LIKE '%' + @ItemCode     + '%')
        AND (@Model        IS NULL OR im.VehicleModel LIKE '%' + @Model        + '%')
        AND ABS(ISNULL(poi.UnitPrice, 0) - ISNULL(pp.UnitPrice, 0)) > 0
      ORDER BY po.OrderDate DESC, po.PoNumber, poi.SpecNo
    `);

    const items = result.recordset.map((r: Record<string, unknown>) => {
      const poPrice      = Number(r.PoUnitPrice  ?? 0);
      const currentPrice = r.CurrentUnitPrice != null ? Number(r.CurrentUnitPrice) : null;
      // diff = 최신단가 - 발주단가 (양수: 단가상승, 음수: 단가하락)
      const diff     = currentPrice != null ? currentPrice - poPrice : null;
      // diffRate 기준: 발주단가 대비 변동율
      const diffRate = (poPrice !== 0 && currentPrice != null)
        ? ((currentPrice - poPrice) / poPrice) * 100
        : null;
      const qty = Number(r.Quantity ?? 0);

      return {
        poId:             Number(r.PoId),
        poNumber:         String(r.PoNumber        ?? ""),
        orderDate:        String(r.OrderDate       ?? ""),
        supplierCode:     String(r.SupplierCode    ?? ""),
        supplierName:     String(r.SupplierName    ?? ""),
        specNo:           Number(r.SpecNo          ?? 0),
        itemCode:         String(r.ItemCode        ?? ""),
        itemName:         String(r.ItemName        ?? ""),
        vehicleModel:     String(r.VehicleModel    ?? ""),
        quantity:         qty,
        poUnitPrice:      poPrice,
        currentUnitPrice: currentPrice,
        priceApplyDate:   r.PriceApplyDate ? String(r.PriceApplyDate) : null,
        diff,
        diffRate:         diffRate != null ? Math.round(diffRate * 10) / 10 : null,
        amountDiff:       diff != null ? diff * qty : null,
        status:           diff != null && diff > 0 ? "단가상승" : "단가하락",
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[price-verification]", err);
    return NextResponse.json({ ok: false, message: "조회 실패", items: [] }, { status: 500 });
  }
}
