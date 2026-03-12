import type { Supplier, SupplierDetail } from "@/types/supplier";

export const suppliers: Supplier[] = [
  {
    id: "sup-001",
    name: "한국정밀기어",
    country: "KR",
    contactName: "김대영",
    contactEmail: "dy.kim@krprecision.co.kr",
    contactPhone: "+82-2-1234-5678",
    address: "경기도 화성시 동탄산단3길 22",
    totalSpend: 245000000,
    grade: "A",
    status: "active",
    createdAt: "2023-01-15",
    updatedAt: "2024-03-01",
  },
  {
    id: "sup-002",
    name: "일본스틸코리아",
    country: "JP",
    contactName: "다나카 히로시",
    contactEmail: "tanaka@jsteel-kr.com",
    contactPhone: "+82-31-9876-5432",
    address: "인천시 남동구 논현동 123",
    totalSpend: 189000000,
    grade: "A",
    status: "active",
    createdAt: "2022-06-20",
    updatedAt: "2024-02-28",
  },
  {
    id: "sup-003",
    name: "대우베어링",
    country: "KR",
    contactName: "박준혁",
    contactEmail: "jh.park@daewoobearing.com",
    contactPhone: "+82-32-5555-1234",
    totalSpend: 92000000,
    grade: "B",
    status: "active",
    createdAt: "2023-03-10",
    updatedAt: "2024-03-05",
  },
  {
    id: "sup-004",
    name: "독일오토파츠",
    country: "DE",
    contactName: "Hans Mueller",
    contactEmail: "h.mueller@auto-parts.de",
    contactPhone: "+49-89-1234567",
    totalSpend: 312000000,
    grade: "S",
    status: "active",
    createdAt: "2021-11-01",
    updatedAt: "2024-03-10",
  },
  {
    id: "sup-005",
    name: "중국동력전자",
    country: "CN",
    contactName: "Wang Li",
    contactEmail: "wang.li@cnpower.com",
    contactPhone: "+86-21-8765-4321",
    totalSpend: 67000000,
    grade: "C",
    status: "active",
    createdAt: "2023-08-15",
    updatedAt: "2024-02-20",
  },
  {
    id: "sup-006",
    name: "현대캐스팅",
    country: "KR",
    contactName: "이수진",
    contactEmail: "sj.lee@hyundaicasting.co.kr",
    contactPhone: "+82-52-3333-4444",
    totalSpend: 156000000,
    grade: "B",
    status: "active",
    createdAt: "2022-09-01",
    updatedAt: "2024-03-08",
  },
];

export const supplierDetails: Record<string, SupplierDetail> = {
  "sup-001": {
    ...suppliers[0],
    recentOrders: [
      { poNumber: "PO-2024-0012", amount: 14900000, date: "2024-03-05" },
      { poNumber: "PO-2024-0005", amount: 5520000, date: "2024-02-10" },
    ],
    suppliedItems: [
      { itemCode: "GP-3012", itemName: "기어 피니언 세트", lastOrderDate: "2024-03-01" },
      { itemCode: "GP-3013", itemName: "디퍼렌셜 기어", lastOrderDate: "2024-02-10" },
    ],
    evaluation: { quality: 92, delivery: 88, price: 85, overall: 88 },
  },
  "sup-002": {
    ...suppliers[1],
    recentOrders: [
      { poNumber: "PO-2024-0011", amount: 6250000, date: "2024-02-28" },
      { poNumber: "PO-2024-0004", amount: 4410000, date: "2024-02-05" },
    ],
    suppliedItems: [
      { itemCode: "ST-5501", itemName: "고장력 스틸 샤프트", lastOrderDate: "2024-02-28" },
      { itemCode: "ST-5502", itemName: "드라이브 샤프트", lastOrderDate: "2024-02-05" },
    ],
    evaluation: { quality: 90, delivery: 92, price: 82, overall: 88 },
  },
  "sup-003": {
    ...suppliers[2],
    recentOrders: [
      { poNumber: "PO-2024-0010", amount: 7850000, date: "2024-02-25" },
    ],
    suppliedItems: [
      { itemCode: "BR-2042", itemName: "볼 베어링 6205", lastOrderDate: "2024-02-25" },
      { itemCode: "BR-2043", itemName: "실린더 베어링", lastOrderDate: "2024-02-25" },
    ],
    evaluation: { quality: 85, delivery: 80, price: 88, overall: 84 },
  },
  "sup-004": {
    ...suppliers[3],
    recentOrders: [
      { poNumber: "PO-2024-0009", amount: 10200000, date: "2024-02-20" },
      { poNumber: "PO-2024-0008", amount: 10200000, date: "2024-02-18" },
    ],
    suppliedItems: [
      { itemCode: "AP-8801", itemName: "터보차저 블레이드", lastOrderDate: "2024-02-18" },
      { itemCode: "AP-8802", itemName: "ECU 커넥터", lastOrderDate: "2024-02-18" },
    ],
    evaluation: { quality: 98, delivery: 96, price: 78, overall: 91 },
  },
  "sup-005": {
    ...suppliers[4],
    recentOrders: [{ poNumber: "PO-2024-0007", amount: 3700000, date: "2024-03-05" }],
    suppliedItems: [
      { itemCode: "MC-1101", itemName: "모터 코어 라미네이션", lastOrderDate: "2024-03-05" },
    ],
    evaluation: { quality: 78, delivery: 75, price: 92, overall: 82 },
  },
  "sup-006": {
    ...suppliers[5],
    recentOrders: [
      { poNumber: "PO-2024-0006", amount: 12840000, date: "2024-02-15" },
      { poNumber: "PO-2024-0003", amount: 2800000, date: "2024-02-01" },
    ],
    suppliedItems: [
      { itemCode: "CS-7001", itemName: "알루미늄 캐스팅 블록", lastOrderDate: "2024-02-15" },
      { itemCode: "CS-7002", itemName: "브레이크 캘리퍼 하우징", lastOrderDate: "2024-02-15" },
      { itemCode: "CS-7003", itemName: "엔진 마운트 브라켓", lastOrderDate: "2024-02-01" },
    ],
    evaluation: { quality: 86, delivery: 82, price: 85, overall: 84 },
  },
};

export function getSupplierById(id: string): Supplier | undefined {
  return suppliers.find((s) => s.id === id);
}

export function getSupplierDetailById(id: string): SupplierDetail | undefined {
  return supplierDetails[id];
}
