"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, type SelectOption } from "@/components/ui/select";
import { POStatusBadge } from "@/components/common/status-badge";
import { formatCurrency } from "@/lib/utils";
import { suppliers } from "@/lib/mock/suppliers";
import { poStatusLabels } from "@/lib/mock/purchase-orders";
import type { PurchaserRecord } from "@/types/purchaser";
import type {
  POBasicFormData,
  POSpecItemRow,
  POStatus,
} from "@/types/purchase";
import { MasterListGrid, type MasterListGridColumn } from "@/components/common/master-list-grid";
import { SearchPopup } from "@/components/common/search-popup";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { Sheet, SheetContent, SheetHeader as SheetHdr, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search, RotateCcw, Save, X, Send, FileDown, Copy, Clipboard } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import { apiPath } from "@/lib/api-path";

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
  businessPlace: "",
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
  storageLocation: "",
  model: "",
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
  model?: string;
  warehouse?: string;
  storageLocation?: string;
  unitPrice: number;
  supplierId: string;
};



export default function CreatePurchaseOrderPage() {
  const [activeTab, setActiveTab] = useCachedState<"basic" | "spec">("po-create/activeTab", "basic");
  const [basicInfoList, setBasicInfoList] = useCachedState<BasicInfoListItem[]>("po-create/basicInfoList", []);
  const [selectedBasicId, setSelectedBasicId] = useCachedState<string | null>("po-create/selectedBasicId", null);
  const [isFormActive, setIsFormActive] = useCachedState<boolean>("po-create/isFormActive", false);
  const [errors, setErrors] = useState<Partial<Record<keyof POBasicFormData, string>>>({});
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");
  const [stripedRows, setStripedRows] = useState(true);

  const listContentRef = useRef<HTMLDivElement>(null);
  // 공통코드에서 동적 생성
  const [currencyOptions,   setCurrencyOptions]   = useState<SelectOption[]>([]);
  const [vatRateOptions,    setVatRateOptions]    = useState<SelectOption[]>([]);
  const [paymentTermOptions,setPaymentTermOptions]= useState<SelectOption[]>([]);
  const [paymentFormOptions,setPaymentFormOptions]= useState<SelectOption[]>([]);
  const [importTypeOptions, setImportTypeOptions] = useState<SelectOption[]>([]);
  const [warehouseOptions,  setWarehouseOptions]  = useState<SelectOption[]>([]);
  const [warehouseLabelMap, setWarehouseLabelMap] = useState<Record<string, string>>({});
  const [factoryOptions, setFactoryOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const cats = ["currency","vatRate","paymentTerm","paymentForm","importType","warehouse"];
    Promise.all(cats.map((cat) => fetch(apiPath(`/api/common-codes?category=${cat}`)).then((r) => r.json())))
      .then(([cur, vat, pTerm, pForm, imp, wh]) => {
        type C = { Code: string; Name: string };
        if (cur.ok)   setCurrencyOptions(cur.items.map((c: C) => ({ value: c.Code, label: `${c.Code}  ${c.Name}`, displayLabel: c.Code })));
        if (vat.ok)   setVatRateOptions(vat.items.map((c: C) => ({ value: c.Code, label: c.Name })));
        if (pTerm.ok) setPaymentTermOptions(pTerm.items.map((c: C) => ({ value: c.Code, label: `${c.Code}  ${c.Name}`, displayLabel: c.Name })));
        if (pForm.ok) setPaymentFormOptions(pForm.items.map((c: C) => ({ value: c.Code, label: `${c.Code}  ${c.Name}`, displayLabel: c.Name })));
        if (imp.ok)   setImportTypeOptions(imp.items.map((c: C) => ({ value: c.Code, label: c.Name })));
        if (wh.ok) {
          setWarehouseOptions(wh.items.map((c: C) => ({ value: c.Code, label: `${c.Code}  ${c.Name}`, displayLabel: c.Code })));
          setWarehouseLabelMap(Object.fromEntries(wh.items.map((c: C) => [c.Code, `${c.Code}  ${c.Name}`])));
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(apiPath("/api/factories"))
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setFactoryOptions(
            data.factories.map((f: { FactoryCode: string; FactoryName: string }) => ({
              value: f.FactoryCode,
              label: `${f.FactoryCode} ${f.FactoryName}`,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const [itemMaster, setItemMaster] = useState<ItemMaster[]>([]);
  const [purchasers, setPurchasers] = useState<PurchaserRecord[]>([]);
  const [isPurchaserPopupOpen, setIsPurchaserPopupOpen] = useState(false);
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buyerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemSupplierDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemSupplierInputRef = useRef<HTMLInputElement>(null);
  const itemModelInputRef = useRef<HTMLInputElement>(null);
  const itemSearchInputRef = useRef<HTMLInputElement>(null);
  const loginBuyerRef = useRef<{ buyerCode: string; buyerName: string }>({ buyerCode: "", buyerName: "" });
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemFilterModel, setItemFilterModel] = useState("");
  const [itemFilterSupplierId, setItemFilterSupplierId] = useState("");
  const [itemFilterSupplierName, setItemFilterSupplierName] = useState("");
  const [isModelPopupOpen, setIsModelPopupOpen] = useState(false);
  const [isItemSupplierPopupOpen, setIsItemSupplierPopupOpen] = useState(false);
  const [modelSubSearch, setModelSubSearch] = useState("");
  const [supplierSubSearch, setSupplierSubSearch] = useState("");
  const [supplierHighlightIdx, setSupplierHighlightIdx] = useState(-1);
  const [modelHighlightIdx, setModelHighlightIdx] = useState(-1);
  const supplierHighlightRef = useRef<HTMLTableRowElement>(null);
  const modelHighlightRef = useRef<HTMLTableRowElement>(null);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [priceItemCodes, setPriceItemCodes] = useState<Set<string>>(new Set());
  const [itemHighlightIdx, setItemHighlightIdx] = useState(-1);
  const itemListScrollRef = useRef<HTMLDivElement>(null);
  const warehouseSelectRefs = useRef<(HTMLSelectElement | null)[]>([]);
  const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dueDateInputRefs  = useRef<(HTMLInputElement | null)[]>([]);
  const itemCodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeSpecRowIndex, setActiveSpecRowIndex] = useState(0);
  const [basicForm, setBasicForm] = useCachedState<POBasicFormData>("po-create/basicForm", defaultBasicForm);
  const [specItems, setSpecItems] = useCachedState<POSpecItemRow[]>("po-create/specItems", [getDefaultSpecRow()]);
  const [notifyModal, setNotifyModal] = useState<{ open: boolean; title: string; message: string } | null>(null);
  const [copyModal, setCopyModal] = useState<{ open: boolean; orderDate: string } | null>(null);
  const [copying, setCopying] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void } | null>(null);
  const [pasteModal, setPasteModal] = useState<{ open: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!notifyModal?.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setNotifyModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notifyModal?.open]);

  // 구매오더 목록 로드
  const loadBasicInfoList = () => {
    fetch(apiPath("/api/purchase-orders"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const list: BasicInfoListItem[] = data.items.map((r: Record<string, unknown>) => ({
          id:                   String(r.id),
          orderNumber:          String(r.orderNumber),
          orderStatus:          r.orderStatus as POStatus,
          supplierId:           String(r.supplierId ?? ""),
          supplierName:         String(r.supplierName ?? ""),
          currencyCode:         String(r.currencyCode ?? ""),
          paymentType:          String(r.paymentType ?? ""),
          paymentTerms:         String(r.paymentTerms ?? ""),
          buyerCode:            String(r.buyerCode ?? ""),
          buyerName:            String(r.buyerName ?? ""),
          supplierQuotationNo:  String(r.supplierQuotationNo ?? ""),
          supplierContactPerson:String(r.supplierContactPerson ?? ""),
          advancePayment:       String(r.advancePayment ?? ""),
          orderDate:            String(r.orderDate ?? ""),
          vatRate:              String(r.vatRate ?? ""),
          importType:           String(r.importType ?? ""),
          businessPlace:        String(r.businessPlace ?? ""),
          packagingStatus:      String(r.packagingStatus ?? ""),
          inspectionCondition:  String(r.inspectionCondition ?? ""),
          deliveryCondition:    String(r.deliveryCondition ?? ""),
          otherCondition:       String(r.otherCondition ?? ""),
          notes:                String(r.notes ?? ""),
        }));
        list.sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
        setBasicInfoList(list);
      })
      .catch(() => {});
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (basicInfoList.length > 0) return; loadBasicInfoList(); }, []);

  // 로그인 사용자를 구매 발주자 초기값으로 설정
  useEffect(() => {
    fetch(apiPath("/api/auth/me"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const buyerCode = data.username ?? "";
        const buyerName = data.userId ?? data.username ?? "";
        loginBuyerRef.current = { buyerCode, buyerName };
        setBasicForm((prev) => ({
          ...prev,
          buyerCode,
          buyerName,
          businessPlace: data.factory || prev.businessPlace,
        }));
      })
      .catch(() => {});
  }, []);

  // 구매처 DB 로드
  useEffect(() => {
    fetch(apiPath("/api/purchasers"))
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
    fetch(apiPath("/api/items"))
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
          model: x.VehicleModel ?? "",
          warehouse: x.Warehouse ?? "",
          storageLocation: x.StorageLocation ?? "",
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
  // 품목 모달 열릴 때 해당 구매처 단가 목록 로드
  useEffect(() => {
    if (isItemModalOpen) setTimeout(() => itemSearchInputRef.current?.focus(), 0);
  }, [isItemModalOpen]);

  useEffect(() => {
    if (!isItemModalOpen) return;
    fetch(apiPath("/api/purchase-prices"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const supplierName = basicForm.supplierName.trim().toLowerCase();
        const codes = new Set<string>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.items as any[])
            .filter((p) => (p.supplierName ?? "").trim().toLowerCase() === supplierName)
            .map((p) => String(p.itemCode))
        );
        setPriceItemCodes(codes);
      })
      .catch(() => {});
  }, [isItemModalOpen, basicForm.supplierName]);

  const distinctModels = useMemo(() => {
    const s = new Set<string>();
    itemMaster.forEach((i) => { if (i.model) s.add(i.model.toUpperCase()); });
    return Array.from(s).sort();
  }, [itemMaster]);

  const filteredPurchasersForPopup = useMemo(() => {
    const kw = supplierSubSearch.trim().toLowerCase();
    if (!kw) return purchasers;
    return purchasers.filter((p) =>
      p.purchaserNo.toLowerCase().includes(kw) || p.purchaserName.toLowerCase().includes(kw)
    );
  }, [supplierSubSearch, purchasers]);

  const filteredModelsForPopup = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return distinctModels;
    return distinctModels.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, distinctModels]);

  useEffect(() => {
    supplierHighlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [supplierHighlightIdx]);

  useEffect(() => {
    modelHighlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [modelHighlightIdx]);

  const filteredItems: ItemMaster[] = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    const modelKw = itemFilterModel.trim().toLowerCase();
    const supplierKw = itemFilterSupplierId.trim().toLowerCase();
    return itemMaster.filter((i) => {
      if (onlyWithPrice && !priceItemCodes.has(i.itemCode)) return false;
      if (keyword && !i.itemCode.toLowerCase().includes(keyword) && !i.itemName.toLowerCase().includes(keyword)) return false;
      if (modelKw && !(i.model ?? "").toLowerCase().includes(modelKw)) return false;
      if (supplierKw && !i.supplierId.toLowerCase().includes(supplierKw)) return false;
      return true;
    });
  }, [itemSearch, itemFilterModel, itemFilterSupplierId, onlyWithPrice, priceItemCodes, itemMaster]);

  useEffect(() => { setItemHighlightIdx(-1); }, [filteredItems]);

  const itemVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => itemListScrollRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  useEffect(() => {
    if (itemHighlightIdx >= 0) {
      itemVirtualizer.scrollToIndex(itemHighlightIdx, { align: "auto" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemHighlightIdx]);

  const setBasic = (field: keyof POBasicFormData, value: string) => {
    setBasicForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBasicFormReset = () => {
    setBasicForm((prev) => ({
      ...defaultBasicForm,
      ...loginBuyerRef.current,
      businessPlace: prev.businessPlace,
    }));
    setSelectedBasicId(null);
    setErrors({});
  };

  /** 오른쪽 폼에서 등록 클릭 시 DB에 저장 */
  const handleCopyConfirm = async () => {
    if (!copyModal || !selectedBasicId) return;
    setCopying(true);
    try {
      const copyRes = await fetch(apiPath("/api/purchase-orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basicForm,
          orderDate: copyModal.orderDate || basicForm.orderDate,
          orderStatus: "draft",
          items: specItems,
        }),
      });
      const copyData = await copyRes.json();
      if (!copyData.ok) { window.alert(copyData.message || "복사 실패"); return; }
      setCopyModal(null);
      await loadBasicInfoList();
      const newId = String(copyData.id);
      setSelectedBasicId(newId);
      setIsFormActive(true);
      const detailRes = await fetch(apiPath(`/api/purchase-orders/${newId}`));
      const detailData = await detailRes.json();
      if (detailData.ok) {
        setBasicForm(detailData.data.basicForm);
        setSpecItems(detailData.data.specItems.length > 0 ? detailData.data.specItems : [getDefaultSpecRow()]);
      }
    } catch {
      window.alert("복사 중 오류가 발생했습니다.");
    } finally {
      setCopying(false);
    }
  };

  const handleRegisterBasicInfo = async () => {
    try {
      if (selectedBasicId) {
        // 기존 PO 수정 (PUT)
        const res = await fetch(apiPath(`/api/purchase-orders/${selectedBasicId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basicForm, items: specItems }),
        });
        const data = await res.json();
        if (!data.ok) { setNotifyModal({ open: true, title: "저장 실패", message: data.message ?? "저장에 실패했습니다." }); return; }
        await loadBasicInfoList();
        // DB에서 다시 로드
        const detailRes = await fetch(apiPath(`/api/purchase-orders/${selectedBasicId}`));
        const detailData = await detailRes.json();
        if (detailData.ok) {
          setBasicForm(detailData.data.basicForm);
          setSpecItems(detailData.data.specItems.length > 0 ? detailData.data.specItems : [getDefaultSpecRow()]);
        }
      } else {
        // 신규 PO 등록 (POST)
        const res = await fetch(apiPath("/api/purchase-orders"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basicForm, items: [] }),
        });
        const data = await res.json();
        if (!data.ok) { setNotifyModal({ open: true, title: "등록 실패", message: data.message ?? "등록에 실패했습니다." }); return; }
        await loadBasicInfoList();
        const newId = String(data.id);
        setSelectedBasicId(newId);
        const detailRes = await fetch(apiPath(`/api/purchase-orders/${newId}`));
        const detailData = await detailRes.json();
        if (detailData.ok) {
          setBasicForm(detailData.data.basicForm);
          setSpecItems(detailData.data.specItems.length > 0 ? detailData.data.specItems : [getDefaultSpecRow()]);
        }
      }
    } catch {
      setNotifyModal({ open: true, title: "오류", message: selectedBasicId ? "저장 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다." });
    }
  };

  /** 왼쪽 리스트 행 클릭 시 DB에서 기본정보+명세 로드 */
  const handleSelectBasicInfo = async (row: BasicInfoListItem) => {
    setSelectedBasicId(row.id);
    setIsFormActive(true);
    setErrors({});
    try {
      const res = await fetch(apiPath(`/api/purchase-orders/${row.id}`));
      const data = await res.json();
      if (!data.ok) {
        // 로드 실패 시 리스트 데이터만 표시
        const { id: _id, orderNumber: _on, ...formData } = row;
        setBasicForm(formData);
        setSpecItems([getDefaultSpecRow()]);
        return;
      }
      setBasicForm(data.data.basicForm);
      setSpecItems(
        data.data.specItems.length > 0 ? data.data.specItems : [getDefaultSpecRow()]
      );
    } catch {
      const { id: _id, orderNumber: _on, ...formData } = row;
      setBasicForm(formData);
      setSpecItems([getDefaultSpecRow()]);
    }
  };


  const basicListColumns: MasterListGridColumn<BasicInfoListItem>[] = [
    {
      key: "orderNumber",
      header: "오더번호",
      minWidth: 100,
      maxWidth: 108,
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
    { key: "orderDate", header: "발주일자", minWidth: 84, maxWidth: 92 },
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
      minWidth: 52,
      maxWidth: 68,
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
    factoryOptions.find((o) => o.value === basicForm.businessPlace)?.label ??
    basicForm.businessPlace;


  // --- 명세입력 버튼 동작 ---


  const handleBulkOpen = async () => {
    if (!basicForm.supplierId) {
      window.alert("기본정보에서 구매처를 먼저 선택해 주세요.");
      return;
    }

    // 단가 등록 품목코드 로드 (캐시된 값 우선 사용)
    let codes = priceItemCodes;
    if (codes.size === 0) {
      try {
        const res = await fetch(apiPath("/api/purchase-prices"));
        const data = await res.json();
        if (data.ok) {
          const supplierName = basicForm.supplierName.trim().toLowerCase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          codes = new Set<string>((data.items as any[])
            .filter((p) => (p.supplierName ?? "").trim().toLowerCase() === supplierName)
            .map((p) => String(p.itemCode)));
          setPriceItemCodes(codes);
        }
      } catch { /* 로드 실패 시 빈 Set 유지 */ }
    }

    const bulkItems = itemMaster.filter((i) => codes.has(i.itemCode));
    if (bulkItems.length === 0) {
      window.alert("선택된 구매처에 등록된 단가 품목이 없습니다.");
      return;
    }
    const newRows: POSpecItemRow[] = bulkItems.map((i) => ({
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

  const handlePasteApply = () => {
    if (!pasteModal) return;
    const lines = pasteModal.text
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const added: string[] = [];
    const notFound: string[] = [];
    const newRows: POSpecItemRow[] = [];

    for (const line of lines) {
      // 탭으로 분리(엑셀 다중 열 복사)하되, 없으면 전체를 품목번호로
      const cols = line.split("\t");
      const code = cols[0].trim();
      if (!code) continue;

      // 발주량: 두 번째 열, 쉼표 제거 후 숫자 파싱
      const rawQty = cols[1]?.trim().replace(/,/g, "") ?? "";
      const qty = rawQty ? (Number.isFinite(Number(rawQty)) ? Number(rawQty) : 0) : 0;

      // 입고예정일자: 세 번째 열, YYYY-MM-DD 형식 검증
      const rawDate = cols[2]?.trim() ?? "";
      const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "";

      const item = itemMaster.find((i) => i.itemCode.toLowerCase() === code.toLowerCase());
      if (!item) { notFound.push(code); continue; }
      const row: POSpecItemRow = {
        ...getDefaultSpecRow(),
        itemCode: item.itemCode,
        itemName: item.itemName,
        material: item.material ?? "",
        specification: item.spec ?? "",
        warehouse: item.warehouse ?? "",
        storageLocation: item.storageLocation ?? "",
        model: item.model ?? "",
        unitPrice: item.unitPrice,
        quantity: qty,
        amount: qty * item.unitPrice,
        dueDate,
      };
      newRows.push(row);
      added.push(code);
    }

    if (newRows.length > 0) {
      setSpecItems((prev) => {
        const isEmpty = prev.length === 1 && !prev[0].itemCode;
        return isEmpty ? newRows : [...prev, ...newRows];
      });
    }

    setPasteModal(null);

    const parts: string[] = [];
    if (added.length > 0) parts.push(`${added.length}개 품목 추가됨`);
    if (notFound.length > 0) parts.push(`미매칭 ${notFound.length}개: ${notFound.slice(0, 5).join(", ")}${notFound.length > 5 ? " ..." : ""}`);
    setNotifyModal({ open: true, title: "품목 붙여넣기 결과", message: parts.join("\n") });
  };

  const handleSpecRegister = async () => {
    if (specItems.length === 0 || !specItems.some((r) => r.itemCode)) {
      window.alert("등록할 명세가 없습니다. 품목을 먼저 추가해 주세요.");
      return;
    }

    let targetId = selectedBasicId;

    if (!targetId) {
      // 기본정보가 아직 등록되지 않은 경우 자동 등록
      try {
        const res = await fetch(apiPath("/api/purchase-orders"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basicForm, orderStatus: "approved", items: specItems }),
        });
        const data = await res.json();
        if (!data.ok) { window.alert("등록 실패: " + (data.message ?? "")); return; }
        targetId = String(data.id);
        setSelectedBasicId(targetId);
        await loadBasicInfoList();
        setNotifyModal({ open: true, title: "명세 등록", message: "명세가 등록되었습니다." });
        return;
      } catch {
        window.alert("등록 중 오류가 발생했습니다.");
        return;
      }
    }

    // 기존 오더 업데이트
    try {
      const res = await fetch(apiPath(`/api/purchase-orders/${targetId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basicForm, orderStatus: "approved", items: specItems }),
      });
      const data = await res.json();
      if (!data.ok) { window.alert("수정 실패: " + (data.message ?? "")); return; }
      await loadBasicInfoList();
      setNotifyModal({ open: true, title: "명세 등록", message: "명세가 등록되었습니다." });
    } catch {
      window.alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteBasicInfo = async () => {
    if (!selectedBasicId) return;
    setConfirmModal({
      open: true,
      message: "선택한 오더를 삭제하시겠습니까?\n명세 품목도 함께 삭제됩니다.",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(apiPath(`/api/purchase-orders/${selectedBasicId}`), { method: "DELETE" });
          const data = await res.json();
          if (!data.ok) { setNotifyModal({ open: true, title: "삭제 실패", message: data.message ?? "삭제에 실패했습니다." }); return; }
          setSelectedBasicId(null);
          setBasicForm({ ...defaultBasicForm, ...loginBuyerRef.current });
          setSpecItems([getDefaultSpecRow()]);
          setIsFormActive(false);
          setErrors({});
          await loadBasicInfoList();
        } catch {
          setNotifyModal({ open: true, title: "오류", message: "삭제 중 오류가 발생했습니다." });
        }
      },
    });
  };

  /** 팝업 열기 — 검색어 기준 1건이면 즉시 세팅, 아니면 팝업 오픈 */
  const openItemModal = (rowIndex: number, search: string) => {
    setActiveSpecRowIndex(rowIndex);
    setItemSearch(search);
    const kw = search.trim().toLowerCase();
    if (kw) {
      const matched = itemMaster.filter((i) =>
        i.itemCode.toLowerCase().includes(kw) ||
        i.itemName.toLowerCase().includes(kw)
      );
      if (matched.length === 1) {
        selectItemFromModal(matched[0], rowIndex);
        return;
      }
    }
    setIsItemModalOpen(true);
  };

  /** 품목 선택 팝업에서 품목 선택 후 공통 처리 */
  const selectItemFromModal = (item: ItemMaster, rowIndex: number) => {
    updateSpecItem(rowIndex, "itemCode", item.itemCode);
    updateSpecItem(rowIndex, "itemName", item.itemName);
    updateSpecItem(rowIndex, "material", item.material ?? "");
    updateSpecItem(rowIndex, "specification", item.spec ?? "");
    updateSpecItem(rowIndex, "warehouse", item.warehouse ?? "");
    updateSpecItem(rowIndex, "storageLocation", item.storageLocation ?? "");
    updateSpecItem(rowIndex, "model", item.model ?? "");
    updateSpecItem(rowIndex, "unitPrice", item.unitPrice);
    setIsItemModalOpen(false);
    setItemSearch(""); setItemFilterModel(""); setItemFilterSupplierId(""); setItemFilterSupplierName("");
    setItemHighlightIdx(-1);
    setTimeout(() => quantityInputRefs.current[rowIndex]?.focus(), 0);
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

    // 발행 확정 콜백을 opener에 등록 (sendEmail: 이메일 발송 여부)
    const issueId = selectedBasicId;
    (window as Window & { __poIssueConfirm?: (sendEmail: boolean) => void }).__poIssueConfirm = (sendEmail: boolean) => {
      fetch(apiPath(`/api/purchase-orders/${issueId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basicForm, orderStatus: "issued", items: specItems }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            loadBasicInfoList();
            if (sendEmail) {
              fetch(apiPath(`/api/purchase-orders/${issueId}/send-email`), { method: "POST" })
                .then((r) => r.json())
                .then((emailResult) => {
                  if (!emailResult.ok) {
                    window.alert(`발주서는 발행되었으나 이메일 발송에 실패했습니다.\n사유: ${emailResult.message ?? ""}`);
                  }
                })
                .catch(() => {
                  window.alert("발주서는 발행되었으나 이메일 발송 중 오류가 발생했습니다.");
                });
            }
          }
        })
        .catch(() => {});
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
  .btn-bar { text-align:right; margin-bottom:6px; display:flex; gap:8px; justify-content:flex-end; align-items:center; }
  .btn-bar button { padding:4px 16px; font-size:11px; cursor:pointer; }
  .btn-confirm { background:#1d4ed8; color:#fff; border:none; border-radius:3px; }
  .btn-print  { background:#fff; border:1px solid #999; border-radius:3px; }
  .email-label { display:flex; align-items:center; gap:5px; font-size:11px; color:#374151; cursor:pointer; margin-right:4px; }
  .email-label input[type=checkbox] { width:14px; height:14px; cursor:pointer; accent-color:#1d4ed8; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @media print { .btn-bar { display:none; } }
</style>
</head><body>

<div class="btn-bar">
  <label class="email-label">
    <input type="checkbox" id="showPriceCheck">
    금액 표시
  </label>
  <label class="email-label">
    <input type="checkbox" id="sendEmailCheck">
    이메일 발송
  </label>
  <button class="btn-confirm" onclick="
    var sendEmail = document.getElementById('sendEmailCheck').checked;
    window.opener && window.opener.__poIssueConfirm && window.opener.__poIssueConfirm(sendEmail);
    this.textContent = sendEmail ? '발행 완료 (메일 발송 중)' : '발행 완료';
    this.disabled = true;
    document.getElementById('sendEmailCheck').disabled = true;
  ">발행 확정</button>
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
<table style="margin-top:0;border:${B};table-layout:fixed;width:100%;">
  <colgroup>
    <col style="width:16px;"><col style="width:48px;"><col style="width:calc(50% - 64px);">
    <col style="width:16px;"><col style="width:48px;"><col style="width:calc(50% - 64px);">
  </colgroup>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${recipient.companyName}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${basicForm.supplierName}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${recipient.representative}&nbsp;(인)</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${purchaserRecord?.representativeName || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">받</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${recipient.address}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${purchaserRecord?.address || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">는</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${recipient.tel}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-bottom:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${purchaserRecord?.phoneNo || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="border-right:${B};padding:2px 6px;overflow:hidden;word-break:break-all;">${recipient.fax}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="padding:2px 6px;overflow:hidden;word-break:break-all;">${purchaserRecord?.faxNo || ""}</td>
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
      ${th("border:" + B + ";padding:3px 4px;width:10%;", "납품요구일자")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:8%;", "수량")}
      <th class="price-cell" style="${G}border:${B};padding:3px 4px;text-align:right;width:10%;">단가</th>
      <th class="price-cell" style="${G}border:${B};padding:3px 4px;text-align:right;width:12%;">금액</th>
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
      <td class="price-cell" style="border:${B};padding:3px 4px;text-align:right;">${row.unitPrice.toLocaleString("ko-KR")}</td>
      <td class="price-cell" style="border:${B};padding:3px 4px;text-align:right;">${(row.amount ?? 0).toLocaleString("ko-KR")}</td>
      ${td(`border:${B};padding:3px 4px;text-align:center;`, "EA")}
    </tr>`).join("")}
    ${Array.from({ length: EMPTY_ROWS }, () => `
    <tr style="height:19px;">
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td class="price-cell" style="border:${B};"></td><td class="price-cell" style="border:${B};"></td>
      <td style="border:${B};"></td>
    </tr>`).join("")}
    <tr>
      <td style="${Y}border:${B};padding:3px 4px;text-align:left;">${filledSpec.length} 건</td>
      <td style="${Y}border:${B};padding:3px 10px;text-align:left;">** 합 계 **</td>
      <td style="${Y}border:${B};padding:3px 4px;"></td>
      <td style="${Y}border:${B};padding:3px 4px;"></td>
      <td style="${Y}border:${B};padding:3px 4px;"></td>
      <td style="${Y}border:${B};padding:3px 4px;"></td>
      <td style="${Y}border:${B};padding:3px 4px;text-align:right;">${totalQty.toLocaleString("ko-KR")}</td>
      <td class="price-cell" style="${Y}border:${B};padding:3px 4px;text-align:right;">${supply.toLocaleString("ko-KR")}</td>
      <td class="price-cell" style="${Y}border:${B};padding:3px 4px;text-align:right;font-weight:700;">${total.toLocaleString("ko-KR")}</td>
      <td style="${Y}border:${B};padding:3px 4px;"></td>
    </tr>
  </tbody>
</table>

<!-- 공급가액/부가세/합계 -->
<table class="price-section" style="margin-top:0;border:${B};">
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
      발주담당자 &nbsp;:&nbsp; ${basicForm.buyerName}
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      구매처견적번호 &nbsp;:&nbsp; ${basicForm.supplierQuotationNo || "-"}
    </td>
  </tr>
</table>

<script>
  function togglePrice(show) {
    document.querySelectorAll('.price-cell').forEach(function(el) {
      el.style.display = show ? 'table-cell' : 'none';
    });
    var section = document.querySelector('.price-section');
    if (section) section.style.display = show ? 'table' : 'none';
  }
  togglePrice(false);
  document.getElementById('showPriceCheck').addEventListener('change', function() {
    togglePrice(this.checked);
  });
</script>
</body></html>`);
    win.document.close();
  };


  const fieldLabelClass = "bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground";
  const reqInputClass = "h-8 text-xs bg-blue-50 border-blue-200 dark:bg-primary/15 dark:border-primary/40 dark:text-foreground";

  const clearError = (key: keyof POBasicFormData) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const blockIfEmpty = (e: React.KeyboardEvent, key: keyof POBasicFormData, value: string) => {
    if ((e.key === "Tab" || e.key === "Enter") && !String(value ?? "").trim()) {
      e.preventDefault();
      e.stopPropagation();
      setErrors((prev) => ({ ...prev, [key]: "필수 입력 항목입니다." }));
      return true;
    }
    return false;
  };

  const handleEnterNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    // select 요소는 Enter로 드롭다운을 제어하므로 통과시킴
    if ((document.activeElement as HTMLElement)?.tagName === "SELECT") return;
    const focusables = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
      )
    );
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    if (idx >= 0 && idx < focusables.length - 1) {
      e.preventDefault();
      focusables[idx + 1].focus();
    }
  };

  const handleExport = () => {
    const filled = specItems.filter((r) => r.itemCode);
    if (filled.length === 0) return;
    const header = ["명세번호","품목번호","품목명","규격","창고","저장위치","모델","발주량","구매단가","발주금액","입고예정일자"];
    const rows = filled.map((r, i) => [
      String(i + 1), r.itemCode, r.itemName, r.specification ?? "",
      r.warehouse ?? "", r.storageLocation ?? "", r.model ?? "",
      String(r.quantity), String(r.unitPrice), String(r.amount), r.dueDate,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const csv = [header.join(","), rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "purchase-order-spec.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <>
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
                selectedRowId={selectedBasicId ?? undefined}
                maxHeight="100%"
                noHorizontalScroll
                disablePagination
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
                  {selectedBasicId && (
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => setCopyModal({ open: true, orderDate: basicForm.orderDate })}
                      className="text-sky-600 hover:bg-sky-600 hover:text-white hover:border-sky-600">
                      <Copy className="mr-1.5 h-4 w-4 shrink-0" />PO 복사
                    </Button>
                  )}
                  {activeTab === "basic" && (
                    <>
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => {
                          setIsFormActive(true);
                          setBasicForm((prev) => ({ ...defaultBasicForm, ...loginBuyerRef.current, businessPlace: prev.businessPlace }));
                          setSelectedBasicId(null);
                          setSpecItems([getDefaultSpecRow()]);
                          setErrors({});
                        }}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary">
                        <Plus className="mr-1.5 h-4 w-4 shrink-0" />신규작성
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleBasicFormReset} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />초기화
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleRegisterBasicInfo} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <Save className="mr-1.5 h-4 w-4 shrink-0" />{selectedBasicId ? "저장" : "등록"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleDeleteBasicInfo} disabled={!selectedBasicId}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive disabled:opacity-40 disabled:pointer-events-none">
                        <Trash2 className="mr-1.5 h-4 w-4 shrink-0" />삭제
                      </Button>
                    </>
                  )}
                  {activeTab === "spec" && (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSpecItems([getDefaultSpecRow()])} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />초기화
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleSpecRegister} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <Save className="mr-1.5 h-4 w-4 shrink-0" />등록
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleBulkOpen} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <FileDown className="mr-1.5 h-4 w-4 shrink-0" />일괄등록
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setPasteModal({ open: true, text: "" })} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <Clipboard className="mr-1.5 h-4 w-4 shrink-0" />품목붙여넣기
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handlePoIssue} disabled={!isFormActive}
                        className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-40 disabled:pointer-events-none">
                        <Send className="mr-1.5 h-4 w-4 shrink-0" />PO발행
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* 기본정보 탭 */}
            <TabsContent value="basic" className="flex-1 min-h-0 overflow-auto m-0 data-[state=inactive]:hidden">
              {!isFormActive && (
                <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground select-none">
                  신규작성 버튼을 누르거나 목록에서 오더를 선택하세요.
                </div>
              )}
              <CardContent className={`p-4 ${!isFormActive ? "hidden" : ""}`}>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2" onKeyDown={handleEnterNav}>
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
                  <div>
                    <div className="grid grid-cols-[100px_minmax(0,0.4fr)_32px_minmax(0,0.6fr)] gap-1 items-center">
                      <Label className={fieldLabelClass}>구매처번호</Label>
                      <Input
                        value={basicForm.supplierId}
                        onChange={(e) => {
                          const v = e.target.value;
                          clearError("supplierId");
                          setBasicForm((prev) => ({ ...prev, supplierId: v, supplierName: "" }));
                          if (debounceRef.current) clearTimeout(debounceRef.current);
                          debounceRef.current = setTimeout(async () => {
                            if (!v.trim()) return;
                            try {
                              const res = await fetch(apiPath("/api/purchasers"));
                              const data = await res.json();
                              if (data?.ok && Array.isArray(data.items)) {
                                const kw = v.trim().toLowerCase();
                                // 코드 정확 일치 우선, 없으면 이름 포함 검색
                                const exactMatch = data.items.find(
                                  (item: Record<string, string>) =>
                                    (item.PurchaserNo ?? "").toLowerCase() === kw
                                );
                                const nameMatches = !exactMatch
                                  ? data.items.filter(
                                      (item: Record<string, string>) =>
                                        (item.PurchaserName ?? "").toLowerCase().includes(kw)
                                    )
                                  : [];
                                const match = exactMatch ?? (nameMatches.length === 1 ? nameMatches[0] : null);
                                if (match) {
                                  setBasicForm((prev) => ({
                                    ...prev,
                                    supplierId: match.PurchaserNo,
                                    supplierName: match.PurchaserName,
                                  }));
                                }
                              }
                            } catch {}
                          }, 300);
                        }}
                        onKeyDown={(e) => {
                          if (blockIfEmpty(e, "supplierId", basicForm.supplierId)) return;
                          if (e.key === "Enter") {
                            if (debounceRef.current) clearTimeout(debounceRef.current);
                            const v = basicForm.supplierId.trim();
                            if (!v) return;
                            fetch(apiPath("/api/purchasers"))
                              .then((r) => r.json())
                              .then((data) => {
                                if (data?.ok && Array.isArray(data.items)) {
                                  const kw = v.toLowerCase();
                                  const exactMatch = data.items.find(
                                    (item: Record<string, string>) =>
                                      (item.PurchaserNo ?? "").toLowerCase() === kw
                                  );
                                  const nameMatches = !exactMatch
                                    ? data.items.filter(
                                        (item: Record<string, string>) =>
                                          (item.PurchaserName ?? "").toLowerCase().includes(kw)
                                      )
                                    : [];
                                  const match = exactMatch ?? (nameMatches.length === 1 ? nameMatches[0] : null);
                                  if (match) {
                                    setBasicForm((prev) => ({
                                      ...prev,
                                      supplierId: match.PurchaserNo,
                                      supplierName: match.PurchaserName,
                                    }));
                                  }
                                }
                              })
                              .catch(() => {});
                          }
                        }}
                        className={reqInputClass}
                        placeholder="구매처 CODE"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setIsPurchaserPopupOpen(true)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Input
                        value={basicForm.supplierName}
                        readOnly
                        className="h-8 text-xs bg-muted text-muted-foreground"
                        placeholder="구매처명"
                      />
                    </div>
                    {errors.supplierId && <FieldError message={errors.supplierId} className="pl-[108px]" />}
                  </div>
                  <div>
                    <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                      <Label className={fieldLabelClass}>통화코드</Label>
                      <Select
                        options={currencyOptions}
                        value={basicForm.currencyCode}
                        onChange={(v) => { setBasic("currencyCode", v); clearError("currencyCode"); }}
                        onKeyDown={(e) => blockIfEmpty(e, "currencyCode", basicForm.currencyCode)}
                        placeholder="선택"
                        className={reqInputClass}
                      />
                    </div>
                    {errors.currencyCode && <FieldError message={errors.currencyCode} className="pl-[108px]" />}
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급형태</Label>
                    <Select
                      options={paymentFormOptions}
                      value={basicForm.paymentType}
                      onChange={(v) => setBasic("paymentType", v)}
                      placeholder="선택"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                    <Label className={fieldLabelClass}>대금지급조건</Label>
                    <Select
                      options={paymentTermOptions}
                      value={basicForm.paymentTerms}
                      onChange={(v) => setBasic("paymentTerms", v)}
                      placeholder="선택"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="grid grid-cols-[100px_minmax(0,0.4fr)_32px_minmax(0,0.6fr)] gap-1 items-center">
                      <Label className={fieldLabelClass}>구매 발주자</Label>
                      <Input
                        value={basicForm.buyerCode}
                        onChange={(e) => {
                          const v = e.target.value;
                          clearError("buyerCode");
                          setBasicForm((prev) => ({ ...prev, buyerCode: v, buyerName: "" }));
                          if (buyerDebounceRef.current) clearTimeout(buyerDebounceRef.current);
                          buyerDebounceRef.current = setTimeout(async () => {
                            if (!v.trim()) return;
                            try {
                              const res = await fetch(apiPath("/api/users"));
                              const data = await res.json();
                              if (data?.ok && Array.isArray(data.items)) {
                                const match = data.items.find(
                                  (item: Record<string, string>) =>
                                    (item.Username ?? "").toLowerCase() === v.trim().toLowerCase()
                                );
                                if (match) {
                                  setBasicForm((prev) => ({
                                    ...prev,
                                    buyerCode: match.Username,
                                    buyerName: match.UserId ?? match.Username,
                                  }));
                                }
                              }
                            } catch {}
                          }, 300);
                        }}
                        onKeyDown={(e) => {
                          if (blockIfEmpty(e, "buyerCode", basicForm.buyerCode)) return;
                          if (e.key === "Enter") {
                            if (buyerDebounceRef.current) clearTimeout(buyerDebounceRef.current);
                            const v = basicForm.buyerCode.trim();
                            if (!v) return;
                            fetch(apiPath("/api/users"))
                              .then((r) => r.json())
                              .then((data) => {
                                if (data?.ok && Array.isArray(data.items)) {
                                  const match = data.items.find(
                                    (item: Record<string, string>) =>
                                      (item.Username ?? "").toLowerCase() === v.toLowerCase()
                                  );
                                  if (match) {
                                    setBasicForm((prev) => ({
                                      ...prev,
                                      buyerCode: match.Username,
                                      buyerName: match.UserId ?? match.Username,
                                    }));
                                  }
                                }
                              })
                              .catch(() => {});
                          }
                        }}
                        className={reqInputClass}
                        placeholder="사용자 ID"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setIsUserPopupOpen(true)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Input
                        value={basicForm.buyerName}
                        readOnly
                        className="h-8 text-xs bg-muted text-muted-foreground"
                        placeholder="사용자명"
                      />
                    </div>
                    {errors.buyerCode && <FieldError message={errors.buyerCode} className="pl-[108px]" />}
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
                  <div>
                    <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                      <Label className={fieldLabelClass}>사업장</Label>
                      <Select
                        options={factoryOptions}
                        value={basicForm.businessPlace}
                        onChange={(v) => { setBasic("businessPlace", v); clearError("businessPlace"); }}
                        onKeyDown={(e) => blockIfEmpty(e, "businessPlace", basicForm.businessPlace)}
                        placeholder="선택"
                        className={reqInputClass}
                      />
                    </div>
                    {errors.businessPlace && <FieldError message={errors.businessPlace} className="pl-[108px]" />}
                  </div>
                  <div>
                    <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                      <Label className={fieldLabelClass}>발주일자</Label>
                      <DateInput
                        value={basicForm.orderDate}
                        onChange={(e) => { setBasic("orderDate", e.target.value); clearError("orderDate"); }}
                        onKeyDown={(e) => blockIfEmpty(e, "orderDate", basicForm.orderDate)}
                        className={reqInputClass}
                      />
                    </div>
                    {errors.orderDate && <FieldError message={errors.orderDate} className="pl-[108px]" />}
                  </div>
                  <div>
                    <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                      <Label className={fieldLabelClass}>부가세율</Label>
                      <Select
                        options={vatRateOptions}
                        value={basicForm.vatRate}
                        onChange={(v) => { setBasic("vatRate", v); clearError("vatRate"); }}
                        onKeyDown={(e) => blockIfEmpty(e, "vatRate", basicForm.vatRate)}
                        placeholder="선택"
                        className={reqInputClass}
                      />
                    </div>
                    {errors.vatRate && <FieldError message={errors.vatRate} className="pl-[108px]" />}
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
              {!isFormActive && (
                <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground select-none">
                  신규작성 버튼을 누르거나 목록에서 오더를 선택하세요.
                </div>
              )}
              {/* 요약 정보 바 */}
              <div className={`flex flex-wrap gap-x-6 gap-y-1 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground ${!isFormActive ? "hidden" : ""}`}>
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
              <div className={`flex items-center gap-2 mb-1 ${!isFormActive ? "hidden" : ""}`}>
                <Button type="button" variant="outline" size="sm" onClick={() => { addSpecItem(); setIsItemModalOpen(true); }} className="text-xs h-7">
                  <Plus className="mr-1.5 h-3 w-3" />
                  품목 추가
                </Button>
                <span className="flex-1" />
                <DataGridToolbar
                  active={gridSettingsOpen ? gridSettingsTab : undefined}
                  onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
                  onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
                />
              </div>
              <div className={`rounded-md border ${!isFormActive ? "hidden" : ""}`} onKeyDown={handleEnterNav}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-1.5 w-12 whitespace-nowrap text-center">명세번호</th>
                      <th className="px-2 py-1.5 w-32 text-center">품목번호</th>
                      <th className="px-2 py-1.5 w-40 text-center">품목명</th>
                      <th className="px-2 py-1.5 w-20 text-center">규격</th>
                      <th className="px-2 py-1.5 w-20 text-center">창고선택</th>
                      <th className="px-2 py-1.5 w-16 text-center">저장위치</th>
                      <th className="px-2 py-1.5 w-20 text-center">모델</th>
                      <th className="px-2 py-1.5 w-14 text-center">발주량</th>
                      <th className="px-2 py-1.5 w-16 text-center">구매단가</th>
                      <th className="px-2 py-1.5 w-16 text-center">발주금액</th>
                      <th className="px-2 py-1.5 w-32 text-center whitespace-nowrap">입고예정일자</th>
                      <th className="px-2 py-1.5 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {specItems.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-2 py-1 text-center">{index + 1}</td>
                        <td className="px-1 py-1 w-32">
                          <div className="flex gap-0.5 items-center">
                            <Input
                              ref={(el) => { itemCodeInputRefs.current[index] = el; }}
                              value={row.itemCode}
                              onChange={(e) => updateSpecItem(index, "itemCode", e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openItemModal(index, row.itemCode);
                                }
                              }}
                              className="h-6 w-full text-xs px-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => openItemModal(index, row.itemCode)}
                            >
                              <Search className="h-3 w-3" />
                            </Button>
                          </div>
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
                        <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10 border-l border-amber-200 dark:border-amber-600/30">
                          <Select
                            ref={(el) => { warehouseSelectRefs.current[index] = el; }}
                            options={warehouseOptions}
                            value={row.warehouse ?? ""}
                            onChange={(v) => {
                              updateSpecItem(index, "warehouse", v);
                              setTimeout(() => quantityInputRefs.current[index]?.focus(), 0);
                            }}
                            placeholder=""
                            className={`h-6 text-xs w-16 ${row.itemCode && !row.warehouse ? "ring-1 ring-red-400 border-red-400" : ""}`}
                          />
                        </td>
                        <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-600/30">
                          <Input
                            value={row.storageLocation ?? ""}
                            onChange={(e) => updateSpecItem(index, "storageLocation", e.target.value)}
                            className="h-6 text-xs w-16 px-1"
                          />
                        </td>
                        <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10 border-r border-amber-200 dark:border-amber-600/30">
                          <Input
                            value={row.model ?? ""}
                            onChange={(e) => updateSpecItem(index, "model", e.target.value)}
                            className="h-6 text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10 border-l border-r border-amber-200 dark:border-amber-600/30">
                          <Input
                            ref={(el) => { quantityInputRefs.current[index] = el; }}
                            inputMode="numeric"
                            value={row.quantity ? row.quantity.toLocaleString("ko-KR") : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              updateSpecItem(index, "quantity", Number(val) || 0);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => dueDateInputRefs.current[index]?.focus(), 0);
                              }
                            }}
                            className={`h-6 w-14 text-xs text-right px-1 ${row.itemCode && !row.quantity ? "ring-1 ring-red-400 border-red-400" : ""}`}
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
                        <td className="px-1 py-1">
                          <DateInput
                            ref={(el) => { dueDateInputRefs.current[index] = el; }}
                            value={row.dueDate ?? ""}
                            onChange={(e) => updateSpecItem(index, "dueDate", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                if (row.itemCode && (!row.warehouse || !row.quantity)) return;
                                addSpecItem();
                                setTimeout(() => itemCodeInputRefs.current[index + 1]?.focus(), 0);
                              }
                            }}
                            className="h-6 text-xs w-32"
                          />
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
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                총 <span className="font-semibold">{specItems.filter((r) => r.itemCode).length.toLocaleString("ko-KR")}</span>건
              </div>
            </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <SearchPopup<{ Id: string; PurchaserNo: string; PurchaserName: string; [key: string]: unknown }>
        open={isPurchaserPopupOpen}
        onOpenChange={setIsPurchaserPopupOpen}
        title="구매처"
        apiUrl={apiPath("/api/purchasers")}
        columns={[
          { key: "PurchaserNo", header: "구매처번호", width: 120 },
          { key: "PurchaserName", header: "구매처명" },
        ]}
        searchKeys={["PurchaserNo", "PurchaserName"]}
        keyExtractor={(item) => String(item.Id)}
        initialSearchCode={basicForm.supplierId}
        onSelect={(item) => {
          setBasicForm((prev) => ({
            ...prev,
            supplierId: String(item.PurchaserNo),
            supplierName: String(item.PurchaserName),
          }));
        }}
      />

      <SearchPopup<{ Id: string; Username: string; UserId: string | null; FactoryCode: string; FactoryName: string; [key: string]: unknown }>
        open={isUserPopupOpen}
        onOpenChange={setIsUserPopupOpen}
        title="발주자"
        apiUrl={apiPath("/api/users")}
        columns={[
          { key: "Username", header: "사용자 ID", width: 130 },
          { key: "UserId", header: "사용자명", width: 110 },
          { key: "FactoryCode", header: "사업장코드", width: 90 },
          { key: "FactoryName", header: "사업장명" },
        ]}
        searchKeys={["Username", "UserId", "FactoryCode", "FactoryName"]}
        keyExtractor={(item) => String(item.Id)}
        initialSearchCode={basicForm.buyerCode}
        onSelect={(item) => {
          setBasicForm((prev) => ({
            ...prev,
            buyerCode: String(item.Username),
            buyerName: String(item.UserId ?? item.Username),
          }));
        }}
      />

      {isItemModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => { if (e.key === "Escape") { setIsItemModalOpen(false); setItemSearch(""); setItemFilterModel(""); setItemFilterSupplierId(""); setItemFilterSupplierName(""); } }}>
          <div className="relative w-full max-w-3xl rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">품목 선택</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setIsItemModalOpen(false); setItemSearch(""); setItemFilterModel(""); setItemFilterSupplierId(""); setItemFilterSupplierName(""); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* 검색 조건 */}
            <div className="mb-2 flex flex-wrap gap-2 items-center" onKeyDown={handleEnterNav}>
              <Input
                ref={itemSearchInputRef}
                value={itemSearch}
                onChange={(e) => { setItemSearch(e.target.value); setItemHighlightIdx(-1); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault(); e.stopPropagation();
                    setItemHighlightIdx((p) => Math.min(p + 1, filteredItems.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault(); e.stopPropagation();
                    setItemHighlightIdx((p) => Math.max(p - 1, -1));
                  } else if (e.key === "Enter") {
                    e.preventDefault(); e.stopPropagation();
                    const target = itemHighlightIdx >= 0
                      ? filteredItems[itemHighlightIdx]
                      : filteredItems.length === 1 ? filteredItems[0] : null;
                    if (target) {
                      selectItemFromModal(target, activeSpecRowIndex);
                    } else {
                      itemSupplierInputRef.current?.focus();
                    }
                  }
                }}
                placeholder="품목번호 또는 품목명"
                className="h-8 text-xs w-44"
              />
              {/* 거래처 검색 */}
              <div className="flex gap-1 items-center">
                <Input
                  ref={itemSupplierInputRef}
                  value={itemFilterSupplierId}
                  placeholder="거래처코드"
                  className="h-8 text-xs w-24"
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault(); e.stopPropagation();
                      setItemHighlightIdx((p) => Math.min(p + 1, filteredItems.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault(); e.stopPropagation();
                      setItemHighlightIdx((p) => Math.max(p - 1, -1));
                    } else if (e.key === "Enter") {
                      e.preventDefault(); e.stopPropagation();
                      if (itemHighlightIdx >= 0) {
                        const target = filteredItems[itemHighlightIdx];
                        if (target) selectItemFromModal(target, activeSpecRowIndex);
                      } else if (itemFilterSupplierId.trim()) {
                        // 뭔가 입력된 상태 → 구매처 팝업 열기
                        setSupplierSubSearch(itemFilterSupplierId);
                        setIsItemSupplierPopupOpen(true);
                      } else {
                        // 비어있으면 다음 필드(모델)로 이동
                        itemModelInputRef.current?.focus();
                      }
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value;
                    setItemFilterSupplierId(v);
                    setItemFilterSupplierName("");
                    if (itemSupplierDebounceRef.current) clearTimeout(itemSupplierDebounceRef.current);
                    itemSupplierDebounceRef.current = setTimeout(() => {
                      const match = purchasers.find(
                        (p) => p.purchaserNo.toLowerCase() === v.trim().toLowerCase()
                      );
                      if (match) setItemFilterSupplierName(match.purchaserName);
                    }, 300);
                  }}
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                  onClick={() => { setSupplierSubSearch(itemFilterSupplierId); setIsItemSupplierPopupOpen(true); }}>
                  <Search className="h-4 w-4" />
                </Button>
                <Input
                  value={itemFilterSupplierName}
                  readOnly
                  placeholder="거래처명"
                  className="h-8 text-xs w-28 bg-muted text-muted-foreground"
                />
              </div>
              {/* 모델 검색 */}
              <div className="flex gap-1 items-center">
                <Input
                  ref={itemModelInputRef}
                  value={itemFilterModel}
                  placeholder="모델"
                  className="h-8 text-xs w-28"
                  onChange={(e) => setItemFilterModel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault(); e.stopPropagation();
                      setItemHighlightIdx((p) => Math.min(p + 1, filteredItems.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault(); e.stopPropagation();
                      setItemHighlightIdx((p) => Math.max(p - 1, -1));
                    } else if (e.key === "Enter") {
                      e.preventDefault(); e.stopPropagation();
                      if (itemHighlightIdx >= 0) {
                        const target = filteredItems[itemHighlightIdx];
                        if (target) selectItemFromModal(target, activeSpecRowIndex);
                      } else if (itemFilterModel.trim()) {
                        // 뭔가 입력된 상태 → 모델 팝업 열기
                        setModelSubSearch(itemFilterModel);
                        setIsModelPopupOpen(true);
                      } else {
                        // 비어있으면 품목검색 input으로 이동
                        itemSearchInputRef.current?.focus();
                      }
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                  onClick={() => { setModelSubSearch(itemFilterModel); setIsModelPopupOpen(true); }}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setItemSearch(""); setItemFilterModel("");
                  setItemFilterSupplierId(""); setItemFilterSupplierName("");
                }}
              >
                초기화
              </Button>
            </div>
            {/* 단가 필터 라디오 */}
            <div className="mb-3 flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="priceFilter"
                  checked={!onlyWithPrice}
                  onChange={() => setOnlyWithPrice(false)}
                  className="accent-primary"
                />
                전체
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="priceFilter"
                  checked={onlyWithPrice}
                  onChange={() => setOnlyWithPrice(true)}
                  className="accent-primary"
                />
                구매처 단가 등록 품목만
              </label>
            </div>
            <div ref={itemListScrollRef} className="h-[380px] rounded-md border overflow-y-auto">
              <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "8rem" }} />
                  <col />
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "6rem" }} />
                </colgroup>
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap">품목번호</th>
                    <th className="px-3 py-2 text-left">품목명</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">모델</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">창고</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">저장위치</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 품목이 없습니다.</td></tr>
                  ) : (() => {
                    const vitems = itemVirtualizer.getVirtualItems();
                    const totalSize = itemVirtualizer.getTotalSize();
                    const paddingTop = vitems.length > 0 ? vitems[0].start : 0;
                    const paddingBottom = vitems.length > 0 ? totalSize - vitems[vitems.length - 1].end : 0;
                    return (
                      <>
                        {paddingTop > 0 && <tr style={{ height: paddingTop }}><td colSpan={5} /></tr>}
                        {vitems.map((vRow) => {
                          const i = filteredItems[vRow.index];
                          return (
                            <tr
                              key={i.itemCode}
                              className={`cursor-pointer border-t ${vRow.index === itemHighlightIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground" : "hover:bg-muted"}`}
                              onClick={() => selectItemFromModal(i, activeSpecRowIndex)}
                            >
                              <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.itemCode}</td>
                              <td className="px-3 py-1.5 overflow-hidden text-ellipsis">{i.itemName}</td>
                              <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.model || "-"}</td>
                              <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.warehouse || "-"}</td>
                              <td className="px-3 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{i.storageLocation || "-"}</td>
                            </tr>
                          );
                        })}
                        {paddingBottom > 0 && <tr style={{ height: paddingBottom }}><td colSpan={5} /></tr>}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              총 <span className="font-semibold">{filteredItems.length.toLocaleString("ko-KR")}</span>건
            </div>
          </div>

          {/* 거래처 서브팝업 */}
          {isItemSupplierPopupOpen && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-lg"
              onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setIsItemSupplierPopupOpen(false); } }}>
              <div className="w-80 rounded-lg bg-background p-4 shadow-xl border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">거래처 선택</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setIsItemSupplierPopupOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={supplierSubSearch}
                  onChange={(e) => { setSupplierSubSearch(e.target.value); setSupplierHighlightIdx(-1); }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSupplierHighlightIdx((p) => Math.min(p + 1, filteredPurchasersForPopup.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSupplierHighlightIdx((p) => Math.max(p - 1, -1));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const target = supplierHighlightIdx >= 0
                        ? filteredPurchasersForPopup[supplierHighlightIdx]
                        : filteredPurchasersForPopup.length === 1 ? filteredPurchasersForPopup[0] : null;
                      if (target) {
                        setItemFilterSupplierId(target.purchaserNo);
                        setItemFilterSupplierName(target.purchaserName);
                        setIsItemSupplierPopupOpen(false);
                        setSupplierHighlightIdx(-1);
                        setTimeout(() => itemSupplierInputRef.current?.focus(), 0);
                      }
                    }
                  }}
                  placeholder="거래처번호 또는 거래처명"
                  className="h-8 text-xs mb-2"
                  autoFocus
                />
                <div className="h-[260px] rounded border overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 text-left whitespace-nowrap w-28">거래처번호</th>
                        <th className="px-3 py-1.5 text-left">거래처명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchasersForPopup.map((p, idx) => (
                        <tr
                          key={p.purchaserNo}
                          ref={idx === supplierHighlightIdx ? supplierHighlightRef : null}
                          className={`cursor-pointer border-t ${idx === supplierHighlightIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground" : "hover:bg-muted"}`}
                          onClick={() => {
                            setItemFilterSupplierId(p.purchaserNo);
                            setItemFilterSupplierName(p.purchaserName);
                            setIsItemSupplierPopupOpen(false);
                            setSupplierHighlightIdx(-1);
                            setTimeout(() => itemSupplierInputRef.current?.focus(), 0);
                          }}
                        >
                          <td className="px-3 py-1.5 whitespace-nowrap">{p.purchaserNo}</td>
                          <td className="px-3 py-1.5">{p.purchaserName}</td>
                        </tr>
                      ))}
                      {filteredPurchasersForPopup.length === 0 && (
                        <tr><td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 거래처가 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 모델 서브팝업 */}
          {isModelPopupOpen && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-lg"
              onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setIsModelPopupOpen(false); } }}>
              <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">모델 선택</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setIsModelPopupOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={modelSubSearch}
                  onChange={(e) => { setModelSubSearch(e.target.value); setModelHighlightIdx(-1); }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setModelHighlightIdx((p) => Math.min(p + 1, filteredModelsForPopup.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setModelHighlightIdx((p) => Math.max(p - 1, -1));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const target = modelHighlightIdx >= 0
                        ? filteredModelsForPopup[modelHighlightIdx]
                        : filteredModelsForPopup.length === 1 ? filteredModelsForPopup[0] : null;
                      if (target) {
                        setItemFilterModel(target);
                        setIsModelPopupOpen(false);
                        setModelHighlightIdx(-1);
                      }
                    }
                  }}
                  placeholder="모델명 검색"
                  className="h-8 text-xs mb-2"
                  autoFocus
                />
                <div className="h-[260px] rounded border overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 text-left">모델</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModelsForPopup.map((m, idx) => (
                        <tr
                          key={m}
                          ref={idx === modelHighlightIdx ? modelHighlightRef : null}
                          className={`cursor-pointer border-t ${idx === modelHighlightIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40 dark:text-foreground" : "hover:bg-muted"}`}
                          onClick={() => {
                            setItemFilterModel(m);
                            setIsModelPopupOpen(false);
                            setModelHighlightIdx(-1);
                          }}
                        >
                          <td className="px-3 py-1.5">{m}</td>
                        </tr>
                      ))}
                      {filteredModelsForPopup.length === 0 && (
                        <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 알림 모달 */}
      {copyModal?.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="w-[360px] rounded-lg border bg-background p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold">PO 복사</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              선택한 PO의 기본정보와 명세를 그대로 복사합니다.<br />
              발주일자를 변경하거나 그대로 유지할 수 있습니다.
            </p>
            <div className="mb-4 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">발주일자</label>
              <DateInput
                value={copyModal.orderDate}
                onChange={(e) => setCopyModal((prev) => prev ? { ...prev, orderDate: e.target.value } : prev)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setCopyModal(null)} disabled={copying}>
                취소
              </Button>
              <Button size="sm" onClick={handleCopyConfirm} disabled={copying}>
                {copying ? "복사 중..." : "복사"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal?.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="w-[360px] rounded-lg border bg-background shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <p className="text-sm font-semibold">확인</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-foreground whitespace-pre-line">{confirmModal.message}</p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2 border-t">
              <Button size="sm" variant="outline" className="h-8 px-5 text-xs" onClick={() => setConfirmModal(null)}>
                취소
              </Button>
              <Button size="sm" className="h-8 px-5 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => confirmModal.onConfirm()}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {pasteModal?.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
          onKeyDown={(e) => { if (e.key === "Escape") setPasteModal(null); }}>
          <div className="w-[480px] rounded-lg border bg-background shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <p className="text-sm font-semibold">품목번호 붙여넣기</p>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPasteModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-2">
                엑셀에서 복사하여 붙여넣으세요.<br />
                <span className="font-medium text-foreground">1열: 품목번호</span> (필수) &nbsp;|&nbsp;
                <span className="font-medium text-foreground">2열: 발주량</span> (선택) &nbsp;|&nbsp;
                <span className="font-medium text-foreground">3열: 입고예정일자</span> YYYY-MM-DD (선택)
              </p>
              <textarea
                autoFocus
                className="w-full h-52 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                placeholder={"66182-40083\t360000\t2026-04-01\n66082-90071\t8\t2026-04-01\n73998-0878R"}
                value={pasteModal.text}
                onChange={(e) => setPasteModal((prev) => prev ? { ...prev, text: e.target.value } : prev)}
              />
            </div>
            <div className="px-5 py-3 flex justify-end gap-2 border-t">
              <Button size="sm" variant="outline" className="h-8 px-5 text-xs" onClick={() => setPasteModal(null)}>
                취소
              </Button>
              <Button size="sm" className="h-8 px-5 text-xs" onClick={handlePasteApply} disabled={!pasteModal.text.trim()}>
                적용
              </Button>
            </div>
          </div>
        </div>
      )}

      {notifyModal?.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-xl w-[360px] p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold">{notifyModal.title}</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-foreground whitespace-pre-line">{notifyModal.message}</p>
            </div>
            <div className="px-5 py-3 flex justify-end border-t border-border">
              <Button
                autoFocus
                size="sm"
                className="h-8 px-6 text-xs"
                onClick={() => setNotifyModal(null)}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>

    <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
      <SheetContent>
        <SheetHdr>
          <SheetTitle>그리드 설정</SheetTitle>
          <SheetDescription className="text-xs">내보내기 · 보기 설정</SheetDescription>
        </SheetHdr>
        <div className="mt-4 space-y-5 text-xs">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={gridSettingsTab === "export" ? "default" : "outline"} onClick={() => setGridSettingsTab("export")}>내보내기</Button>
            <Button size="sm" variant={gridSettingsTab === "view" ? "default" : "outline"} onClick={() => setGridSettingsTab("view")}>보기</Button>
          </div>
          {gridSettingsTab === "export" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">명세작업 품목 데이터를 CSV 파일로 다운로드합니다.</p>
              <Button size="sm" onClick={handleExport} disabled={!specItems.some((r) => r.itemCode)}>CSV 내보내기</Button>
            </div>
          )}
          {gridSettingsTab === "view" && (
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                <Checkbox checked={stripedRows} onChange={(e) => setStripedRows(e.target.checked)} />
              </label>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
