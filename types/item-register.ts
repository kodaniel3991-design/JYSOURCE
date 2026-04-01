/** 품목 등록 폼 상태 (local state, 백엔드 없음) */

export interface ItemRegisterBasicInfo {
  copyFromItemNo: string;
  itemNo: string;
  itemName: string;
  itemStatusCategory: string;
  itemForm: string;
  itemFormName: string;
  itemType: string;
  itemTypeName: string;
  productModel: string;
  productModelName: string;
  stockUnit: string;
  salesUnit: string;
  supplierId: string;
  supplierName: string;
  currencyCode: string;
  purchaseUnitPrice: string;
  warehouse: string;
  warehouseName: string;
  storageLocation: string;
  storageLocationName: string;
  plant: string;
  plantName: string;
}

export interface ItemRegisterClassification {
  specification: string;
  drawingNo: string;
  jitFlag: boolean;
  exportFlag: boolean;
  itemUserCategoryCode: string;
  commerceProductId: string;
  valueCategory: string;
  itemUsageClassificationCode: string;
  material: string;
  manufacturer: string;
  importFlag: boolean;
}

export interface ItemRegisterProcurement {
  supplierItemNo: string;
  purchaseManager: string;
  salesManager: string;
  requirementManager: string;
  salesUnitPrice: string;
  orderPolicy: string;
  lastReceiptUnitPrice: string;
  standardCost: string;
  internalPrice: string;
  processor: string;
}

export interface ItemRegisterInventory {
  unitProductionQty: string;
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
  itemForm: "",
  itemFormName: "",
  itemType: "",
  itemTypeName: "",
  productModel: "",
  productModelName: "",
  stockUnit: "EA",
  salesUnit: "EA",
  supplierId: "",
  supplierName: "",
  currencyCode: "KRW",
  purchaseUnitPrice: "",
  warehouse: "",
  warehouseName: "",
  storageLocation: "",
  storageLocationName: "",
  plant: "",
  plantName: "",
};

export const defaultClassification: ItemRegisterClassification = {
  specification: "",
  drawingNo: "",
  jitFlag: false,
  exportFlag: false,
  itemUserCategoryCode: "",
  commerceProductId: "",
  valueCategory: "",
  itemUsageClassificationCode: "",
  material: "",
  manufacturer: "",
  importFlag: false,
};

export const defaultProcurement: ItemRegisterProcurement = {
  supplierItemNo: "",
  purchaseManager: "",
  salesManager: "",
  requirementManager: "",
  salesUnitPrice: "",
  orderPolicy: "",
  lastReceiptUnitPrice: "",
  standardCost: "",
  internalPrice: "",
  processor: "",
};

export const defaultInventory: ItemRegisterInventory = {
  unitProductionQty: "",
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
