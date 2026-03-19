import { purchaseOrderSummaries } from "./purchase-orders";

/** 대시보드 모니터링 기준 연·월 (YYYY-MM). KPI·차트 등 표시 데이터의 기준일. */
export const DASHBOARD_PERIOD = "2024-04";

export const dashboardData = {
  /** 모니터링 기준 연월 (년/월 표시용) */
  periodYearMonth: DASHBOARD_PERIOD,
  kpis: {
    monthlySpend: 428_500_000,
    orderCount: 128,
    pendingReceipt: 17,
    delayedCount: 5,
  },
  monthlySpend: [
    { month: "2023-11", amount: 382_400_000 },
    { month: "2023-12", amount: 395_800_000 },
    { month: "2024-01", amount: 410_200_000 },
    { month: "2024-02", amount: 399_600_000 },
    { month: "2024-03", amount: 421_300_000 },
    { month: "2024-04", amount: 428_500_000 },
  ],
  supplierSpend: [
    { name: "현대금속", value: 138_000_000, percentage: 32 },
    { name: "동아테크", value: 96_500_000, percentage: 23 },
    { name: "KJ Parts", value: 78_200_000, percentage: 18 },
    { name: "대한소재", value: 64_800_000, percentage: 15 },
    { name: "미래정밀", value: 51_000_000, percentage: 12 },
  ],
  recentPOs: purchaseOrderSummaries.slice(0, 5),
  delayedPOs: [
    { poNumber: "PO-240301", supplierName: "현대금속", itemName: "드라이브 샤프트 어셈블리", dueDate: "2024-04-18", delayDays: 3, severity: "medium" },
    { poNumber: "PO-240287", supplierName: "동아테크", itemName: "브레이크 캘리퍼 하우징", dueDate: "2024-04-15", delayDays: 5, severity: "high" },
    { poNumber: "PO-240251", supplierName: "KJ Parts", itemName: "기어 피니언 세트", dueDate: "2024-04-12", delayDays: 2, severity: "low" },
    { poNumber: "PO-240245", supplierName: "미래정밀", itemName: "모터 코어 라미네이션", dueDate: "2024-04-10", delayDays: 4, severity: "medium" },
    { poNumber: "PO-240239", supplierName: "대한소재", itemName: "고장력 스틸 샤프트", dueDate: "2024-04-08", delayDays: 6, severity: "high" },
  ],
  topSuppliers: [
    { name: "현대금속", amount: 138_000_000, share: 32 },
    { name: "동아테크", amount: 96_500_000, share: 23 },
    { name: "KJ Parts", amount: 78_200_000, share: 18 },
  ],
  topItems: [
    { itemName: "드라이브 샤프트 어셈블리", category: "파워트레인", orderCount: 24, amount: 96_800_000 },
    { itemName: "브레이크 캘리퍼 하우징", category: "섀시", orderCount: 18, amount: 72_300_000 },
    { itemName: "기어 피니언 세트", category: "기어/트랜스미션", orderCount: 16, amount: 68_400_000 },
  ],
  pendingActions: [
    { type: "approval", label: "승인 대기 구매오더", count: 6 },
    { type: "issue", label: "발행 필요 초안", count: 4 },
    { type: "receipt", label: "입고 확인 필요", count: 9 },
  ],
};
