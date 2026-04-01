import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import { getSessionFactory } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const factory = await getSessionFactory(request);
    const pool = await getDbPool();

    const r = await pool.request()
      .input("BusinessPlace", sql.NVarChar(20), factory)
      .query(`
        DECLARE @Today   DATE = CAST(GETDATE() AS DATE);
        DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
        DECLARE @SixMonthsAgo DATE = DATEFROMPARTS(YEAR(DATEADD(MONTH,-5,@Today)), MONTH(DATEADD(MONTH,-5,@Today)), 1);

        -- 1) KPI
        SELECT
          ISNULL(SUM(CASE WHEN OrderDate >= @MonthStart THEN TotalAmount ELSE 0 END), 0)          AS MonthlySpend,
          COUNT(CASE WHEN OrderDate >= @MonthStart THEN 1 END)                                    AS OrderCount,
          COUNT(CASE WHEN OrderStatus IN ('issued','confirmed','partial') THEN 1 END)             AS PendingReceipt,
          COUNT(CASE WHEN OrderStatus IN ('draft') THEN 1 END)                                    AS DraftCount,
          COUNT(CASE WHEN OrderStatus IN ('issued','partial') THEN 1 END)                         AS ReceiptCount
        FROM dbo.PurchaseOrder
        WHERE OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace);

        -- 2) 납기 지연 건수 (DueDate 지난 미입고 품목 보유 오더)
        SELECT COUNT(DISTINCT po.Id) AS DelayedCount
        FROM dbo.PurchaseOrder po
        JOIN dbo.PurchaseOrderItem poi ON poi.PurchaseOrderId = po.Id
        WHERE poi.DueDate < @Today
          AND po.OrderStatus NOT IN ('received','closed','cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace);

        -- 3) 월별 지출 (최근 6개월)
        SELECT FORMAT(OrderDate,'yyyy-MM') AS Month, SUM(TotalAmount) AS Amount
        FROM dbo.PurchaseOrder
        WHERE OrderDate >= @SixMonthsAgo
          AND OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
        GROUP BY FORMAT(OrderDate,'yyyy-MM')
        ORDER BY Month;

        -- 4) 공급사별 지출 TOP 5 (당월)
        SELECT TOP 5 SupplierName AS Name, SUM(TotalAmount) AS Value
        FROM dbo.PurchaseOrder
        WHERE OrderDate >= @MonthStart
          AND OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
        GROUP BY SupplierName
        ORDER BY Value DESC;

        -- 5) 최근 PO 5건
        SELECT TOP 5
          po.Id,
          po.PoNumber,
          po.OrderStatus,
          po.SupplierCode,
          po.SupplierName,
          CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
          po.TotalAmount
        FROM dbo.PurchaseOrder po
        WHERE (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        ORDER BY po.CreatedAt DESC;

        -- 6) 납기 지연 PO (DueDate 지난 미입고, 최대 10건)
        SELECT TOP 10
          po.PoNumber,
          po.SupplierName,
          poi.ItemName,
          CONVERT(NVARCHAR(10), poi.DueDate, 23) AS DueDate,
          DATEDIFF(DAY, poi.DueDate, @Today) AS DelayDays
        FROM dbo.PurchaseOrder po
        JOIN dbo.PurchaseOrderItem poi ON poi.PurchaseOrderId = po.Id
        WHERE poi.DueDate < @Today
          AND po.OrderStatus NOT IN ('received','closed','cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        ORDER BY DelayDays DESC;

        -- 7) 공급사별 누적 지출 TOP 3
        SELECT TOP 3 SupplierName AS Name, SUM(TotalAmount) AS Amount
        FROM dbo.PurchaseOrder
        WHERE OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR BusinessPlace = @BusinessPlace)
        GROUP BY SupplierName
        ORDER BY Amount DESC;

        -- 8) 품목별 발주 TOP 3
        SELECT TOP 3
          poi.ItemName,
          COUNT(DISTINCT poi.PurchaseOrderId) AS OrderCount,
          SUM(poi.Amount) AS Amount
        FROM dbo.PurchaseOrderItem poi
        JOIN dbo.PurchaseOrder po ON po.Id = poi.PurchaseOrderId
        WHERE po.OrderStatus NOT IN ('cancelled')
          AND (@BusinessPlace IS NULL OR po.BusinessPlace = @BusinessPlace)
        GROUP BY poi.ItemName
        ORDER BY Amount DESC;
      `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = r.recordsets as any[];
    const kpiRow    = rs[0]?.[0] as Record<string, number> ?? {};
    const delayRow  = rs[1]?.[0] as Record<string, number> ?? {};
    const monthly   = (rs[2] ?? []) as { Month: string; Amount: number }[];
    const suppSpend = (rs[3] ?? []) as { Name: string; Value: number }[];
    const recentRaw = (rs[4] ?? []) as Record<string, unknown>[];
    const delayedRaw= (rs[5] ?? []) as Record<string, unknown>[];
    const topSup    = (rs[6] ?? []) as { Name: string; Amount: number }[];
    const topItems  = (rs[7] ?? []) as { ItemName: string; OrderCount: number; Amount: number }[];

    const today = new Date();
    const periodYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // 공급사별 비중 계산
    const totalSupplierSpend = suppSpend.reduce((s, x) => s + (x.Value ?? 0), 0);
    const supplierSpend = suppSpend.map((x) => ({
      name: x.Name,
      value: x.Value,
      percentage: totalSupplierSpend > 0 ? Math.round((x.Value / totalSupplierSpend) * 100) : 0,
    }));

    // recentPOs 형태 변환
    const recentPOs = recentRaw.map((r) => ({
      id:           String(r.Id),
      poNumber:     String(r.PoNumber ?? ""),
      status:       String(r.OrderStatus ?? "draft"),
      orderStatus:  String(r.OrderStatus ?? "draft"),
      supplierId:   String(r.SupplierCode ?? ""),
      supplierName: String(r.SupplierName ?? ""),
      orderDate:    String(r.OrderDate ?? ""),
      totalAmount:  Number(r.TotalAmount ?? 0),
    }));

    // 납기 지연 PO 변환 (severity 판단)
    const delayedPOs = delayedRaw.map((r) => {
      const days = Number(r.DelayDays ?? 0);
      const severity = days >= 7 ? "high" : days >= 3 ? "medium" : "low";
      return {
        poNumber:     String(r.PoNumber ?? ""),
        supplierName: String(r.SupplierName ?? ""),
        itemName:     String(r.ItemName ?? ""),
        dueDate:      String(r.DueDate ?? ""),
        delayDays:    days,
        severity,
      };
    });

    return NextResponse.json({
      ok: true,
      periodYearMonth,
      kpis: {
        monthlySpend:   Number(kpiRow.MonthlySpend  ?? 0),
        orderCount:     Number(kpiRow.OrderCount    ?? 0),
        pendingReceipt: Number(kpiRow.PendingReceipt?? 0),
        delayedCount:   Number(delayRow.DelayedCount ?? 0),
      },
      monthlySpend: monthly.map((x) => ({ month: x.Month, amount: x.Amount })),
      supplierSpend,
      recentPOs,
      delayedPOs,
      topSuppliers: topSup.map((x) => ({ name: x.Name, amount: x.Amount, share: 0 })),
      topItems: topItems.map((x) => ({ itemName: x.ItemName, category: "", orderCount: x.OrderCount, amount: x.Amount })),
      pendingActions: [
        { type: "issue",   label: "발행 필요 초안",   count: Number(kpiRow.DraftCount   ?? 0) },
        { type: "receipt", label: "입고 확인 필요",   count: Number(kpiRow.ReceiptCount ?? 0) },
      ],
    });
  } catch (error) {
    console.error("[dashboard][GET]", error);
    return NextResponse.json({ ok: false, message: "조회 실패" }, { status: 500 });
  }
}
