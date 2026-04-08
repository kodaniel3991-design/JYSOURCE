import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const months = Math.min(Math.max(Number(searchParams.get("months") || "12"), 1), 24);

    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const r = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .input("Months",        sql.Int,          months)
      .query(`
        DECLARE @Today       DATE = CAST(GETDATE() AS DATE);
        DECLARE @YearStart   DATE = DATEFROMPARTS(YEAR(@Today), 1, 1);
        DECLARE @PeriodStart DATE = DATEADD(MONTH, -(@Months - 1),
                               DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1));

        -- 1) KPI
        SELECT
          ISNULL(SUM(CASE WHEN po.OrderDate >= @YearStart THEN po.TotalAmount ELSE 0 END), 0) AS TotalSpend,
          COUNT(DISTINCT CASE WHEN po.OrderStatus NOT IN ('cancelled') THEN po.SupplierCode END) AS ActiveSuppliers,
          ISNULL(AVG(CASE WHEN po.OrderDate >= @YearStart AND po.OrderStatus NOT IN ('cancelled')
                          THEN po.TotalAmount END), 0) AS AvgOrderAmount,
          COUNT(DISTINCT CASE WHEN po.OrderDate >= @YearStart AND po.OrderStatus NOT IN ('cancelled')
                               THEN po.SupplierCode END) AS SupplierCount
        FROM dbo.PurchaseOrder po
        WHERE po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace);

        -- 2) 납기 준수율
        SELECT
          COUNT(CASE WHEN rh.ReceiptDate <= poi.DueDate THEN 1 END) AS OnTime,
          COUNT(1) AS Total
        FROM dbo.ReceiptHistory rh
        JOIN dbo.PurchaseOrder po  ON po.Id  = rh.PurchaseOrderId
        JOIN dbo.PurchaseOrderItem poi ON poi.PurchaseOrderId = po.Id AND poi.ItemCode = rh.ItemCode
        WHERE rh.Type = N'입고'
          AND po.OrderDate >= @PeriodStart
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace);

        -- 3) 월별 구매금액
        SELECT FORMAT(po.OrderDate, 'yyyy-MM') AS Month, SUM(po.TotalAmount) AS Amount
        FROM dbo.PurchaseOrder po
        WHERE po.OrderDate >= @PeriodStart
          AND po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        GROUP BY FORMAT(po.OrderDate, 'yyyy-MM')
        ORDER BY Month;

        -- 4) 공급사별 구매금액 (기간 내 TOP 10)
        SELECT TOP 10 po.SupplierName AS Name, SUM(po.TotalAmount) AS Value
        FROM dbo.PurchaseOrder po
        WHERE po.OrderDate >= @PeriodStart
          AND po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        GROUP BY po.SupplierName
        ORDER BY Value DESC;

        -- 5) 품목유형별 구매 비중
        SELECT
          ISNULL(it.ItemTypeName, N'기타') AS Category,
          SUM(poi.Amount)                  AS Amount
        FROM dbo.PurchaseOrderItem poi
        JOIN dbo.PurchaseOrder po ON po.Id = poi.PurchaseOrderId
        LEFT JOIN dbo.ItemMaster im ON im.ItemNo = poi.ItemCode
        LEFT JOIN dbo.ItemType it   ON it.ItemTypeCode = im.Type
        WHERE po.OrderDate >= @PeriodStart
          AND po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        GROUP BY it.ItemTypeName
        ORDER BY Amount DESC;

        -- 6) 공급사별 분석 테이블
        SELECT
          po.SupplierCode,
          po.SupplierName,
          SUM(po.TotalAmount)                                          AS TotalSpend,
          COUNT(DISTINCT po.Id)                                        AS OrderCount,
          ISNULL(AVG(NULLIF(poi2.UnitPrice, 0)), 0)                   AS AvgUnitPrice,
          COUNT(CASE WHEN rh2.ReceiptDate <= poi_d.DueDate THEN 1 END) AS OnTimeCount,
          COUNT(rh2.Id)                                                AS TotalReceiptCount
        FROM dbo.PurchaseOrder po
        LEFT JOIN dbo.PurchaseOrderItem poi2 ON poi2.PurchaseOrderId = po.Id
        LEFT JOIN dbo.ReceiptHistory rh2 ON rh2.PurchaseOrderId = po.Id AND rh2.Type = N'입고'
        LEFT JOIN dbo.PurchaseOrderItem poi_d ON poi_d.PurchaseOrderId = po.Id AND poi_d.ItemCode = rh2.ItemCode
        WHERE po.OrderDate >= @PeriodStart
          AND po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        GROUP BY po.SupplierCode, po.SupplierName
        ORDER BY TotalSpend DESC;
      `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = r.recordsets as any[];
    const kpiRow      = (rs[0]?.[0] ?? {}) as Record<string, number>;
    const rateRow     = (rs[1]?.[0] ?? {}) as Record<string, number>;
    const monthly     = (rs[2] ?? []) as { Month: string; Amount: number }[];
    const suppSpend   = (rs[3] ?? []) as { Name: string; Value: number }[];
    const catSpend    = (rs[4] ?? []) as { Category: string; Amount: number }[];
    const suppTable   = (rs[5] ?? []) as Record<string, unknown>[];

    const totalCat    = catSpend.reduce((s, c) => s + (c.Amount ?? 0), 0);
    const onTime      = Number(rateRow.OnTime ?? 0);
    const totalRcpt   = Number(rateRow.Total  ?? 0);
    const avgDeliveryRate = totalRcpt > 0 ? Math.round((onTime / totalRcpt) * 100) : 0;

    return NextResponse.json({
      ok: true,
      kpis: {
        totalSpend:       Number(kpiRow.TotalSpend      ?? 0),
        activeSuppliers:  Number(kpiRow.ActiveSuppliers ?? 0),
        avgOrderAmount:   Number(kpiRow.AvgOrderAmount  ?? 0),
        avgDeliveryRate,
      },
      monthlySpend: monthly.map((x) => ({ month: x.Month, amount: x.Amount })),
      supplierSpend: suppSpend.map((x) => ({ name: x.Name, value: x.Value })),
      categorySpend: catSpend.map((c) => ({
        category:   c.Category,
        amount:     c.Amount,
        percentage: totalCat > 0 ? Math.round((c.Amount / totalCat) * 100) : 0,
      })),
      supplierTable: suppTable.map((r) => {
        const rcptCnt = Number(r.TotalReceiptCount ?? 0);
        const onTimeCnt = Number(r.OnTimeCount ?? 0);
        return {
          supplierName:  String(r.SupplierName ?? ""),
          totalSpend:    Number(r.TotalSpend   ?? 0),
          orderCount:    Number(r.OrderCount   ?? 0),
          avgUnitPrice:  Number(r.AvgUnitPrice ?? 0),
          deliveryRate:  rcptCnt > 0 ? Math.round((onTimeCnt / rcptCnt) * 100) : 0,
        };
      }),
    });
  } catch (error) {
    console.error("[analytics][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
