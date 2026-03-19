/**
 * 공통코드 전역 스토어 (모듈 수준 메모리)
 * 공통코드 관리 페이지에서 수정하면 앱 어디서든 최신 값을 읽을 수 있습니다.
 */

export type CommonCodeItem = {
  code: string;
  name: string;
  description?: string;
};

const defaultCodes: Record<string, CommonCodeItem[]> = {
  plant: [
    { code: "gimhae",     name: "김해공장" },
    { code: "ulsan",      name: "울산공장" },
    { code: "pyeongtaek", name: "평택공장" },
  ],
  paymentType: [
    { code: "transfer", name: "계좌이체", description: "일반 은행 계좌이체 방식." },
    { code: "l/c",      name: "L/C",      description: "수입 신용장(Letter of Credit) 결제." },
    { code: "bill",     name: "어음",     description: "약속어음 발행 방식." },
    { code: "cash",     name: "현금",     description: "현금 직접 지급." },
    { code: "credit",   name: "외상",     description: "외상 후 결제 방식." },
  ],
  paymentTerm: [
    { code: "11", name: "현금(30)" },
    { code: "12", name: "현금(60)" },
    { code: "13", name: "현금(90)" },
    { code: "21", name: "B2B(15)" },
    { code: "22", name: "어음(45)" },
    { code: "23", name: "어음(60)" },
  ],
  importType: [
    { code: "domestic",  name: "내수",       description: "국내 공급업체로부터의 구매." },
    { code: "master_lc", name: "MASTER L/C", description: "해외 신용장(Letter of Credit) 방식 수입." },
    { code: "tt",        name: "T/T",        description: "전신환(Telegraphic Transfer) 방식 수입." },
  ],
  currency: [
    { code: "CNY", name: "CNY(중국)" },
    { code: "EUR", name: "EUR(유럽연합)" },
    { code: "JPY", name: "JPY(일본)" },
    { code: "KRW", name: "WON(원)" },
    { code: "USD", name: "USD(미국)" },
  ],
  vatRate: [
    { code: "0",  name: "0%" },
    { code: "10", name: "10%" },
  ],
  paymentForm: [
    { code: "10", name: "현금30" },
    { code: "11", name: "현금60" },
    { code: "12", name: "현금90" },
    { code: "20", name: "B2B30" },
    { code: "21", name: "B2B60" },
    { code: "22", name: "B2B90" },
    { code: "23", name: "B2B75" },
  ],
  warehouse: [
    { code: "10", name: "원부자재창고",  description: "생산에 투입되는 원재료 및 부자재 보관." },
    { code: "20", name: "제품재고",      description: "생산 완료된 완제품 보관 창고." },
    { code: "30", name: "상품재고",      description: "외부 구매 후 판매용 상품 보관." },
    { code: "40", name: "RSM(IN-LINE)", description: "생산 라인 내 직투입 자재 보관." },
    { code: "90", name: "반품창고",      description: "불량·반품 자재 격리 보관 창고." },
  ],
};

// 런타임 스토어 (기본값으로 초기화)
const store: Record<string, CommonCodeItem[]> = JSON.parse(
  JSON.stringify(defaultCodes)
);

export function getCommonCodes(category: string): CommonCodeItem[] {
  return store[category] ?? [];
}

export function setCommonCodes(category: string, codes: CommonCodeItem[]): void {
  store[category] = codes;
}

export function getAllCategories(): string[] {
  return Object.keys(store);
}
