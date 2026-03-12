"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, type SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { suppliers } from "@/lib/mock/suppliers";
import { poStatusLabels } from "@/lib/mock/purchase-orders";
import { paymentTypeOptions, paymentTermOptions, businessPlaceOptions, importTypeOptions, buyerOptions } from "@/lib/mock/po-options";
import { purchasers } from "@/lib/mock/purchasers";
import type { PurchaserRecord } from "@/types/purchaser";
import type {
  POBasicFormData,
  POSpecItemRow,
  POStatus,
} from "@/types/purchase";
import { MasterListGrid, type MasterListGridColumn } from "@/components/common/master-list-grid";
import { Plus, Trash2, Search, RotateCcw, FileDown, List, Save, X, FileEdit } from "lucide-react";

const currencyOptions: SelectOption[] = [
  { value: "KRW", label: "KRW" },
  { value: "USD", label: "USD" },
];

const warehouseOptions: SelectOption[] = [
  { value: "10", label: "10 원부자재창고" },
  { value: "20", label: "20 제품재고" },
  { value: "30", label: "30 상품재고" },
  { value: "40", label: "40 RSM(IN-LINE)" },
  { value: "90", label: "90 반품창고" },
];

const warehouseLabelMap: Record<string, string> = warehouseOptions.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {} as Record<string, string>
);

const statusOptions: SelectOption[] = Object.entries(poStatusLabels).map(
  ([value, label]) => ({ value, label })
);

const defaultBasicForm: POBasicFormData = {
  orderStatus: "approved",
  supplierId: "",
  supplierName: "",
  currencyCode: "KRW",
  paymentType: "",
  paymentTerms: "",
  buyerCode: "",
  buyerName: "",
  supplierQuotationNo: "",
  supplierContactPerson: "",
  advancePayment: "",
  orderDate: new Date().toISOString().slice(0, 10),
  vatRate: "0",
  importType: "domestic",
  businessPlace: "gimhae",
  packagingStatus: "",
  inspectionCondition: "",
  deliveryCondition: "",
  otherCondition: "",
  notes: "",
};

const defaultSpecRow: Omit<POSpecItemRow, "amount"> = {
  itemCode: "",
  itemName: "",
  material: "",
  specification: "",
  warehouse: "",
  quantity: 0,
  receivedQty: 0,
  unitPrice: 0,
  isProvisionalPrice: false,
  dueDate: "",
};

function getDefaultSpecRow(): POSpecItemRow {
  return { ...defaultSpecRow, amount: 0 };
}

/** 등록된 기본정보 리스트 항목 (왼쪽 리스트용) */
type BasicInfoListItem = POBasicFormData & {
  id: string;
  orderNumber: string;
  progress?: "기본정보" | "명세작성중" | "명세완료";
};

/** 명세작업에서 선택할 수 있는 품목 마스터 (간단 버전) */
type ItemMaster = {
  itemCode: string;
  itemName: string;
  material?: string;
  spec?: string;
  unitPrice: number;
};

/** 기본정보 등록 리스트 더미 10건 */
const initialBasicInfoListDummy: BasicInfoListItem[] = [
  { id: "dummy-1", orderNumber: "PO-2026-0001", progress: "명세완료", orderStatus: "approved", supplierId: "sup-001", supplierName: "한국정밀기어", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-001", supplierContactPerson: "김대영", advancePayment: "", orderDate: "2026-03-01", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-2", orderNumber: "PO-2026-0002", progress: "명세완료", orderStatus: "issued", supplierId: "sup-002", supplierName: "일본스틸코리아", currencyCode: "KRW", paymentType: "l/c", paymentTerms: "net60", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-002", supplierContactPerson: "다나카 히로시", advancePayment: "0", orderDate: "2026-03-02", vatRate: "10", importType: "import", businessPlace: "gimhae", packagingStatus: "파레트", inspectionCondition: "원료검사", deliveryCondition: "선적", otherCondition: "", notes: "긴급" },
  { id: "dummy-3", orderNumber: "PO-2026-0003", progress: "기본정보", orderStatus: "draft", supplierId: "sup-003", supplierName: "대우베어링", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-035", buyerName: "이발주", supplierQuotationNo: "", supplierContactPerson: "박준혁", advancePayment: "", orderDate: "2026-03-05", vatRate: "0", importType: "domestic", businessPlace: "ulsan", packagingStatus: "", inspectionCondition: "", deliveryCondition: "", otherCondition: "", notes: "" },
  { id: "dummy-4", orderNumber: "PO-2026-0004", progress: "명세완료", orderStatus: "approved", supplierId: "sup-004", supplierName: "독일오토파츠", currencyCode: "KRW", paymentType: "bill", paymentTerms: "net90", buyerCode: "2022-036", buyerName: "박담당", supplierQuotationNo: "QT-2026-004", supplierContactPerson: "Hans Mueller", advancePayment: "30", orderDate: "2026-03-06", vatRate: "10", importType: "import", businessPlace: "gimhae", packagingStatus: "목재케이스", inspectionCondition: "수입검사", deliveryCondition: "CIF", otherCondition: "", notes: "1차 납품" },
  { id: "dummy-5", orderNumber: "PO-2026-0005", progress: "명세작성중", orderStatus: "partial_receipt", supplierId: "sup-005", supplierName: "중국동력전자", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-005", supplierContactPerson: "王明", advancePayment: "", orderDate: "2026-02-28", vatRate: "10", importType: "import", businessPlace: "pyeongtaek", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "FOB", otherCondition: "", notes: "" },
  { id: "dummy-6", orderNumber: "PO-2026-0006", progress: "명세완료", orderStatus: "closed", supplierId: "sup-006", supplierName: "현대캐스팅", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-006", supplierContactPerson: "이주영", advancePayment: "0", orderDate: "2026-02-20", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "파레트", inspectionCondition: "출하검사", deliveryCondition: "공장인도", otherCondition: "", notes: "종결" },
  { id: "dummy-7", orderNumber: "PO-2026-0007", progress: "명세작성중", orderStatus: "issued", supplierId: "sup-001", supplierName: "한국정밀기어", currencyCode: "KRW", paymentType: "credit", paymentTerms: "net60", buyerCode: "2022-035", buyerName: "이발주", supplierQuotationNo: "QT-2026-007", supplierContactPerson: "김대영", advancePayment: "", orderDate: "2026-03-08", vatRate: "10", importType: "domestic", businessPlace: "ulsan", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-8", orderNumber: "PO-2026-0008", progress: "기본정보", orderStatus: "approved", supplierId: "sup-002", supplierName: "일본스틸코리아", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-036", buyerName: "박담당", supplierQuotationNo: "", supplierContactPerson: "다나카 히로시", advancePayment: "", orderDate: "2026-03-10", vatRate: "0", importType: "domestic", businessPlace: "gimhae", packagingStatus: "", inspectionCondition: "", deliveryCondition: "", otherCondition: "", notes: "시험발주" },
  { id: "dummy-9", orderNumber: "PO-2026-0009", progress: "기본정보", orderStatus: "draft", supplierId: "sup-003", supplierName: "대우베어링", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-009", supplierContactPerson: "박준혁", advancePayment: "", orderDate: "2026-03-12", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-10", orderNumber: "PO-2026-0010", progress: "기본정보", orderStatus: "approved", supplierId: "sup-004", supplierName: "독일오토파츠", currencyCode: "KRW", paymentType: "l/c", paymentTerms: "net90", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-010", supplierContactPerson: "Hans Mueller", advancePayment: "20", orderDate: "2026-03-11", vatRate: "10", importType: "import", businessPlace: "pyeongtaek", packagingStatus: "목재케이스", inspectionCondition: "수입검사", deliveryCondition: "CIF", otherCondition: "", notes: "" },
];

/** 품목 선택용 더미 데이터 (실제에선 품목 마스터 테이블 연동) */
const itemMaster: ItemMaster[] = [
  { itemCode: "GP-3012", itemName: "기어 피니언 세트", material: "합금강", spec: "M12 x 40", unitPrice: 85000 },
  { itemCode: "BR-2041", itemName: "베어링 하우징", material: "주철", spec: "Ø45", unitPrice: 32000 },
  { itemCode: "ST-5501", itemName: "고장력 스틸 샤프트", material: "탄소강", spec: "⌀22 x 500", unitPrice: 125000 },
  { itemCode: "BR-2042", itemName: "볼 베어링 6205", material: "베어링강", spec: "6205", unitPrice: 8500 },
  { itemCode: "AP-8801", itemName: "터보차저 블레이드", material: "내열합금", spec: "TURBO-8801", unitPrice: 280000 },
  { itemCode: "AP-8802", itemName: "ECU 커넥터", material: "수지", spec: "24P", unitPrice: 12000 },
];

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [basicInfoList, setBasicInfoList] = useState<BasicInfoListItem[]>(initialBasicInfoListDummy);
  const [selectedBasicId, setSelectedBasicId] = useState<string | null>(null);
  const [isPurchaserModalOpen, setIsPurchaserModalOpen] = useState(false);
  const [purchaserSearch, setPurchaserSearch] = useState("");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeSpecRowIndex, setActiveSpecRowIndex] = useState(0);
  const [basicForm, setBasicForm] = useState<POBasicFormData>(defaultBasicForm);
  const [specItems, setSpecItems] = useState<POSpecItemRow[]>([getDefaultSpecRow()]);

  const supplierOptions: SelectOption[] = suppliers.map((s) => ({
    value: s.id,
    label: `${s.id} ${s.name}`,
  }));
  const buyerSelectOptions: SelectOption[] = buyerOptions.map((b) => ({
    value: b.code,
    label: `${b.code} ${b.name}`,
  }));

  const filteredPurchasers: PurchaserRecord[] = useMemo(() => {
    const keyword = purchaserSearch.trim().toLowerCase();
    if (!keyword) return purchasers;
    return purchasers.filter(
      (p) =>
        p.purchaserNo.toLowerCase().includes(keyword) ||
        p.purchaserName.toLowerCase().includes(keyword)
    );
  }, [purchaserSearch]);

  const filteredItems: ItemMaster[] = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    if (!keyword) return itemMaster;
    return itemMaster.filter(
      (i) =>
        i.itemCode.toLowerCase().includes(keyword) ||
        i.itemName.toLowerCase().includes(keyword)
    );
  }, [itemSearch]);

  const setBasic = (field: keyof POBasicFormData, value: string) => {
    setBasicForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "supplierId") {
        // value는 구매처 번호(예: 00011), supplierName은 구매처명으로 사용
        const p = purchasers.find((x) => x.purchaserNo === value);
        next.supplierName = p?.purchaserName ?? "";
      }
      if (field === "buyerCode") {
        const b = buyerOptions.find((x) => x.code === value);
        next.buyerName = b?.name ?? "";
      }
      return next;
    });
  };

  const handleBasicFormReset = () => {
    setBasicForm(defaultBasicForm);
    setSelectedBasicId(null);
  };

  /** 오른쪽 폼에서 등록 클릭 시 리스트에 추가 */
  const handleRegisterBasicInfo = () => {
    const orderNumber = `PO-${new Date().getFullYear()}-${String(basicInfoList.length + 1).padStart(4, "0")}`;
    const item: BasicInfoListItem = {
      ...basicForm,
      id: `basic-${Date.now()}`,
      orderNumber,
      progress: "기본정보",
    };
    setBasicInfoList((prev) => [...prev, item]);
    setBasicForm(defaultBasicForm);
    setSelectedBasicId(null);
  };

  /** 왼쪽 리스트 행 클릭 시 오른쪽 폼에 로드 */
  const handleSelectBasicInfo = (row: BasicInfoListItem) => {
    setSelectedBasicId(row.id);
    const { id: _id, orderNumber: _on, ...formData } = row;
    setBasicForm(formData);
  };

  const handleGoToSpec = () => {
    setStep(2);
    if (selectedBasicId) {
      setBasicInfoList((prev) =>
        prev.map((row) =>
          row.id === selectedBasicId
            ? { ...row, progress: row.progress === "명세완료" ? row.progress : "명세작성중" }
            : row
        )
      );
    }
  };

  const basicListColumns: MasterListGridColumn<BasicInfoListItem>[] = [
    {
      key: "orderNumber",
      header: "오더번호",
      minWidth: 68,
      maxWidth: 82,
      cell: (r) => (
        <span
          className="font-medium text-primary truncate block max-w-full"
          title={r.orderNumber}
        >
          {r.orderNumber}
        </span>
      ),
    },
    {
      key: "supplierName",
      header: "구매처",
      minWidth: 88,
      maxWidth: 110,
      cell: (r) => (
        <span
          className="truncate block max-w-full"
          title={r.supplierName}
        >
          {r.supplierName}
        </span>
      ),
    },
    { key: "orderDate", header: "발주일자", minWidth: 64, maxWidth: 76 },
    {
      key: "buyerName",
      header: "발주자",
      minWidth: 52,
      maxWidth: 64,
      cell: (r) => (
        <span className="truncate block max-w-full" title={r.buyerName}>
          {r.buyerName}
        </span>
      ),
    },
    {
      key: "progress",
      header: "진행",
      minWidth: 80,
      maxWidth: 96,
      cell: (r) => {
        const value = r.progress ?? "기본정보";
        return (
          <Badge
            variant={progressVariant[value]}
            className="px-2 py-0.5 text-[11px]"
          >
            {value}
          </Badge>
        );
      },
    },
  ];

  const addSpecItem = () => {
    setSpecItems((prev) => {
      const next = [...prev, getDefaultSpecRow()];
      setActiveSpecRowIndex(next.length - 1);
      return next;
    });
  };

  const removeSpecItem = (index: number) => {
    setSpecItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpecItem = (
    index: number,
    field: keyof POSpecItemRow,
    value: string | number | boolean
  ) => {
    setSpecItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          next.amount =
            (typeof next.quantity === "number" ? next.quantity : 0) *
            (typeof next.unitPrice === "number" ? next.unitPrice : 0);
        }
        return next;
      })
    );
  };

  const totalOrderAmount = specItems.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const vatAmount = Math.round(
    totalOrderAmount * (Number(basicForm.vatRate) || 0) / 100
  );
  const businessPlaceLabel =
    businessPlaceOptions.find((o) => o.value === basicForm.businessPlace)?.label ??
    basicForm.businessPlace;

  const progressVariant: Record<
    NonNullable<BasicInfoListItem["progress"]>,
    "secondary" | "default" | "outline" | "success" | "warning" | "destructive"
  > = {
    기본정보: "outline",
    명세작성중: "warning",
    명세완료: "success",
  };

  // --- 명세입력 버튼 동작 ---
  const handleSpecSearch = () => {
    // 데모용: 품목 마스터를 기준으로 명세 행을 채움
    const rows: POSpecItemRow[] = itemMaster.map((i) => ({
      ...getDefaultSpecRow(),
      itemCode: i.itemCode,
      itemName: i.itemName,
      material: i.material ?? "",
      specification: i.spec ?? "",
      unitPrice: i.unitPrice,
      quantity: 0,
      receivedQty: 0,
      dueDate: basicForm.orderDate,
      amount: 0,
      isProvisionalPrice: false,
    }));
    setSpecItems(rows.length ? rows : [getDefaultSpecRow()]);
    setActiveSpecRowIndex(0);
  };

  const handleSpecRegister = () => {
    // 실제 환경에서는 API 호출 등으로 대체
    if (specItems.length === 0 || !specItems.some((r) => r.itemCode)) {
      window.alert("등록할 명세가 없습니다. 품목을 먼저 추가해 주세요.");
      return;
    }
    window.alert("명세가 등록되었습니다. (데모)");
    if (selectedBasicId) {
      setBasicInfoList((prev) =>
        prev.map((row) =>
          row.id === selectedBasicId ? { ...row, progress: "명세완료" } : row
        )
      );
    }
  };

  const handleBulkRegister = () => {
    // 데모용: 현재 행 뒤에 품목 마스터 전체를 추가
    setSpecItems((prev) => {
      const appended = itemMaster.map((i) => ({
        ...getDefaultSpecRow(),
        itemCode: i.itemCode,
        itemName: i.itemName,
        material: i.material ?? "",
        specification: i.spec ?? "",
        unitPrice: i.unitPrice,
        quantity: 0,
        receivedQty: 0,
        dueDate: basicForm.orderDate,
        amount: 0,
        isProvisionalPrice: false,
      }));
      const next = [...prev, ...appended];
      setActiveSpecRowIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const fieldLabelClass = "bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader
        title={step === 1 ? "구매오더 관리" : "구매오더 - 명세작업"}
        description={
          step === 1
            ? "기본 구매오더 정보를 입력한 후 상세등록에서 명세를 입력합니다."
            : "품목별 명세를 입력합니다."
        }
      />

      {step === 1 && (
        <>
          {/* 1단계: 왼쪽 리스트 + 오른쪽 기본정보 등록 */}
          <div className="flex gap-4 min-h-0">
            {/* 왼쪽: 기본정보 등록 리스트 */}
            <Card className="w-[548px] shrink-0 flex flex-col overflow-hidden">
              <CardHeader className="border-b py-3">
                <h2 className="text-base font-semibold">기본정보 등록 리스트</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  등록된 기본정보를 선택하면 오른쪽에서 수정할 수 있습니다.
                </p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 min-w-0 p-0 overflow-hidden">
                <div className="h-full overflow-x-hidden overflow-y-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
                  <MasterListGrid<BasicInfoListItem>
                    columns={basicListColumns}
                    data={basicInfoList}
                    keyExtractor={(row) => row.id}
                    onRowClick={handleSelectBasicInfo}
                    getRowClassName={(row) => (selectedBasicId === row.id ? "bg-sky-50" : "")}
                    maxHeight="100%"
                    noHorizontalScroll
                    emptyMessage="등록된 기본정보가 없습니다. 오른쪽에서 등록해 주세요."
                    className="min-w-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 오른쪽: 기본정보 등록 폼 */}
            <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <CardHeader className="border-b bg-muted/30 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">기본정보 등록</h2>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBasicFormReset}
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />
                      초기화
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegisterBasicInfo}
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <Save className="mr-1.5 h-4 w-4 shrink-0" />
                      등록
                    </Button>
                    <Link href="/purchase-orders">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      >
                        <X className="mr-1.5 h-4 w-4 shrink-0" />
                        닫기
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGoToSpec}
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <FileEdit className="mr-1.5 h-4 w-4 shrink-0" />
                      상세등록
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-auto">
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* 왼쪽 컬럼 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[100px_1fr_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>오더번호/상태</Label>
                    <Select
                      options={statusOptions}
                      value={basicForm.orderStatus}
                      onChange={(v) => setBasic("orderStatus", v as POStatus)}
                      placeholder="상태"
                    />
                    <span />
                  </div>
                  <div className="grid grid-cols-[100px_minmax(0,0.5fr)_minmax(0,0.5fr)_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처번호</Label>
                    <Input
                      value={basicForm.supplierId}
                      onChange={(e) => setBasic("supplierId", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="구매처 CODE 직접입력"
                    />
                    <Input
                      value={basicForm.supplierName}
                      readOnly
                      className="h-8 text-sm bg-muted/50"
                      placeholder="구매처명"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setIsPurchaserModalOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[100px_1fr_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>통화코드</Label>
                    <Input
                      value={basicForm.currencyCode}
                      onChange={(e) => setBasic("currencyCode", e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[100px_1fr_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급형태</Label>
                    <Select
                      options={paymentTypeOptions.map((o) => ({ value: o.value, label: o.label }))}
                      value={basicForm.paymentType}
                      onChange={(v) => setBasic("paymentType", v)}
                      placeholder="선택"
                    />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[100px_1fr_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급조건</Label>
                    <Select
                      options={paymentTermOptions.map((o) => ({ value: o.value, label: o.label }))}
                      value={basicForm.paymentTerms}
                      onChange={(v) => setBasic("paymentTerms", v)}
                      placeholder="선택"
                    />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매 발주자</Label>
                    <div className="flex gap-1">
                      <Select
                        options={[{ value: "", label: "선택" }, ...buyerSelectOptions]}
                        value={basicForm.buyerCode}
                        onChange={(v) => setBasic("buyerCode", v)}
                        placeholder="발주자 선택"
                        className="flex-1"
                      />
                      <Input
                        value={basicForm.buyerName}
                        readOnly
                        className="h-8 w-32 text-sm bg-muted/50"
                        placeholder="이름"
                      />
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처견적번호</Label>
                    <Input
                      value={basicForm.supplierQuotationNo}
                      onChange={(e) => setBasic("supplierQuotationNo", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처담당자</Label>
                    <Input
                      value={basicForm.supplierContactPerson}
                      onChange={(e) => setBasic("supplierContactPerson", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>선급금</Label>
                    <Input
                      value={basicForm.advancePayment}
                      onChange={(e) => setBasic("advancePayment", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* 오른쪽 컬럼 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>사업장</Label>
                    <Select
                      options={businessPlaceOptions.map((o) => ({ value: o.value, label: o.label }))}
                      value={basicForm.businessPlace}
                      onChange={(v) => setBasic("businessPlace", v)}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>발주일자</Label>
                    <Input
                      type="date"
                      value={basicForm.orderDate}
                      onChange={(e) => setBasic("orderDate", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>부가세율</Label>
                    <Input
                      value={basicForm.vatRate}
                      onChange={(e) => setBasic("vatRate", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>수입구분</Label>
                    <Select
                      options={importTypeOptions.map((o) => ({ value: o.value, label: o.label }))}
                      value={basicForm.importType}
                      onChange={(v) => setBasic("importType", v)}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>포장상태</Label>
                    <Input
                      value={basicForm.packagingStatus}
                      onChange={(e) => setBasic("packagingStatus", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>검사조건</Label>
                    <Input
                      value={basicForm.inspectionCondition}
                      onChange={(e) => setBasic("inspectionCondition", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>납기조건</Label>
                    <Input
                      value={basicForm.deliveryCondition}
                      onChange={(e) => setBasic("deliveryCondition", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>기타조건</Label>
                    <Input
                      value={basicForm.otherCondition}
                      onChange={(e) => setBasic("otherCondition", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-start">
                    <Label className={fieldLabelClass}>비고</Label>
                    <Textarea
                      value={basicForm.notes}
                      onChange={(e) => setBasic("notes", e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      placeholder="비고"
                    />
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {/* 2단계: 명세작업 - 상단 요약 */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
                <div className="flex flex-wrap gap-4">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">오더번호</span>
                    <span className="font-medium">17739</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">구매처</span>
                    <span className="font-medium">
                      {basicForm.supplierId || "-"} {basicForm.supplierName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">총발주금액</span>
                    <span className="font-medium">{formatCurrency(totalOrderAmount)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">오더상태</span>
                    <span className="font-medium">{poStatusLabels[basicForm.orderStatus as POStatus]}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">통화단위</span>
                    <span className="font-medium">{basicForm.currencyCode}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">발주일자</span>
                    <span className="font-medium">{basicForm.orderDate}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">부가세액</span>
                    <span className="font-medium">{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">사업장</span>
                    <span className="font-medium">{businessPlaceLabel}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 명세 입력 폼 */}
          <Card>
            <CardHeader className="border-b py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">명세 입력</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSpecSearch}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <Search className="mr-1.5 h-4 w-4 shrink-0" />
                    조회
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSpecItems([getDefaultSpecRow()])}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />
                    초기화
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSpecRegister}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <Save className="mr-1.5 h-4 w-4 shrink-0" />
                    등록
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRegister}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <FileDown className="mr-1.5 h-4 w-4 shrink-0" />
                    일괄등록
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addSpecItem();
                      setIsItemModalOpen(true);
                    }}
                    className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <List className="mr-1.5 h-4 w-4 shrink-0" />
                    품목별등록
                  </Button>
                  <Link href="/purchase-orders">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <X className="mr-1.5 h-4 w-4 shrink-0" />
                      닫기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 text-xs">
                <div className="space-y-1 max-w-xs">
                  <Label className="text-muted-foreground">품목번호</Label>
                  <div className="flex gap-1">
                    <Input
                      className="h-8"
                      placeholder="품목번호"
                      value={specItems[activeSpecRowIndex]?.itemCode ?? ""}
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setActiveSpecRowIndex(
                          Math.max(0, specItems.length - 1)
                        );
                        setIsItemModalOpen(true);
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 max-w-sm">
                  <Label className="text-muted-foreground">품목규격</Label>
                  <Input className="h-8" placeholder="규격" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">구매단가</Label>
                  <Input type="number" className="h-8" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">발주량</Label>
                  <Input type="number" className="h-8" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">발주일자</Label>
                  <Input type="date" className="h-8" value={basicForm.orderDate} readOnly />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">재질</Label>
                  <Input className="h-8" placeholder="재질" />
                </div>
              </div>

              {/* 품목 행 편집 테이블 (간단) */}
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 w-16 whitespace-nowrap text-center">명세번호</th>
                      <th className="p-2 w-24 text-center">품목번호</th>
                      <th className="p-2 w-40 text-center">품목명</th>
                      <th className="p-2 w-20 text-center">규격</th>
                      <th className="p-2 w-24 text-center">창고선택</th>
                      <th className="p-2 w-20 text-center">발주량</th>
                      <th className="p-2 w-24 text-center">구매단가</th>
                      <th className="p-2 w-24 text-center">발주금액</th>
                      <th className="p-2 w-16 text-center">가단가</th>
                      <th className="p-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {specItems.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2 w-24">
                          <Input
                            value={row.itemCode}
                            onChange={(e) => updateSpecItem(index, "itemCode", e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-40">
                          <Input
                            value={row.itemName}
                            onChange={(e) => updateSpecItem(index, "itemName", e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.specification ?? ""}
                            onChange={(e) => updateSpecItem(index, "specification", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-2 bg-amber-50 border-l border-amber-200">
                          <Select
                            options={warehouseOptions}
                            value={row.warehouse ?? ""}
                            onChange={(v) =>
                              updateSpecItem(index, "warehouse", v)
                            }
                            placeholder="창고선택"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-2 text-right bg-amber-50 border-l border-r border-amber-200">
                          <Input
                            type="number"
                            min={0}
                            value={row.quantity || ""}
                            onChange={(e) => updateSpecItem(index, "quantity", Number(e.target.value) || 0)}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={row.unitPrice || ""}
                            onChange={(e) => updateSpecItem(index, "unitPrice", Number(e.target.value) || 0)}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(row.amount ?? 0)}
                        </td>
                        <td className="p-2 bg-amber-50 border-l border-r border-amber-200">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={row.isProvisionalPrice ?? false}
                              onChange={(e) => updateSpecItem(index, "isProvisionalPrice", e.target.checked)}
                              className="rounded"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeSpecItem(index)}
                            disabled={specItems.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSpecItem}>
                <Plus className="mr-2 h-4 w-4" />
                품목 추가
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              이전 (기본 정보)
            </Button>
            <Link href="/purchase-orders">
              <Button type="button">목록으로</Button>
            </Link>
          </div>
        </>
      )}

      {isPurchaserModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">구매처 선택</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsPurchaserModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3 flex gap-2">
              <Input
                value={purchaserSearch}
                onChange={(e) => setPurchaserSearch(e.target.value)}
                placeholder="구매처번호 또는 구매처명 검색"
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPurchaserSearch("")}
              >
                초기화
              </Button>
            </div>
            <div className="max-h-[420px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">구매처번호</th>
                    <th className="px-3 py-2 text-left">구매처명</th>
                    <th className="px-3 py-2 text-left">대표자</th>
                    <th className="px-3 py-2 text-left">거래유형</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchasers.map((p) => (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-t hover:bg-slate-50"
                      onClick={() => {
                        setBasic("supplierId", p.purchaserNo);
                        setIsPurchaserModalOpen(false);
                      }}
                    >
                      <td className="px-3 py-1.5">{p.purchaserNo}</td>
                      <td className="px-3 py-1.5">{p.purchaserName}</td>
                      <td className="px-3 py-1.5">{p.representativeName}</td>
                      <td className="px-3 py-1.5">{p.transactionType}</td>
                    </tr>
                  ))}
                  {filteredPurchasers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-xs text-muted-foreground"
                      >
                        조건에 맞는 구매처가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">품목 선택</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsItemModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3 flex gap-2">
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="품목번호 또는 품목명 검색"
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemSearch("")}
              >
                초기화
              </Button>
            </div>
            <div className="max-h-[420px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">품목번호</th>
                    <th className="px-3 py-2 text-left">품목명</th>
                    <th className="px-3 py-2 text-left">재질</th>
                    <th className="px-3 py-2 text-left">규격</th>
                    <th className="px-3 py-2 text-right">기준단가</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((i) => (
                    <tr
                      key={i.itemCode}
                      className="cursor-pointer border-t hover:bg-slate-50"
                      onClick={() => {
                        updateSpecItem(activeSpecRowIndex, "itemCode", i.itemCode);
                        updateSpecItem(activeSpecRowIndex, "itemName", i.itemName);
                        updateSpecItem(activeSpecRowIndex, "material", i.material ?? "");
                        updateSpecItem(activeSpecRowIndex, "specification", i.spec ?? "");
                        updateSpecItem(activeSpecRowIndex, "unitPrice", i.unitPrice);
                        setIsItemModalOpen(false);
                      }}
                    >
                      <td className="px-3 py-1.5">{i.itemCode}</td>
                      <td className="px-3 py-1.5">{i.itemName}</td>
                      <td className="px-3 py-1.5">{i.material ?? "-"}</td>
                      <td className="px-3 py-1.5">{i.spec ?? "-"}</td>
                      <td className="px-3 py-1.5 text-right">
                        {formatCurrency(i.unitPrice)}
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-xs text-muted-foreground"
                      >
                        조건에 맞는 품목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
