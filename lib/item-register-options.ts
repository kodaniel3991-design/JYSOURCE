/** 품목 등록용 Select/Combobox mock 옵션 (자동차 부품 제조업 실무 느낌) */

export interface SelectOption {
  value: string;
  label: string;
}

export const itemStatusOptions: SelectOption[] = [
  { value: "사용(양산)", label: "사용(양산)" },
  { value: "사양화", label: "사양화" },
  { value: "설계변경", label: "설계변경" },
  { value: "사용안함", label: "사용안함" },
  { value: "삭제", label: "삭제" },
  { value: "개발", label: "개발" },
];

export const itemFormOptions: SelectOption[] = [
  { value: "ASSY", label: "ASSY" },
  { value: "PART", label: "PART" },
  { value: "RAW", label: "RAW" },
  { value: "SEMI", label: "SEMI" },
  { value: "TOOL", label: "TOOL" },
];

export const itemTypeOptions: SelectOption[] = [
  { value: "TRIM", label: "TRIM" },
  { value: "NVH", label: "NVH" },
  { value: "CHASSIS", label: "CHASSIS" },
  { value: "ELECTRIC", label: "ELECTRIC" },
  { value: "ENGINE", label: "ENGINE" },
  { value: "MOLD", label: "MOLD" },
  { value: "ETC", label: "기타" },
];

export const valueCategoryOptions: SelectOption[] = [
  { value: "A", label: "A (고가)" },
  { value: "B", label: "B (중가)" },
  { value: "C", label: "C (저가)" },
];

export const itemUserCategoryOptions: SelectOption[] = [
  { value: "INT", label: "내장" },
  { value: "EXT", label: "외장" },
  { value: "NVH", label: "NVH" },
  { value: "CHASSIS", label: "섀시" },
  { value: "POWERTRAIN", label: "파워트레인" },
];

export const itemUsageClassificationOptions: SelectOption[] = [
  { value: "INT-TRIM", label: "내장 트림" },
  { value: "NVH-FLOOR", label: "NVH 플로어" },
  { value: "CHASSIS-BUSH", label: "섀시 부싱" },
  { value: "ENGINE-GASKET", label: "엔진 개스킷" },
];

export const materialOptions: SelectOption[] = [
  { value: "PP", label: "PP" },
  { value: "PP+CARPET", label: "PP+CARPET" },
  { value: "PU FOAM", label: "PU FOAM" },
  { value: "STEEL", label: "STEEL" },
  { value: "AL", label: "AL" },
  { value: "RUBBER", label: "RUBBER" },
  { value: "PA", label: "PA" },
  { value: "ABS", label: "ABS" },
];

export const currencyOptions: SelectOption[] = [
  { value: "KRW", label: "KRW" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "JPY", label: "JPY" },
];

export const orderPolicyOptions: SelectOption[] = [
  { value: "FIFO", label: "FIFO" },
  { value: "LIFO", label: "LIFO" },
  { value: "MIN_MAX", label: "Min/Max" },
  { value: "JIT", label: "JIT" },
  { value: "EOQ", label: "EOQ" },
];

export const businessUnitOptions: SelectOption[] = [
  { value: "완성차", label: "완성차" },
  { value: "부품", label: "부품" },
  { value: "경량화", label: "경량화" },
  { value: "전동화", label: "전동화" },
];

export const warehouseOptions: SelectOption[] = [
  { value: "WH-01", label: "본사 1창고" },
  { value: "WH-02", label: "본사 2창고" },
  { value: "WH-03", label: "동탄 물류센터" },
  { value: "WH-04", label: "해외 CKD" },
];

export const salesUnitOptions: SelectOption[] = [
  { value: "EA", label: "EA" },
  { value: "SET", label: "SET" },
  { value: "KG", label: "KG" },
  { value: "M", label: "M" },
  { value: "BOX", label: "BOX" },
];

/** 거래처/담당자/제조사 옵션은 mock-data 또는 API에서 주입 */
export const managerOptions: SelectOption[] = [
  { value: "김대리", label: "김대리" },
  { value: "박과장", label: "박과장" },
  { value: "이팀장", label: "이팀장" },
  { value: "정부장", label: "정부장" },
];

export const manufacturerOptions: SelectOption[] = [
  { value: "현대모듈", label: "현대모듈" },
  { value: "NVH코리아", label: "NVH코리아" },
  { value: "한국정밀기어", label: "한국정밀기어" },
  { value: "대우베어링", label: "대우베어링" },
];
