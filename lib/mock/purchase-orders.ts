import type {
  PurchaseOrder,
  PurchaseOrderSummary,
  POItem,
  POStatus,
} from "@/types/purchase";

const sampleItems: POItem[][] = [
  [
    { id: "item-1", itemCode: "GP-3012", itemName: "기어 피니언 세트", quantity: 100, unitPrice: 85000, amount: 8500000, dueDate: "2024-04-15" },
    { id: "item-2", itemCode: "BR-2041", itemName: "베어링 하우징", quantity: 200, unitPrice: 32000, amount: 6400000, dueDate: "2024-04-20" },
  ],
  [
    { id: "item-3", itemCode: "ST-5501", itemName: "고장력 스틸 샤프트", quantity: 50, unitPrice: 125000, amount: 6250000, dueDate: "2024-04-25" },
  ],
  [
    { id: "item-4", itemCode: "BR-2042", itemName: "볼 베어링 6205", quantity: 500, unitPrice: 8500, amount: 4250000, dueDate: "2024-04-18" },
    { id: "item-5", itemCode: "BR-2043", itemName: "실린더 베어링", quantity: 80, unitPrice: 45000, amount: 3600000, dueDate: "2024-04-22" },
  ],
  [
    { id: "item-6", itemCode: "AP-8801", itemName: "터보차저 블레이드", quantity: 30, unitPrice: 280000, amount: 8400000, dueDate: "2024-05-01" },
    { id: "item-7", itemCode: "AP-8802", itemName: "ECU 커넥터", quantity: 150, unitPrice: 12000, amount: 1800000, dueDate: "2024-05-05" },
  ],
  [
    { id: "item-8", itemCode: "MC-1101", itemName: "모터 코어 라미네이션", quantity: 200, unitPrice: 18500, amount: 3700000, dueDate: "2024-04-28" },
  ],
  [
    { id: "item-9", itemCode: "CS-7001", itemName: "알루미늄 캐스팅 블록", quantity: 40, unitPrice: 195000, amount: 7800000, dueDate: "2024-04-30" },
    { id: "item-10", itemCode: "CS-7002", itemName: "브레이크 캘리퍼 하우징", quantity: 120, unitPrice: 42000, amount: 5040000, dueDate: "2024-05-02" },
  ],
  // 2026년 신규 아이템
  [
    { id: "item-20", itemCode: "HY-1001", itemName: "수소연료전지 스택", quantity: 20, unitPrice: 450000, amount: 9000000, dueDate: "2026-04-10" },
    { id: "item-21", itemCode: "HY-1002", itemName: "수소탱크 밸브", quantity: 60, unitPrice: 85000, amount: 5100000, dueDate: "2026-04-15" },
  ],
  [
    { id: "item-22", itemCode: "EV-2001", itemName: "배터리 모듈 BMS", quantity: 50, unitPrice: 320000, amount: 16000000, dueDate: "2026-03-28" },
    { id: "item-23", itemCode: "EV-2002", itemName: "구동 인버터", quantity: 30, unitPrice: 580000, amount: 17400000, dueDate: "2026-03-30" },
  ],
  [
    { id: "item-24", itemCode: "EV-2003", itemName: "전기모터 스테이터", quantity: 40, unitPrice: 210000, amount: 8400000, dueDate: "2026-04-05" },
  ],
  [
    { id: "item-25", itemCode: "SE-3001", itemName: "레이더 센서 모듈", quantity: 25, unitPrice: 620000, amount: 15500000, dueDate: "2026-04-20" },
    { id: "item-26", itemCode: "SE-3002", itemName: "라이다 유닛", quantity: 10, unitPrice: 1200000, amount: 12000000, dueDate: "2026-04-25" },
  ],
  [
    { id: "item-27", itemCode: "PR-4001", itemName: "탄소섬유 프레임", quantity: 15, unitPrice: 890000, amount: 13350000, dueDate: "2026-05-01" },
    { id: "item-28", itemCode: "PR-4002", itemName: "알루미늄 서브프레임", quantity: 30, unitPrice: 145000, amount: 4350000, dueDate: "2026-05-05" },
  ],
  [
    { id: "item-29", itemCode: "HY-1003", itemName: "수소 압력조절기", quantity: 45, unitPrice: 95000, amount: 4275000, dueDate: "2026-03-20" },
  ],
  [
    { id: "item-30", itemCode: "SE-3003", itemName: "카메라 인식 모듈", quantity: 80, unitPrice: 75000, amount: 6000000, dueDate: "2026-03-25" },
    { id: "item-31", itemCode: "SE-3004", itemName: "ECU 통합 제어기", quantity: 35, unitPrice: 230000, amount: 8050000, dueDate: "2026-03-27" },
  ],
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po-001", poNumber: "PO-2024-0012", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 14900000, dueDate: "2024-04-20", status: "issued", assignedTo: "김구매", createdAt: "2024-03-01T09:00:00", updatedAt: "2024-03-05T14:30:00", currency: "KRW", notes: "1차 납품 우선", priority: "high" },
  { id: "po-002", poNumber: "PO-2024-0011", supplierId: "sup-002", supplierName: "일본스틸코리아", items: sampleItems[1], totalAmount: 6250000, dueDate: "2024-04-25", status: "approved", assignedTo: "이발주", createdAt: "2024-02-28T11:00:00", updatedAt: "2024-03-02T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-003", poNumber: "PO-2024-0010", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[2], totalAmount: 7850000, dueDate: "2024-04-18", status: "partial_receipt", assignedTo: "박담당", createdAt: "2024-02-25T08:30:00", updatedAt: "2024-03-08T16:00:00", currency: "KRW", priority: "normal" },
  { id: "po-004", poNumber: "PO-2024-0009", supplierId: "sup-004", supplierName: "독일오토파츠", items: sampleItems[3], totalAmount: 10200000, dueDate: "2024-04-05", status: "closed", assignedTo: "김구매", createdAt: "2024-02-20T14:00:00", updatedAt: "2024-04-03T09:00:00", currency: "KRW", priority: "urgent" },
  { id: "po-005", poNumber: "PO-2024-0008", supplierId: "sup-004", supplierName: "독일오토파츠", items: sampleItems[4], totalAmount: 10200000, dueDate: "2024-04-12", status: "issued", assignedTo: "이발주", createdAt: "2024-02-18T10:00:00", updatedAt: "2024-02-22T11:00:00", currency: "KRW", priority: "high" },
  { id: "po-006", poNumber: "PO-2024-0007", supplierId: "sup-005", supplierName: "중국동력전자", items: sampleItems[5], totalAmount: 3700000, dueDate: "2024-04-28", status: "draft", assignedTo: "박담당", createdAt: "2024-03-05T15:00:00", updatedAt: "2024-03-05T15:00:00", currency: "KRW", priority: "low" },
  { id: "po-007", poNumber: "PO-2024-0006", supplierId: "sup-006", supplierName: "현대캐스팅", items: sampleItems[6 - 1], totalAmount: 12840000, dueDate: "2024-03-28", status: "partial_receipt", assignedTo: "김구매", createdAt: "2024-02-15T09:00:00", updatedAt: "2024-03-10T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-008", poNumber: "PO-2024-0005", supplierId: "sup-001", supplierName: "한국정밀기어", items: [{ id: "item-11", itemCode: "GP-3013", itemName: "디퍼렌셜 기어", quantity: 60, unitPrice: 92000, amount: 5520000, dueDate: "2024-04-10" }], totalAmount: 5520000, dueDate: "2024-04-10", status: "closed", assignedTo: "이발주", createdAt: "2024-02-10T11:00:00", updatedAt: "2024-04-08T14:00:00", currency: "KRW", priority: "normal" },
  { id: "po-009", poNumber: "PO-2024-0004", supplierId: "sup-002", supplierName: "일본스틸코리아", items: [{ id: "item-12", itemCode: "ST-5502", itemName: "드라이브 샤프트", quantity: 45, unitPrice: 98000, amount: 4410000, dueDate: "2024-03-25" }], totalAmount: 4410000, dueDate: "2024-03-25", status: "closed", assignedTo: "박담당", createdAt: "2024-02-05T08:00:00", updatedAt: "2024-03-26T09:00:00", currency: "KRW", priority: "normal" },
  { id: "po-010", poNumber: "PO-2024-0003", supplierId: "sup-006", supplierName: "현대캐스팅", items: [{ id: "item-13", itemCode: "CS-7003", itemName: "엔진 마운트 브라켓", quantity: 80, unitPrice: 35000, amount: 2800000, dueDate: "2024-04-08" }], totalAmount: 2800000, dueDate: "2024-04-08", status: "issued", assignedTo: "김구매", createdAt: "2024-02-01T14:00:00", updatedAt: "2024-02-28T10:00:00", currency: "KRW", priority: "high" },
  { id: "po-011", poNumber: "PO-2024-0002", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[2], totalAmount: 8250000, dueDate: "2024-04-02", status: "approved", assignedTo: "박담당", createdAt: "2024-01-28T09:30:00", updatedAt: "2024-02-10T11:15:00", currency: "KRW", priority: "normal" },
  { id: "po-012", poNumber: "PO-2024-0001", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 14900000, dueDate: "2024-03-30", status: "draft", assignedTo: "김구매", createdAt: "2024-01-20T10:00:00", updatedAt: "2024-01-20T10:00:00", currency: "KRW", priority: "low" },
  { id: "po-013", poNumber: "PO-2023-0015", supplierId: "sup-004", supplierName: "독일오토파츠", items: sampleItems[3], totalAmount: 9800000, dueDate: "2023-12-28", status: "closed", assignedTo: "이발주", createdAt: "2023-12-01T09:00:00", updatedAt: "2023-12-29T14:00:00", currency: "KRW", priority: "normal" },
  { id: "po-014", poNumber: "PO-2023-0014", supplierId: "sup-005", supplierName: "중국동력전자", items: sampleItems[5], totalAmount: 4200000, dueDate: "2023-11-30", status: "closed", assignedTo: "박담당", createdAt: "2023-11-10T10:30:00", updatedAt: "2023-12-01T09:20:00", currency: "KRW", priority: "low" },
  { id: "po-015", poNumber: "PO-2023-0013", supplierId: "sup-006", supplierName: "현대캐스팅", items: sampleItems[5], totalAmount: 11240000, dueDate: "2023-10-25", status: "closed", assignedTo: "김구매", createdAt: "2023-10-01T08:45:00", updatedAt: "2023-10-26T13:10:00", currency: "KRW", priority: "normal" },
  { id: "po-016", poNumber: "AR2-2024-0001", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 7_500_000, dueDate: "2024-03-10", status: "closed", assignedTo: "김구매", createdAt: "2024-01-05T09:00:00", updatedAt: "2024-03-11T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-017", poNumber: "AR2-2024-0002", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[1], totalAmount: 9_200_000, dueDate: "2024-03-18", status: "closed", assignedTo: "이발주", createdAt: "2024-01-10T09:00:00", updatedAt: "2024-03-19T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-018", poNumber: "LJL-2024-0003", supplierId: "sup-002", supplierName: "일본스틸코리아", items: sampleItems[2], totalAmount: 6_800_000, dueDate: "2024-03-12", status: "closed", assignedTo: "박담당", createdAt: "2024-01-08T11:00:00", updatedAt: "2024-03-13T09:00:00", currency: "KRW", priority: "high" },
  { id: "po-019", poNumber: "LJL-2024-0004", supplierId: "sup-002", supplierName: "일본스틸코리아", items: sampleItems[3], totalAmount: 8_400_000, dueDate: "2024-03-20", status: "closed", assignedTo: "김구매", createdAt: "2024-01-15T14:00:00", updatedAt: "2024-03-21T09:30:00", currency: "KRW", priority: "normal" },
  { id: "po-020", poNumber: "P32-2024-0005", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[4], totalAmount: 5_600_000, dueDate: "2024-03-25", status: "closed", assignedTo: "이발주", createdAt: "2024-01-18T10:30:00", updatedAt: "2024-03-26T08:45:00", currency: "KRW", priority: "normal" },
  { id: "po-021", poNumber: "P32-2024-0006", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[5], totalAmount: 9_900_000, dueDate: "2024-03-28", status: "closed", assignedTo: "박담당", createdAt: "2024-01-22T09:15:00", updatedAt: "2024-03-29T11:20:00", currency: "KRW", priority: "high" },

  // ── 2025년 데이터 ──
  { id: "po-022", poNumber: "PO-2025-0001", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 16_200_000, dueDate: "2025-02-15", status: "closed", assignedTo: "김구매", createdAt: "2025-01-05T09:00:00", updatedAt: "2025-02-16T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-023", poNumber: "PO-2025-0002", supplierId: "sup-002", supplierName: "일본스틸코리아", items: sampleItems[1], totalAmount: 7_500_000, dueDate: "2025-03-10", status: "closed", assignedTo: "이발주", createdAt: "2025-01-15T10:00:00", updatedAt: "2025-03-11T09:00:00", currency: "KRW", priority: "normal" },
  { id: "po-024", poNumber: "PO-2025-0003", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[2], totalAmount: 9_100_000, dueDate: "2025-04-05", status: "closed", assignedTo: "박담당", createdAt: "2025-02-01T08:30:00", updatedAt: "2025-04-06T11:00:00", currency: "KRW", priority: "high" },
  { id: "po-025", poNumber: "PO-2025-0004", supplierId: "sup-004", supplierName: "독일오토파츠", items: sampleItems[3], totalAmount: 11_500_000, dueDate: "2025-05-20", status: "closed", assignedTo: "김구매", createdAt: "2025-03-10T14:00:00", updatedAt: "2025-05-21T09:00:00", currency: "KRW", priority: "urgent" },
  { id: "po-026", poNumber: "PO-2025-0005", supplierId: "sup-005", supplierName: "중국동력전자", items: sampleItems[4], totalAmount: 4_800_000, dueDate: "2025-06-15", status: "closed", assignedTo: "이발주", createdAt: "2025-04-20T09:00:00", updatedAt: "2025-06-16T10:30:00", currency: "KRW", priority: "normal" },
  { id: "po-027", poNumber: "PO-2025-0006", supplierId: "sup-006", supplierName: "현대캐스팅", items: sampleItems[5], totalAmount: 14_300_000, dueDate: "2025-07-10", status: "closed", assignedTo: "박담당", createdAt: "2025-05-15T11:00:00", updatedAt: "2025-07-11T09:00:00", currency: "KRW", priority: "normal" },
  { id: "po-028", poNumber: "PO-2025-0007", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 18_700_000, dueDate: "2025-08-25", status: "closed", assignedTo: "김구매", createdAt: "2025-06-20T09:00:00", updatedAt: "2025-08-26T14:00:00", currency: "KRW", priority: "high" },
  { id: "po-029", poNumber: "PO-2025-0008", supplierId: "sup-002", supplierName: "일본스틸코리아", items: sampleItems[1], totalAmount: 8_900_000, dueDate: "2025-09-12", status: "closed", assignedTo: "이발주", createdAt: "2025-07-25T10:00:00", updatedAt: "2025-09-13T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-030", poNumber: "PO-2025-0009", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[2], totalAmount: 10_200_000, dueDate: "2025-10-08", status: "closed", assignedTo: "박담당", createdAt: "2025-08-10T08:30:00", updatedAt: "2025-10-09T09:00:00", currency: "KRW", priority: "normal" },
  { id: "po-031", poNumber: "PO-2025-0010", supplierId: "sup-004", supplierName: "독일오토파츠", items: sampleItems[3], totalAmount: 13_600_000, dueDate: "2025-11-15", status: "closed", assignedTo: "김구매", createdAt: "2025-09-20T14:00:00", updatedAt: "2025-11-16T10:00:00", currency: "KRW", priority: "high" },
  { id: "po-032", poNumber: "PO-2025-0011", supplierId: "sup-005", supplierName: "중국동력전자", items: sampleItems[4], totalAmount: 5_400_000, dueDate: "2025-12-10", status: "closed", assignedTo: "이발주", createdAt: "2025-10-15T09:00:00", updatedAt: "2025-12-11T09:30:00", currency: "KRW", priority: "low" },
  { id: "po-033", poNumber: "PO-2025-0012", supplierId: "sup-006", supplierName: "현대캐스팅", items: sampleItems[5], totalAmount: 16_800_000, dueDate: "2025-12-28", status: "closed", assignedTo: "박담당", createdAt: "2025-11-01T11:00:00", updatedAt: "2025-12-29T11:00:00", currency: "KRW", priority: "normal" },

  // ── 2026년 데이터 (현재 진행 중) ──
  { id: "po-034", poNumber: "PO-2026-0001", supplierId: "sup-007", supplierName: "현대수소솔루션", items: sampleItems[6], totalAmount: 14_100_000, dueDate: "2026-04-10", status: "issued", assignedTo: "김구매", createdAt: "2026-02-10T09:00:00", updatedAt: "2026-02-15T14:00:00", currency: "KRW", notes: "수소차 1차 프로젝트", priority: "urgent" },
  { id: "po-035", poNumber: "PO-2026-0002", supplierId: "sup-008", supplierName: "LG에너지솔루션", items: sampleItems[7], totalAmount: 33_400_000, dueDate: "2026-03-30", status: "partial_receipt", assignedTo: "이발주", createdAt: "2026-01-20T10:00:00", updatedAt: "2026-03-10T09:00:00", currency: "KRW", notes: "EV 배터리 모듈 공급", priority: "urgent" },
  { id: "po-036", poNumber: "PO-2026-0003", supplierId: "sup-008", supplierName: "LG에너지솔루션", items: sampleItems[8], totalAmount: 8_400_000, dueDate: "2026-04-05", status: "approved", assignedTo: "박담당", createdAt: "2026-02-01T08:30:00", updatedAt: "2026-02-20T11:00:00", currency: "KRW", priority: "high" },
  { id: "po-037", poNumber: "PO-2026-0004", supplierId: "sup-009", supplierName: "삼성오토모티브", items: sampleItems[9], totalAmount: 27_500_000, dueDate: "2026-04-20", status: "issued", assignedTo: "김구매", createdAt: "2026-02-15T14:00:00", updatedAt: "2026-03-01T09:00:00", currency: "KRW", notes: "자율주행 센서 패키지", priority: "high" },
  { id: "po-038", poNumber: "PO-2026-0005", supplierId: "sup-010", supplierName: "포스코경량소재", items: sampleItems[10], totalAmount: 17_700_000, dueDate: "2026-05-01", status: "approved", assignedTo: "이발주", createdAt: "2026-02-20T11:00:00", updatedAt: "2026-03-05T10:00:00", currency: "KRW", priority: "normal" },
  { id: "po-039", poNumber: "PO-2026-0006", supplierId: "sup-007", supplierName: "현대수소솔루션", items: sampleItems[11], totalAmount: 4_275_000, dueDate: "2026-03-20", status: "partial_receipt", assignedTo: "박담당", createdAt: "2026-01-15T09:00:00", updatedAt: "2026-03-12T14:00:00", currency: "KRW", priority: "high" },
  { id: "po-040", poNumber: "PO-2026-0007", supplierId: "sup-009", supplierName: "삼성오토모티브", items: sampleItems[12], totalAmount: 14_050_000, dueDate: "2026-03-25", status: "issued", assignedTo: "김구매", createdAt: "2026-02-05T10:00:00", updatedAt: "2026-02-28T09:00:00", currency: "KRW", notes: "자율주행 2세대 카메라", priority: "high" },
  { id: "po-041", poNumber: "PO-2026-0008", supplierId: "sup-001", supplierName: "한국정밀기어", items: sampleItems[0], totalAmount: 21_300_000, dueDate: "2026-04-15", status: "draft", assignedTo: "이발주", createdAt: "2026-03-10T09:00:00", updatedAt: "2026-03-10T09:00:00", currency: "KRW", priority: "normal" },
  { id: "po-042", poNumber: "PO-2026-0009", supplierId: "sup-003", supplierName: "대우베어링", items: sampleItems[2], totalAmount: 9_800_000, dueDate: "2026-04-28", status: "draft", assignedTo: "박담당", createdAt: "2026-03-12T11:00:00", updatedAt: "2026-03-12T11:00:00", currency: "KRW", priority: "low" },
  { id: "po-043", poNumber: "PO-2026-0010", supplierId: "sup-005", supplierName: "중국동력전자", items: sampleItems[4], totalAmount: 6_200_000, dueDate: "2026-05-10", status: "approved", assignedTo: "김구매", createdAt: "2026-03-01T14:00:00", updatedAt: "2026-03-14T10:00:00", currency: "KRW", priority: "normal" },
];

export const purchaseOrderSummaries: PurchaseOrderSummary[] = purchaseOrders.map((po) => ({
  id: po.id,
  poNumber: po.poNumber,
  supplierId: po.supplierId,
  supplierName: po.supplierName,
  itemCount: Array.isArray(po.items) ? po.items.length : 0,
  totalAmount: po.totalAmount,
  dueDate: po.dueDate,
  status: po.status,
  assignedTo: po.assignedTo,
}));

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return purchaseOrders.find((po) => po.id === id);
}

export const poStatusLabels: Record<POStatus, string> = {
  draft: "임시",
  approved: "승인",
  issued: "발행",
  partial_receipt: "부분 입고",
  closed: "종결",
};
