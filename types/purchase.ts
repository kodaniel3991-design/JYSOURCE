export type POStatus =
  | "draft"      // 초안
  | "approved"   // 승인
  | "issued"     // 발주
  | "confirmed"  // 확인됨
  | "partial"    // 일부입고
  | "received"   // 입고완료
  | "closed"     // 마감
  | "cancelled"; // 취소

export interface POItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  dueDate: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalAmount: number;
  dueDate: string;
  status: POStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
  notes?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalAmount: number;
  dueDate: string;
  status: POStatus;
  assignedTo: string;
}

export interface CreatePOFormData {
  supplierId: string;
  dueDate: string;
  currency: string;
  assignedTo: string;
  priority: "low" | "normal" | "high" | "urgent";
  items: Omit<POItem, "id" | "amount">[];
  notes?: string;
}

/** 1단계: 구매오더 관리 - 기본 정보 폼 */
export interface POBasicFormData {
  orderStatus: POStatus;
  supplierId: string;
  supplierName: string;
  currencyCode: string;
  paymentType: string;
  paymentTerms: string;
  buyerCode: string;
  buyerName: string;
  supplierQuotationNo: string;
  supplierContactPerson: string;
  advancePayment: string;
  orderDate: string;
  vatRate: string;
  importType: string;
  businessPlace: string;
  packagingStatus: string;
  inspectionCondition: string;
  deliveryCondition: string;
  otherCondition: string;
  notes: string;
}

/** 2단계: 명세작업 - 품목 명세 행 (그리드/입력) */
export interface POSpecItemRow {
  specNo?: string;
  itemCode: string;
  itemName: string;
  material?: string;
  specification?: string;
  warehouse?: string;
  quantity: number;
  receivedQty?: number;
  unitPrice: number;
  amount: number;
  isProvisionalPrice?: boolean;
  dueDate: string;
}
