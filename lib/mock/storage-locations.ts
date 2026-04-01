export interface StorageLocationRecord {
  WarehouseCode: string;
  StorageLocationCode: string;
  StorageLocationName: string;
}

export const storageLocations: StorageLocationRecord[] = [
  // 창고 10: 원부자재창고
  { WarehouseCode: "10", StorageLocationCode: "001",   StorageLocationName: "원부자재" },
  { WarehouseCode: "10", StorageLocationCode: "B0014", StorageLocationName: "동성기업" },
  { WarehouseCode: "10", StorageLocationCode: "B0015", StorageLocationName: "동원소텍" },
  { WarehouseCode: "10", StorageLocationCode: "B0017", StorageLocationName: "리노팩" },
  { WarehouseCode: "10", StorageLocationCode: "B0035", StorageLocationName: "(주)영테크" },
  { WarehouseCode: "10", StorageLocationCode: "B0041", StorageLocationName: "(주)일승산업" },
  { WarehouseCode: "10", StorageLocationCode: "B0044", StorageLocationName: "제일전자" },
  { WarehouseCode: "10", StorageLocationCode: "B0046", StorageLocationName: "(주)기거원인텍" },
  // 창고 20: 제품재고
  { WarehouseCode: "20", StorageLocationCode: "001",   StorageLocationName: "제품" },
  // 창고 30: 상품재고
  { WarehouseCode: "30", StorageLocationCode: "001",   StorageLocationName: "상품" },
  // 창고 40: RSM(IN-LINE)
  { WarehouseCode: "40", StorageLocationCode: "001",   StorageLocationName: "RSM(IN-LINE)" },
  // 창고 90: 반품창고
  { WarehouseCode: "90", StorageLocationCode: "001",   StorageLocationName: "반품" },
];
