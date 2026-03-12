export type SupplierStatus = "active" | "inactive" | "pending" | "blocked";

export type SupplierGrade = "A" | "B" | "C" | "D" | "S";

export interface Supplier {
  id: string;
  name: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  totalSpend: number;
  grade: SupplierGrade;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDetail extends Supplier {
  recentOrders?: { poNumber: string; amount: number; date: string }[];
  suppliedItems?: { itemCode: string; itemName: string; lastOrderDate: string }[];
  evaluation?: {
    quality: number;
    delivery: number;
    price: number;
    overall: number;
  };
}
