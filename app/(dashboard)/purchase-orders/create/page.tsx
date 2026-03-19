"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, type SelectOption } from "@/components/ui/select";
import { POStatusBadge } from "@/components/common/status-badge";
import { formatCurrency } from "@/lib/utils";
import { suppliers } from "@/lib/mock/suppliers";
import { poStatusLabels } from "@/lib/mock/purchase-orders";
import { businessPlaceOptions, buyerOptions } from "@/lib/mock/po-options";
import type { PurchaserRecord } from "@/types/purchaser";
import type {
  POBasicFormData,
  POSpecItemRow,
  POStatus,
} from "@/types/purchase";
import { MasterListGrid, type MasterListGridColumn } from "@/components/common/master-list-grid";
import { Plus, Trash2, Search, RotateCcw, Save, X, Send, FileDown } from "lucide-react";
import { getCommonCodes } from "@/lib/common-code-store";

// 공통코드 관리의 통화코드에서 동적으로 생성
function buildCurrencyOptions(): SelectOption[] {
  return getCommonCodes("currency").map((c) => ({
    value: c.code,
    label: `${c.code}  ${c.name}`,
    displayLabel: c.code,
  }));
}

// 공통코드 관리의 부가세율에서 동적으로 생성
function buildVatRateOptions(): SelectOption[] {
  return getCommonCodes("vatRate").map((c) => ({
    value: c.code,
    label: c.name,
  }));
}

// 공통코드 관리의 지급조건에서 동적으로 생성
function buildPaymentTermOptions(): SelectOption[] {
  return getCommonCodes("paymentTerm").map((c) => ({
    value: c.code,
    label: `${c.code}  ${c.name}`,
    displayLabel: c.name,
  }));
}

// 공통코드 관리의 지급형태에서 동적으로 생성
function buildPaymentFormOptions(): SelectOption[] {
  return getCommonCodes("paymentForm").map((c) => ({
    value: c.code,
    label: `${c.code}  ${c.name}`,
    displayLabel: c.name,
  }));
}

// 공통코드 관리의 수입구분에서 동적으로 생성
function buildImportTypeOptions(): SelectOption[] {
  return getCommonCodes("importType").map((c) => ({
    value: c.code,
    label: c.name,
  }));
}

// 공통코드 관리의 창고코드에서 동적으로 생성
function buildWarehouseOptions(): SelectOption[] {
  return getCommonCodes("warehouse").map((c) => ({
    value: c.code,
    label: `${c.code}  ${c.name}`,
    displayLabel: c.code,
  }));
}

function buildWarehouseLabelMap(): Record<string, string> {
  return getCommonCodes("warehouse").reduce(
    (acc, c) => { acc[c.code] = `${c.code}  ${c.name}`; return acc; },
    {} as Record<string, string>
  );
}

const statusOptions: SelectOption[] = (["draft", "approved", "issued"] as const).map(
  (v) => ({ value: v, label: poStatusLabels[v] })
);

const defaultBasicForm: POBasicFormData = {
  orderStatus: "draft",
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
  vatRate: "10",
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
  warehouse: "10",
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
};

/** 명세작업에서 선택할 수 있는 품목 마스터 (간단 버전) */
type ItemMaster = {
  itemCode: string;
  itemName: string;
  material?: string;
  spec?: string;
  unitPrice: number;
  supplierId: string;
};

/** 기본정보 등록 리스트 더미 10건 */
const initialBasicInfoListDummy: BasicInfoListItem[] = [
  { id: "dummy-1", orderNumber: "PO-2026-0001", orderStatus: "approved", supplierId: "sup-001", supplierName: "한국정밀기어", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-001", supplierContactPerson: "김대영", advancePayment: "", orderDate: "2026-03-01", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-2", orderNumber: "PO-2026-0002", orderStatus: "issued", supplierId: "sup-002", supplierName: "일본스틸코리아", currencyCode: "KRW", paymentType: "l/c", paymentTerms: "net60", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-002", supplierContactPerson: "다나카 히로시", advancePayment: "0", orderDate: "2026-03-02", vatRate: "10", importType: "import", businessPlace: "gimhae", packagingStatus: "파레트", inspectionCondition: "원료검사", deliveryCondition: "선적", otherCondition: "", notes: "긴급" },
  { id: "dummy-3", orderNumber: "PO-2026-0003", orderStatus: "draft", supplierId: "sup-003", supplierName: "대우베어링", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-035", buyerName: "이발주", supplierQuotationNo: "", supplierContactPerson: "박준혁", advancePayment: "", orderDate: "2026-03-05", vatRate: "0", importType: "domestic", businessPlace: "ulsan", packagingStatus: "", inspectionCondition: "", deliveryCondition: "", otherCondition: "", notes: "" },
  { id: "dummy-4", orderNumber: "PO-2026-0004", orderStatus: "approved", supplierId: "sup-004", supplierName: "독일오토파츠", currencyCode: "KRW", paymentType: "bill", paymentTerms: "net90", buyerCode: "2022-036", buyerName: "박담당", supplierQuotationNo: "QT-2026-004", supplierContactPerson: "Hans Mueller", advancePayment: "30", orderDate: "2026-03-06", vatRate: "10", importType: "import", businessPlace: "gimhae", packagingStatus: "목재케이스", inspectionCondition: "수입검사", deliveryCondition: "CIF", otherCondition: "", notes: "1차 납품" },
  { id: "dummy-5", orderNumber: "PO-2026-0005", orderStatus: "issued", supplierId: "sup-005", supplierName: "중국동력전자", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-005", supplierContactPerson: "王明", advancePayment: "", orderDate: "2026-02-28", vatRate: "10", importType: "import", businessPlace: "pyeongtaek", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "FOB", otherCondition: "", notes: "" },
  { id: "dummy-6", orderNumber: "PO-2026-0006", orderStatus: "issued", supplierId: "sup-006", supplierName: "현대캐스팅", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-006", supplierContactPerson: "이주영", advancePayment: "0", orderDate: "2026-02-20", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "파레트", inspectionCondition: "출하검사", deliveryCondition: "공장인도", otherCondition: "", notes: "종결" },
  { id: "dummy-7", orderNumber: "PO-2026-0007", orderStatus: "issued", supplierId: "sup-001", supplierName: "한국정밀기어", currencyCode: "KRW", paymentType: "credit", paymentTerms: "net60", buyerCode: "2022-035", buyerName: "이발주", supplierQuotationNo: "QT-2026-007", supplierContactPerson: "김대영", advancePayment: "", orderDate: "2026-03-08", vatRate: "10", importType: "domestic", businessPlace: "ulsan", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-8", orderNumber: "PO-2026-0008", orderStatus: "approved", supplierId: "sup-002", supplierName: "일본스틸코리아", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-036", buyerName: "박담당", supplierQuotationNo: "", supplierContactPerson: "다나카 히로시", advancePayment: "", orderDate: "2026-03-10", vatRate: "0", importType: "domestic", businessPlace: "gimhae", packagingStatus: "", inspectionCondition: "", deliveryCondition: "", otherCondition: "", notes: "시험발주" },
  { id: "dummy-9", orderNumber: "PO-2026-0009", orderStatus: "draft", supplierId: "sup-003", supplierName: "대우베어링", currencyCode: "KRW", paymentType: "transfer", paymentTerms: "net30", buyerCode: "2022-033", buyerName: "임정근", supplierQuotationNo: "QT-2026-009", supplierContactPerson: "박준혁", advancePayment: "", orderDate: "2026-03-12", vatRate: "10", importType: "domestic", businessPlace: "gimhae", packagingStatus: "박스", inspectionCondition: "수입검사", deliveryCondition: "공장인도", otherCondition: "", notes: "" },
  { id: "dummy-10", orderNumber: "PO-2026-0010", orderStatus: "approved", supplierId: "sup-004", supplierName: "독일오토파츠", currencyCode: "KRW", paymentType: "l/c", paymentTerms: "net90", buyerCode: "2022-034", buyerName: "김구매", supplierQuotationNo: "QT-2026-010", supplierContactPerson: "Hans Mueller", advancePayment: "20", orderDate: "2026-03-11", vatRate: "10", importType: "import", businessPlace: "pyeongtaek", packagingStatus: "목재케이스", inspectionCondition: "수입검사", deliveryCondition: "CIF", otherCondition: "", notes: "" },
];


export default function CreatePurchaseOrderPage() {
  const [activeTab, setActiveTab] = useState<"basic" | "spec">("basic");
  const [basicInfoList, setBasicInfoList] = useState<BasicInfoListItem[]>(initialBasicInfoListDummy);
  const [selectedBasicId, setSelectedBasicId] = useState<string | null>(null);

  // 왼쪽 리스트 컨테이너 높이 기반 동적 페이지 사이즈
  const listContentRef = useRef<HTMLDivElement>(null);
  const [listPageSize, setListPageSize] = useState(10);
  useEffect(() => {
    const el = listContentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      const rowH = 32;   // h-8 = 32px
      const headerH = 32; // 테이블 헤더 행
      const footerH = 44; // 페이지네이션 바
      const size = Math.max(5, Math.floor((h - headerH - footerH) / rowH));
      setListPageSize(size);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 공통코드에서 동적 생성
  const currencyOptions = useMemo(() => buildCurrencyOptions(), []);
  const vatRateOptions = useMemo(() => buildVatRateOptions(), []);
  const paymentTermOptions = useMemo(() => buildPaymentTermOptions(), []);
  const paymentFormOptions = useMemo(() => buildPaymentFormOptions(), []);
  const importTypeOptions = useMemo(() => buildImportTypeOptions(), []);
  const warehouseOptions = useMemo(() => buildWarehouseOptions(), []);
  const warehouseLabelMap = useMemo(() => buildWarehouseLabelMap(), []);

  const [itemMaster, setItemMaster] = useState<ItemMaster[]>([]);
  const [purchasers, setPurchasers] = useState<PurchaserRecord[]>([]);
  const [isPurchaserModalOpen, setIsPurchaserModalOpen] = useState(false);
  const [purchaserSearch, setPurchaserSearch] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeSpecRowIndex, setActiveSpecRowIndex] = useState(0);
  const [basicForm, setBasicForm] = useState<POBasicFormData>(defaultBasicForm);
  const [specItems, setSpecItems] = useState<POSpecItemRow[]>([getDefaultSpecRow()]);

  // 로그인 사용자를 구매 발주자 초기값으로 설정
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const matched = buyerOptions.find((b) => b.code === data.username);
        if (matched) {
          setBasicForm((prev) => ({
            ...prev,
            buyerCode: matched.code,
            buyerName: matched.name,
          }));
        } else {
          // buyerOptions에 없더라도 username을 코드로 표시
          setBasicForm((prev) => ({
            ...prev,
            buyerCode: data.username,
            buyerName: "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  // 구매처 DB 로드
  useEffect(() => {
    fetch("/api/purchasers")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const mapped: PurchaserRecord[] = data.items.map((x: Record<string, string>) => ({
          id: String(x.Id ?? ""),
          purchaserNo: x.PurchaserNo ?? "",
          purchaserName: x.PurchaserName ?? "",
          phoneNo: x.PhoneNo ?? "",
          faxNo: x.FaxNo ?? "",
          contactPerson: x.ContactPerson ?? "",
          contactDept: x.ContactDept ?? "",
          transactionType: x.TransactionType ?? "",
          representativeName: x.RepresentativeName ?? "",
          businessNo: x.BusinessNo ?? "",
          postalCode: x.PostalCode ?? "",
          address: x.Address ?? "",
          suspensionDate: x.SuspensionDate ?? "",
          suspensionReason: x.SuspensionReason ?? "",
          registrant: x.Registrant ?? "",
          modifier: x.Modifier ?? "",
          email: x.Email ?? "",
          businessTypeName: x.BusinessTypeName ?? "",
          businessItemName: x.BusinessItemName ?? "",
          mobileNo: x.MobileNo ?? "",
        }));
        setPurchasers(mapped);
      })
      .catch(() => {});
  }, []);

  // 품목 마스터 DB 로드
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ItemMaster[] = data.items.map((x: any) => ({
          supplierId: x.SupplierCode ?? "",
          itemCode: x.ItemNo ?? "",
          itemName: x.ItemName ?? "",
          material: x.Material ?? "",
          spec: x.Specification ?? "",
          unitPrice: Number(x.PurchaseUnitPrice ?? 0),
        }));
        setItemMaster(mapped);
      })
      .catch(() => {});
  }, []);

  const supplierOptions: SelectOption[] = suppliers.map((s) => ({
    value: s.id,
    label: `${s.id} ${s.name}`,
  }));
  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return buyerOptions;
    return buyerOptions.filter(
      (b) =>
        b.code.toLowerCase().includes(keyword) ||
        b.name.toLowerCase().includes(keyword)
    );
  }, [userSearch]);

  const filteredPurchasers: PurchaserRecord[] = useMemo(() => {
    const keyword = purchaserSearch.trim().toLowerCase();
    if (!keyword) return purchasers;
    return purchasers.filter(
      (p) =>
        p.purchaserNo.toLowerCase().includes(keyword) ||
        p.purchaserName.toLowerCase().includes(keyword)
    );
  }, [purchaserSearch]);

  // 현재 선택된 오더의 공급처 품목만 표시
  const supplierItems: ItemMaster[] = useMemo(() => {
    const sid = basicForm.supplierId;
    return sid ? itemMaster.filter((i) => i.supplierId === sid) : itemMaster;
  }, [basicForm.supplierId, itemMaster]);

  const filteredItems: ItemMaster[] = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    if (!keyword) return supplierItems;
    return supplierItems.filter(
      (i) =>
        i.itemCode.toLowerCase().includes(keyword) ||
        i.itemName.toLowerCase().includes(keyword)
    );
  }, [itemSearch, supplierItems]);

  const setBasic = (field: keyof POBasicFormData, value: string) => {
    setBasicForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "supplierId") {
        // 정확일치 → 숫자값 일치(1 == 00001) → 앞자리 일치 순으로 조회
        const trimmed = value.trim();
        const p =
          purchasers.find((x) => x.purchaserNo === trimmed) ??
          purchasers.find((x) => parseInt(x.purchaserNo, 10) === parseInt(trimmed, 10)) ??
          purchasers.find((x) => x.purchaserNo.startsWith(trimmed.padStart(5, "0")));
        next.supplierName = p?.purchaserName ?? "";
      }
      if (field === "supplierName") {
        // 구매처명 입력 시 정확일치 → 포함 순으로 supplierId 자동 조회
        const trimmed = value.trim();
        if (trimmed) {
          const p =
            purchasers.find((x) => x.purchaserName === trimmed) ??
            purchasers.find((x) => x.purchaserName.includes(trimmed));
          if (p) next.supplierId = p.purchaserNo;
        } else {
          next.supplierId = "";
        }
      }
      if (field === "buyerCode") {
        const b = buyerOptions.find((x) => x.code === value);
        next.buyerName = b?.name ?? "";
      }
      return next;
    });
  };

  const handleBasicFormReset = () => {
    setBasicForm((prev) => ({
      ...defaultBasicForm,
      buyerCode: prev.buyerCode,
      buyerName: prev.buyerName,
    }));
    setSelectedBasicId(null);
  };

  /** 오른쪽 폼에서 등록 클릭 시 리스트에 추가 */
  const handleRegisterBasicInfo = () => {
    const newId = `basic-${Date.now()}`;
    const orderNumber = `PO-${new Date().getFullYear()}-${String(basicInfoList.length + 1).padStart(4, "0")}`;
    const item: BasicInfoListItem = {
      ...basicForm,
      id: newId,
      orderNumber,
    };
    setBasicInfoList((prev) => [...prev, item]);
    setBasicForm((prev) => ({ ...defaultBasicForm, buyerCode: prev.buyerCode, buyerName: prev.buyerName }));
    setSelectedBasicId(newId);  // 등록 후 새 오더를 자동 선택
  };

  /** 왼쪽 리스트 행 클릭 시 오른쪽 폼에 로드 */
  const handleSelectBasicInfo = (row: BasicInfoListItem) => {
    setSelectedBasicId(row.id);
    const { id: _id, orderNumber: _on, ...formData } = row;
    setBasicForm(formData);
  };


  const basicListColumns: MasterListGridColumn<BasicInfoListItem>[] = [
    {
      key: "orderNumber",
      header: "오더번호",
      minWidth: 96,
      maxWidth: 104,
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
      minWidth: 64,
      maxWidth: 80,
      cell: (r) => (
        <span
          className="truncate block max-w-full"
          title={r.supplierName}
        >
          {r.supplierName}
        </span>
      ),
    },
    { key: "orderDate", header: "발주일자", minWidth: 68, maxWidth: 76 },
    {
      key: "buyerName",
      header: "발주자",
      minWidth: 40,
      maxWidth: 52,
      cell: (r) => (
        <span className="truncate block max-w-full" title={r.buyerName}>
          {r.buyerName}
        </span>
      ),
    },
    {
      key: "orderStatus",
      header: "상태",
      minWidth: 56,
      maxWidth: 72,
      cell: (r) => <POStatusBadge status={r.orderStatus} className="text-[10px] px-1.5 py-0" />,
    },
  ];

  const addSpecItem = () => {
    setSpecItems((prev) => {
      // 행이 1개이고 비어있으면 새 행 추가 없이 해당 행을 활성화
      if (prev.length === 1 && !prev[0].itemCode) {
        setActiveSpecRowIndex(0);
        return prev;
      }
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

  // 선택된 오더의 번호 (등록 전이면 빈 문자열)
  const selectedOrderNumber = useMemo(
    () => basicInfoList.find((r) => r.id === selectedBasicId)?.orderNumber ?? "",
    [basicInfoList, selectedBasicId]
  );

  const totalOrderAmount = specItems.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const vatAmount = Math.round(
    totalOrderAmount * (Number(basicForm.vatRate) || 0) / 100
  );
  const businessPlaceLabel =
    businessPlaceOptions.find((o) => o.value === basicForm.businessPlace)?.label ??
    basicForm.businessPlace;


  // --- 명세입력 버튼 동작 ---


  const handleBulkOpen = () => {
    if (!basicForm.supplierId) {
      window.alert("기본정보에서 구매처를 먼저 선택해 주세요.");
      return;
    }
    if (supplierItems.length === 0) {
      window.alert("선택된 구매처에 등록된 품목이 없습니다.");
      return;
    }
    const newRows: POSpecItemRow[] = supplierItems.map((i) => ({
      ...getDefaultSpecRow(),
      itemCode: i.itemCode,
      itemName: i.itemName,
      material: i.material ?? "",
      specification: i.spec ?? "",
      unitPrice: i.unitPrice,
      dueDate: basicForm.orderDate,
    }));
    setSpecItems((prev) => {
      const isEmpty = prev.length === 1 && !prev[0].itemCode;
      return isEmpty ? newRows : [...prev, ...newRows];
    });
    setActiveSpecRowIndex(0);
  };

  const handleSpecRegister = () => {
    if (specItems.length === 0 || !specItems.some((r) => r.itemCode)) {
      window.alert("등록할 명세가 없습니다. 품목을 먼저 추가해 주세요.");
      return;
    }

    let targetId = selectedBasicId;

    if (!targetId) {
      // 기본정보가 아직 등록되지 않은 경우 자동 등록
      const newId = `basic-${Date.now()}`;
      const orderNumber = `PO-${new Date().getFullYear()}-${String(basicInfoList.length + 1).padStart(4, "0")}`;
      const newItem: BasicInfoListItem = {
        ...basicForm,
        id: newId,
        orderNumber,
        orderStatus: "approved",
      };
      setBasicInfoList((prev) => [...prev, newItem]);
      setSelectedBasicId(newId);
      targetId = newId;
    } else {
      // 기존 기본정보 항목의 상태 및 내용 업데이트
      setBasicInfoList((prev) =>
        prev.map((row) =>
          row.id === targetId
            ? { ...row, ...basicForm, id: row.id, orderNumber: row.orderNumber, orderStatus: "approved" }
            : row
        )
      );
    }

    window.alert("명세가 등록되었습니다. (데모)");
  };

  const handlePoIssue = () => {
    if (!selectedBasicId) {
      window.alert("PO를 발행할 오더를 선택해 주세요.");
      return;
    }
    if (!specItems.some((r) => r.itemCode)) {
      window.alert("명세 품목이 없습니다. 품목을 먼저 등록해 주세요.");
      return;
    }

    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) {
      window.alert("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.");
      return;
    }

    // 발행 확정 콜백을 opener에 등록
    (window as Window & { __poIssueConfirm?: () => void }).__poIssueConfirm = () => {
      setBasicInfoList((prev) =>
        prev.map((row) =>
          row.id === selectedBasicId ? { ...row, orderStatus: "issued" } : row
        )
      );
    };

    const labelOf = (options: SelectOption[], val: string) =>
      options.find((o) => o.value === val)?.displayLabel ??
      options.find((o) => o.value === val)?.label ?? val;

    const filledSpec = specItems.filter((r) => r.itemCode);
    const totalQty = filledSpec.reduce((s, r) => s + r.quantity, 0);
    const supply = totalOrderAmount;
    const vat = vatAmount;
    const total = supply + vat;
    const EMPTY_ROWS = Math.max(0, 30 - filledSpec.length);

    const B = "1px solid #000";
    const G = "background-color:#c6efce;";
    const Y = "background-color:#ffffc0;";
    const td = (style: string, content: string, extra = "") =>
      `<td style="${style}" ${extra}>${content}</td>`;
    const th = (style: string, content: string) =>
      `<th style="${G}${style}">${content}</th>`;

    const recipient = {
      companyName: "진양오토모티브(주) 김해공장",
      representative: "김상용",
      address: "경상남도 김해시 진영읍 서부로179번길",
      tel: "055-345-2100",
      fax: "055-342-4110",
    };

    const purchaserRecord = purchasers.find((p) => p.purchaserNo === basicForm.supplierId);

    win.document.write(`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>구매발주서 - ${selectedOrderNumber}</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic","맑은 고딕",sans-serif; font-size: 10px; color:#000; padding:8mm 10mm; }
  table { border-collapse: collapse; width: 100%; }
  .btn-bar { text-align:right; margin-bottom:6px; display:flex; gap:6px; justify-content:flex-end; }
  .btn-bar button { padding:4px 16px; font-size:11px; cursor:pointer; }
  .btn-confirm { background:#1d4ed8; color:#fff; border:none; border-radius:3px; }
  .btn-print  { background:#fff; border:1px solid #999; border-radius:3px; }
  @media print { .btn-bar { display:none; } }
</style>
</head><body>

<div class="btn-bar">
  <button class="btn-confirm" onclick="window.opener && window.opener.__poIssueConfirm && window.opener.__poIssueConfirm(); this.textContent='발행 완료'; this.disabled=true;">발행 확정</button>
  <button class="btn-print" onclick="window.print()">인 쇄</button>
</div>

<!-- 제목 + 발주번호 -->
<table style="border:${B};margin-bottom:0;">
  <tr>
    <td colspan="4" style="text-align:center;font-size:22px;font-weight:700;letter-spacing:0.5em;padding:8px 6px;border-bottom:${B};">구 매 발 주 서</td>
  </tr>
  <tr>
    ${td(`padding:3px 6px;width:26%;`, "발주번호 : " + selectedOrderNumber)}
    ${td(`padding:3px 6px;width:30%;`, "발주일자 : " + basicForm.orderDate)}
    ${td(`padding:3px 6px;width:36%;`, "사업장 : " + businessPlaceLabel)}
    ${td(`padding:3px 6px;width:8%;text-align:right;`, "Page : 1/1")}
  </tr>
</table>

<!-- 공급받는자 / 공급자 -->
<table style="margin-top:0;border:${B};">
  <colgroup>
    <col style="width:16px;"><col style="width:48px;"><col style="width:calc(50% - 64px);">
    <col style="width:16px;"><col style="width:48px;"><col>
  </colgroup>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.companyName}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-bottom:${B};padding:2px 6px;">${basicForm.supplierName}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.representative}&nbsp;(인)</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-bottom:${B};padding:2px 6px;">${purchaserRecord?.representativeName || ""}&nbsp;&nbsp;구매처 번호 : ${basicForm.supplierId}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">받</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.address}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-bottom:${B};padding:2px 6px;">${purchaserRecord?.address || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">는</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.tel}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-bottom:${B};padding:2px 6px;">${purchaserRecord?.phoneNo || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="border-right:${B};padding:2px 6px;">${recipient.fax}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="padding:2px 6px;">${purchaserRecord?.faxNo || ""}</td>
  </tr>
</table>

<!-- 발주조건 -->
<table style="margin-top:0;border:${B};">
  <tr>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">통화</td>
    <td style="border:${B};padding:2px 6px;width:10%;">${labelOf(currencyOptions, basicForm.currencyCode)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:12%;">대금지급형태</td>
    <td style="border:${B};padding:2px 6px;width:12%;">${labelOf(paymentFormOptions, basicForm.paymentType)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:12%;">대금지급조건</td>
    <td style="border:${B};padding:2px 6px;width:12%;">${labelOf(paymentTermOptions, basicForm.paymentTerms)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">부가세율</td>
    <td style="border:${B};padding:2px 6px;width:8%;">${basicForm.vatRate}%</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">수입구분</td>
    <td style="border:${B};padding:2px 6px;">${labelOf(importTypeOptions, basicForm.importType)}</td>
  </tr>
</table>

<!-- 품목 테이블 -->
<table style="margin-top:0;">
  <thead>
    <tr>
      ${th("border:" + B + ";padding:3px 2px;text-align:center;width:4%;", "순서")}
      ${th("border:" + B + ";padding:3px 4px;width:13%;", "품목번호")}
      ${th("border:" + B + ";padding:3px 4px;width:18%;", "품명")}
      ${th("border:" + B + ";padding:3px 4px;width:10%;", "재질")}
      ${th("border:" + B + ";padding:3px 4px;width:10%;", "규격")}
      ${th("border:" + B + ";padding:3px 4px;width:13%;", "납품요구일자")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:8%;", "수량")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:10%;", "단가")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:12%;", "금액")}
      ${th("border:" + B + ";padding:3px 4px;width:6%;", "단위")}
    </tr>
  </thead>
  <tbody>
    ${filledSpec.map((row, idx) => `
    <tr style="height:19px;">
      ${td(`border:${B};padding:2px 2px;text-align:center;`, String(idx + 1))}
      ${td(`border:${B};padding:3px 4px;`, row.itemCode)}
      ${td(`border:${B};padding:3px 4px;`, row.itemName)}
      ${td(`border:${B};padding:3px 4px;`, row.material || "")}
      ${td(`border:${B};padding:3px 4px;`, row.specification || "")}
      ${td(`border:${B};padding:3px 4px;`, row.dueDate || "")}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, row.quantity.toLocaleString("ko-KR"))}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, row.unitPrice.toLocaleString("ko-KR"))}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, (row.amount ?? 0).toLocaleString("ko-KR"))}
      ${td(`border:${B};padding:3px 4px;text-align:center;`, "EA")}
    </tr>`).join("")}
    ${Array.from({ length: EMPTY_ROWS }, () => `
    <tr style="height:19px;">
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td>
    </tr>`).join("")}
  </tbody>
</table>

<!-- 합계 행 -->
<table style="margin-top:0;">
  <tr>
    <td style="${Y}border:${B};padding:3px 4px;text-align:left;width:4%;">${filledSpec.length} 건</td>
    <td style="${Y}border:${B};padding:3px 10px;text-align:left;width:13%;">** 합 계 **</td>
    <td style="${Y}border:${B};padding:3px 4px;width:18%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:10%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:10%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:13%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;width:8%;">${totalQty.toLocaleString("ko-KR")}</td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;width:10%;">${supply.toLocaleString("ko-KR")}</td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;font-weight:700;width:12%;">${total.toLocaleString("ko-KR")}</td>
    <td style="${Y}border:${B};padding:3px 4px;width:6%;"></td>
  </tr>
</table>

<!-- 공급가액/부가세/합계 -->
<table style="margin-top:0;border:${B};">
  <tr>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;">공급가액</td>
    <td style="border:${B};padding:3px 6px;width:20%;text-align:right;">${supply.toLocaleString("ko-KR")} 원</td>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;">부가세 (${basicForm.vatRate}%)</td>
    <td style="border:${B};padding:3px 6px;width:20%;text-align:right;">${vat.toLocaleString("ko-KR")} 원</td>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;font-weight:700;">합계금액</td>
    <td style="border:${B};padding:3px 6px;font-weight:700;text-align:right;">${total.toLocaleString("ko-KR")} 원</td>
  </tr>
</table>

<!-- 결재란 -->
<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:${B};padding:0;width:70%;height:58px;"></td>
    <td style="border:${B};padding:0;width:4%;vertical-align:middle;text-align:center;">
      <span style="writing-mode:vertical-rl;font-size:10px;letter-spacing:0.4em;font-weight:600;">결재</span>
    </td>
    <td style="border:${B};padding:0;width:26%;vertical-align:top;">
      <table style="width:100%;height:100%;border-collapse:collapse;">
        <tr>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">작 성</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">검 토</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">확 인</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">승 인</td>
        </tr>
        <tr>
          <td style="border:${B};height:42px;"></td>
          <td style="border:${B};"></td>
          <td style="border:${B};"></td>
          <td style="border:${B};"></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- 발주담당자 -->
<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:${B};padding:5px 20px;text-align:center;font-size:10px;">
      발주담당자 &nbsp;:&nbsp; ${basicForm.buyerName} (${basicForm.buyerCode})
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      구매처견적번호 &nbsp;:&nbsp; ${basicForm.supplierQuotationNo || "-"}
    </td>
  </tr>
</table>

</body></html>`);
    win.document.close();
  };


  const fieldLabelClass = "bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground";
  const reqInputClass = "h-8 text-xs bg-blue-50 border-blue-200";

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 7rem)" }}>
      <PageHeader
        title="구매오더 관리"
        description="기본정보 등록 후 명세작업 탭에서 품목을 입력합니다."
      />

      {/* 왼쪽 리스트 + 오른쪽 탭 (항상 함께 표시) */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽: 오더 리스트 (항상 표시) */}
        <Card className="w-[472px] shrink-0 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <h2 className="text-base font-semibold">기본정보 등록 리스트</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              오더를 선택하면 오른쪽에서 수정할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 min-w-0 p-0 overflow-hidden">
            <div ref={listContentRef} className="h-full overflow-x-hidden overflow-y-auto">
              <MasterListGrid<BasicInfoListItem>
                columns={basicListColumns}
                data={basicInfoList}
                keyExtractor={(row) => row.id}
                onRowClick={handleSelectBasicInfo}
                getRowClassName={(row) => (selectedBasicId === row.id ? "bg-sky-50" : "")}
                maxHeight="100%"
                noHorizontalScroll
                pageSize={listPageSize}
                emptyMessage="등록된 기본정보가 없습니다. 오른쪽에서 등록해 주세요."
                className="min-w-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 탭(기본정보 | 명세작업) */}
        <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "basic" | "spec")} className="flex flex-col flex-1 min-h-0">
            <CardHeader className="border-b bg-muted/30 py-3">
              <div className="flex items-center justify-between gap-2">
                <TabsList className="h-8">
                  <TabsTrigger value="basic" className="text-sm px-4">기본정보</TabsTrigger>
                  <TabsTrigger value="spec" className="text-sm px-4">명세작업</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  {activeTab === "basic" && (
                    <>
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => {
                          setBasicForm((prev) => ({ ...defaultBasicForm, buyerCode: prev.buyerCode, buyerName: prev.buyerName }));
                          setSelectedBasicId(null);
                          setSpecItems([getDefaultSpecRow()]);
                        }}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <Plus className="mr-1.5 h-4 w-4 shrink-0" />신규작성
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleBasicFormReset}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />초기화
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleRegisterBasicInfo}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <Save className="mr-1.5 h-4 w-4 shrink-0" />등록
                      </Button>
                    </>
                  )}
                  {activeTab === "spec" && (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSpecItems([getDefaultSpecRow()])}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />초기화
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleSpecRegister}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <Save className="mr-1.5 h-4 w-4 shrink-0" />등록
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleBulkOpen}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <FileDown className="mr-1.5 h-4 w-4 shrink-0" />일괄등록
                      </Button>

                      <Button type="button" variant="outline" size="sm" onClick={handlePoIssue}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <Send className="mr-1.5 h-4 w-4 shrink-0" />PO발행
                      </Button>
                    </>
                  )}
                  <Link href="/purchase-orders">
                    <Button type="button" variant="outline" size="sm"
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                      <X className="mr-1.5 h-4 w-4 shrink-0" />닫기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            {/* 기본정보 탭 */}
            <TabsContent value="basic" className="flex-1 min-h-0 overflow-auto m-0 data-[state=inactive]:hidden">
              <CardContent className="p-4">
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* 왼쪽 컬럼 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[100px_1fr_80px] gap-1 items-center">
                    <Label className={fieldLabelClass}>오더번호/상태</Label>
                    <Input
                      value={selectedOrderNumber}
                      readOnly
                      className="h-8 text-xs bg-muted/50"
                      placeholder="등록 후 자동생성"
                    />
                    <div className="flex h-8 items-center justify-center">
                      <POStatusBadge status={basicForm.orderStatus} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_minmax(0,0.5fr)_minmax(0,0.5fr)_40px] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처번호</Label>
                    <Input
                      value={basicForm.supplierId}
                      onChange={(e) => setBasic("supplierId", e.target.value)}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && /^\d+$/.test(v)) {
                          setBasic("supplierId", v.padStart(5, "0"));
                        }
                      }}
                      className={reqInputClass}
                      placeholder="구매처 CODE 직접입력"
                    />
                    <Input
                      value={basicForm.supplierName}
                      onChange={(e) => setBasic("supplierName", e.target.value)}
                      className="h-8 text-xs bg-blue-50 border-blue-200"
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
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>통화코드</Label>
                    <Select
                      options={currencyOptions}
                      value={basicForm.currencyCode}
                      onChange={(v) => setBasic("currencyCode", v)}
                      placeholder="선택"
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급형태</Label>
                    <Select
                      options={paymentFormOptions}
                      value={basicForm.paymentType}
                      onChange={(v) => setBasic("paymentType", v)}
                      placeholder="선택"
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급조건</Label>
                    <Select
                      options={paymentTermOptions}
                      value={basicForm.paymentTerms}
                      onChange={(v) => setBasic("paymentTerms", v)}
                      placeholder="선택"
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매 발주자</Label>
                    <div className="flex gap-1">
                      <Input
                        value={basicForm.buyerCode}
                        onChange={(e) => setBasic("buyerCode", e.target.value)}
                        className={`${reqInputClass} flex-1`}
                        placeholder="사용자코드"
                      />
                      <Input
                        value={basicForm.buyerName}
                        readOnly
                        className="h-8 w-28 text-xs bg-blue-50 border-blue-200"
                        placeholder="이름"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setIsUserModalOpen(true)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처견적번호</Label>
                    <Input
                      value={basicForm.supplierQuotationNo}
                      onChange={(e) => setBasic("supplierQuotationNo", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>구매처담당자</Label>
                    <Input
                      value={basicForm.supplierContactPerson}
                      onChange={(e) => setBasic("supplierContactPerson", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>선급금</Label>
                    <Input
                      value={basicForm.advancePayment}
                      onChange={(e) => setBasic("advancePayment", e.target.value)}
                      className="h-8 text-xs"
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
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>발주일자</Label>
                    <Input
                      type="date"
                      value={basicForm.orderDate}
                      onChange={(e) => setBasic("orderDate", e.target.value)}
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>부가세율</Label>
                    <Select
                      options={vatRateOptions}
                      value={basicForm.vatRate}
                      onChange={(v) => setBasic("vatRate", v)}
                      placeholder="선택"
                      className={reqInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>수입구분</Label>
                    <Select
                      options={importTypeOptions}
                      value={basicForm.importType}
                      onChange={(v) => setBasic("importType", v)}
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>포장상태</Label>
                    <Input
                      value={basicForm.packagingStatus}
                      onChange={(e) => setBasic("packagingStatus", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>검사조건</Label>
                    <Input
                      value={basicForm.inspectionCondition}
                      onChange={(e) => setBasic("inspectionCondition", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>납기조건</Label>
                    <Input
                      value={basicForm.deliveryCondition}
                      onChange={(e) => setBasic("deliveryCondition", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>기타조건</Label>
                    <Input
                      value={basicForm.otherCondition}
                      onChange={(e) => setBasic("otherCondition", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-start">
                    <Label className={fieldLabelClass}>비고</Label>
                    <Textarea
                      value={basicForm.notes}
                      onChange={(e) => setBasic("notes", e.target.value)}
                      className="min-h-[60px] text-xs resize-none"
                      placeholder="비고"
                    />
                  </div>
                </div>
              </div>
              </CardContent>
            </TabsContent>

            {/* 명세작업 탭 */}
            <TabsContent value="spec" className="flex-1 min-h-0 overflow-auto m-0 data-[state=inactive]:hidden">
              {/* 요약 정보 바 */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <span>구매처 <strong className="text-foreground">{basicForm.supplierId || "-"} {basicForm.supplierName}</strong></span>
                <span>발주일 <strong className="text-foreground">{basicForm.orderDate}</strong></span>
                <span>통화 <strong className="text-foreground">{basicForm.currencyCode}</strong></span>
                <span>상태 <strong className="text-foreground">{poStatusLabels[basicForm.orderStatus as POStatus]}</strong></span>
                <span>총발주금액 <strong className="text-foreground">{formatCurrency(totalOrderAmount)}</strong></span>
                <span>부가세액 <strong className="text-foreground">{formatCurrency(vatAmount)}</strong></span>
                <span>사업장 <strong className="text-foreground">{businessPlaceLabel}</strong></span>
              </div>
              <CardContent className="p-4 space-y-4">
              {/* 품목 행 편집 테이블 */}
              <div className="flex items-center gap-2 mb-1">
                <Button type="button" variant="outline" size="sm" onClick={() => { addSpecItem(); setIsItemModalOpen(true); }} className="text-xs h-7">
                  <Plus className="mr-1.5 h-3 w-3" />
                  품목 추가
                </Button>
              </div>
              <div className="rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-1.5 w-12 whitespace-nowrap text-center">명세번호</th>
                      <th className="px-2 py-1.5 w-24 text-center">품목번호</th>
                      <th className="px-2 py-1.5 w-40 text-center">품목명</th>
                      <th className="px-2 py-1.5 w-20 text-center">규격</th>
                      <th className="px-2 py-1.5 w-12 text-center">창고선택</th>
                      <th className="px-2 py-1.5 w-14 text-center">발주량</th>
                      <th className="px-2 py-1.5 w-16 text-center">구매단가</th>
                      <th className="px-2 py-1.5 w-16 text-center">발주금액</th>
                      <th className="px-2 py-1.5 w-8 text-center whitespace-nowrap">가단가</th>
                      <th className="px-2 py-1.5 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {specItems.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-2 py-1 text-center">{index + 1}</td>
                        <td className="px-1 py-1 w-24">
                          <Input
                            value={row.itemCode}
                            onChange={(e) => updateSpecItem(index, "itemCode", e.target.value)}
                            className="h-6 w-full text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1 w-40">
                          <Input
                            value={row.itemName}
                            onChange={(e) => updateSpecItem(index, "itemName", e.target.value)}
                            className="h-6 w-full text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={row.specification ?? ""}
                            onChange={(e) => updateSpecItem(index, "specification", e.target.value)}
                            className="h-6 text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1 bg-amber-50 border-l border-amber-200">
                          <Select
                            options={warehouseOptions}
                            value={row.warehouse ?? ""}
                            onChange={(v) => updateSpecItem(index, "warehouse", v)}
                            placeholder=""
                            className="h-6 text-xs w-12"
                          />
                        </td>
                        <td className="px-1 py-1 bg-amber-50 border-l border-r border-amber-200">
                          <Input
                            inputMode="numeric"
                            value={row.quantity ? row.quantity.toLocaleString("ko-KR") : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              updateSpecItem(index, "quantity", Number(val) || 0);
                            }}
                            className="h-6 w-14 text-xs text-right px-1"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            inputMode="numeric"
                            value={row.unitPrice ? row.unitPrice.toLocaleString("ko-KR") : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              updateSpecItem(index, "unitPrice", Number(val) || 0);
                            }}
                            className="h-6 w-16 text-xs text-right px-1"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.amount ?? 0)}
                        </td>
                        <td className="px-1 py-1 bg-amber-50 border-l border-r border-amber-200">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={row.isProvisionalPrice ?? false}
                              onChange={(e) => updateSpecItem(index, "isProvisionalPrice", e.target.checked)}
                              className="rounded"
                            />
                          </div>
                        </td>
                        <td className="px-1 py-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeSpecItem(index)}
                            disabled={specItems.length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

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
                className="h-8 text-xs"
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
              <table className="w-full text-xs">
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

      {isUserModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">발주자 선택</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setIsUserModalOpen(false); setUserSearch(""); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3 flex gap-2">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="사용자코드 또는 이름 검색"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUserSearch("")}
              >
                초기화
              </Button>
            </div>
            <div className="max-h-[320px] overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">사용자코드</th>
                    <th className="px-3 py-2 text-left">이름</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((b) => (
                    <tr
                      key={b.code}
                      className="cursor-pointer border-t hover:bg-slate-50"
                      onClick={() => {
                        setBasic("buyerCode", b.code);
                        setIsUserModalOpen(false);
                        setUserSearch("");
                      }}
                    >
                      <td className="px-3 py-1.5">{b.code}</td>
                      <td className="px-3 py-1.5">{b.name}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-4 text-center text-xs text-muted-foreground"
                      >
                        조건에 맞는 사용자가 없습니다.
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
                className="h-8 text-xs"
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
              <table className="w-full text-xs">
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
