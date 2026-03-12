/** 품목 등록 폼 상태 (local state, 백엔드 없음) */

export interface ItemRegisterBasicInfo {
  copyFromItemNo: string;
  itemNo: string;
  itemName: string;
  itemStatusCategory: string;
  specification: string;
  drawingNo: string;
}

export interface ItemRegisterClassification {
  itemForm: string;
  itemType: string;
  jitFlag: boolean;
  exportFlag: boolean;
  productModel: string;
  itemUserCategoryCode: string;
  commerceProductId: string;
  valueCategory: string;
  itemUsageClassificationCode: string;
  material: string;
  manufacturer: string;
  importFlag: boolean;
}

export interface ItemRegisterProcurement {
  supplierId: string;
  supplierItemNo: string;
  purchaseManager: string;
  salesManager: string;
  requirementManager: string;
  purchaseUnitPrice: string;
  salesUnitPrice: string;
  currencyCode: string;
  orderPolicy: string;
  lastReceiptUnitPrice: string;
  standardCost: string;
  internalPrice: string;
  businessUnit: string;
  processor: string;
}

export interface ItemRegisterInventory {
  unitProductionQty: string;
  warehouse: string;
  storageLocation: string;
  orderInterval: string;
  minLot: string;
  standardLot: string;
  safetyStock: string;
  defectRate: string;
  receiptToShipImmediate: boolean;
  shipWarehouse: string;
  shipStorageLocation: string;
  minLotRight: string;
  leadTimeDays: string;
  reorderPoint: string;
  cycleCountPeriod: string;
  shipWarehouseAlt: string;
  shipStorageLocationAlt: string;
  deliveryContainer: string;
}

export interface ItemRegisterTechnical {
  drawingSize: string;
  weightKg: string;
  salesUnit: string;
  salesUnitConversion: string;
  quantity: string;
  customerSpec: string;
  hNo: string;
  lNo: string;
  packQty: string;
  deliveryContainer: string;
  shipWarehouse: string;
  shipStorageLocation: string;
  warrantyPeriod: string;
  imageFiles: File[];
  drawingFiles: File[];
}

export interface ItemRegisterContacts {
  purchaseManager: string;
  salesManager: string;
  requirementManager: string;
  businessUnit: string;
  warehouse: string;
  processor: string;
  manufacturer: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  internalNote: string;
}

export interface ItemRegisterState {
  basicInfo: ItemRegisterBasicInfo;
  classification: ItemRegisterClassification;
  procurement: ItemRegisterProcurement;
  inventory: ItemRegisterInventory;
  technical: ItemRegisterTechnical;
  contacts: ItemRegisterContacts;
}

export const defaultBasicInfo: ItemRegisterBasicInfo = {
  copyFromItemNo: "",
  itemNo: "",
  itemName: "",
  itemStatusCategory: "ACTIVE",
  specification: "",
  drawingNo: "",
};

export const defaultClassification: ItemRegisterClassification = {
  itemForm: "",
  itemType: "",
  jitFlag: false,
  exportFlag: false,
  productModel: "",
  itemUserCategoryCode: "",
  commerceProductId: "",
  valueCategory: "",
  itemUsageClassificationCode: "",
  material: "",
  manufacturer: "",
  importFlag: false,
};

export const defaultProcurement: ItemRegisterProcurement = {
  supplierId: "",
  supplierItemNo: "",
  purchaseManager: "",
  salesManager: "",
  requirementManager: "",
  purchaseUnitPrice: "",
  salesUnitPrice: "",
  currencyCode: "KRW",
  orderPolicy: "",
  lastReceiptUnitPrice: "",
  standardCost: "",
  internalPrice: "",
  businessUnit: "",
  processor: "",
};

export const defaultInventory: ItemRegisterInventory = {
  unitProductionQty: "",
  warehouse: "",
  storageLocation: "",
  orderInterval: "",
  minLot: "",
  standardLot: "",
  safetyStock: "",
  defectRate: "",
  receiptToShipImmediate: false,
  shipWarehouse: "",
  shipStorageLocation: "",
  minLotRight: "",
  leadTimeDays: "",
  reorderPoint: "",
  cycleCountPeriod: "",
  shipWarehouseAlt: "",
  shipStorageLocationAlt: "",
  deliveryContainer: "",
};

export const defaultTechnical: ItemRegisterTechnical = {
  drawingSize: "",
  weightKg: "",
  salesUnit: "EA",
  salesUnitConversion: "1",
  quantity: "",
  customerSpec: "",
  hNo: "",
  lNo: "",
  packQty: "",
  deliveryContainer: "",
  shipWarehouse: "",
  shipStorageLocation: "",
  warrantyPeriod: "",
  imageFiles: [],
  drawingFiles: [],
};

export const defaultContacts: ItemRegisterContacts = {
  purchaseManager: "",
  salesManager: "",
  requirementManager: "",
  businessUnit: "",
  warehouse: "",
  processor: "",
  manufacturer: "",
  lastModifiedBy: "",
  lastModifiedAt: "",
  internalNote: "",
};

export const defaultItemRegisterState: ItemRegisterState = {
  basicInfo: defaultBasicInfo,
  classification: defaultClassification,
  procurement: defaultProcurement,
  inventory: defaultInventory,
  technical: defaultTechnical,
  contacts: defaultContacts,
};
