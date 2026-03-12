export interface PurchasePriceRecord {
  id: string;
  itemCode: string;
  itemName: string;
  itemSpec: string;
  supplierName: string;
  plant: string;
  applyDate: string;
  expireDate: string;
  unitPrice: number;
  devUnitPrice: number;
  discountRate: number;
  currency: string;
  remarks: string;
}

