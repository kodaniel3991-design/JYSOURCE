export const paymentTypeOptions: { value: string; label: string }[] = [
  { value: "transfer", label: "계좌이체" },
  { value: "l/c", label: "L/C" },
  { value: "bill", label: "어음" },
  { value: "cash", label: "현금" },
  { value: "credit", label: "외상" },
];

export const paymentTermOptions: { value: string; label: string }[] = [
  { value: "net30", label: "매입 30일" },
  { value: "net60", label: "매입 60일" },
  { value: "net90", label: "매입 90일" },
  { value: "cod", label: "현금인도" },
  { value: "advance", label: "선급" },
];

export const businessPlaceOptions: { value: string; label: string }[] = [
  { value: "gimhae", label: "김해공장" },
  { value: "ulsan", label: "울산공장" },
  { value: "pyeongtaek", label: "평택공장" },
];

export const importTypeOptions: { value: string; label: string }[] = [
  { value: "domestic", label: "내수" },
  { value: "import", label: "수입" },
];

export const buyerOptions: { code: string; name: string }[] = [
  { code: "2022-033", name: "임정근" },
  { code: "2022-034", name: "김구매" },
  { code: "2022-035", name: "이발주" },
  { code: "2022-036", name: "박담당" },
];
