import type {
  MonthlySpend,
  SupplierSpend,
  CategorySpend,
  SupplierAnalyticsRow,
  AnalyticsKPIs,
} from "@/types/analytics";

export const analyticsData = {
  kpis: {
    totalSpend: 1042000000,
    activeSuppliers: 6,
    avgDeliveryRate: 87.5,
    avgOrderAmount: 43500000,
  } as AnalyticsKPIs,
  monthlySpend: [
    { month: "2023-09", amount: 68500000 },
    { month: "2023-10", amount: 72000000 },
    { month: "2023-11", amount: 81500000 },
    { month: "2023-12", amount: 89200000 },
    { month: "2024-01", amount: 76800000 },
    { month: "2024-02", amount: 83400000 },
    { month: "2024-03", amount: 87650000 },
  ] as MonthlySpend[],
  supplierSpend: [
    { supplierName: "독일오토파츠", amount: 312000000 },
    { supplierName: "한국정밀기어", amount: 245000000 },
    { supplierName: "일본스틸코리아", amount: 189000000 },
    { supplierName: "현대캐스팅", amount: 156000000 },
    { supplierName: "대우베어링", amount: 92000000 },
    { supplierName: "중국동력전자", amount: 67000000 },
  ] as SupplierSpend[],
  categorySpend: [
    { category: "기어/트랜스미션", amount: 320000000, percentage: 31 },
    { category: "베어링/축류", amount: 180000000, percentage: 17 },
    { category: "캐스팅/주조", amount: 250000000, percentage: 24 },
    { category: "전자/모터", amount: 150000000, percentage: 14 },
    { category: "기타 부품", amount: 142000000, percentage: 14 },
  ] as CategorySpend[],
  supplierTable: [
    { supplierName: "독일오토파츠", totalSpend: 312000000, deliveryRate: 96, orderCount: 12, avgUnitPrice: 185000 },
    { supplierName: "한국정밀기어", totalSpend: 245000000, deliveryRate: 88, orderCount: 18, avgUnitPrice: 72000 },
    { supplierName: "일본스틸코리아", totalSpend: 189000000, deliveryRate: 92, orderCount: 14, avgUnitPrice: 95000 },
    { supplierName: "현대캐스팅", totalSpend: 156000000, deliveryRate: 82, orderCount: 10, avgUnitPrice: 89000 },
    { supplierName: "대우베어링", totalSpend: 92000000, deliveryRate: 80, orderCount: 8, avgUnitPrice: 42000 },
    { supplierName: "중국동력전자", totalSpend: 67000000, deliveryRate: 75, orderCount: 6, avgUnitPrice: 18500 },
  ] as SupplierAnalyticsRow[],
};
