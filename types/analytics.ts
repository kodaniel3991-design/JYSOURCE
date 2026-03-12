export interface MonthlySpend {
  month: string;
  amount: number;
  orderCount: number;
}

export interface SupplierSpend {
  supplierName: string;
  amount: number;
  percentage: number;
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

export interface SupplierAnalyticsRow {
  supplierName: string;
  totalSpend: number;
  deliveryRate: number;
  orderCount: number;
  avgUnitPrice: number;
}

export interface AnalyticsKPIs {
  totalSpend: number;
  activeSuppliers: number;
  avgDeliveryRate: number;
  avgOrderAmount: number;
}
