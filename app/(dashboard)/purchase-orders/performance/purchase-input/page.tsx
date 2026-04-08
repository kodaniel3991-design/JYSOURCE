"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { SearchPopup } from "@/components/common/search-popup";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { Search, RotateCcw, Plus, Save, Trash2, CheckSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPath } from "@/lib/api-path";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type ListItem = {
  id: string; inputNo: string; supplierCode: string; supplierName: string;
  inputDate: string; totalAmount: number; taxAmount: number; totalWithTax: number;
  paymentAmount: number; buyerCode: string; buyerName: string; status: string; deptCode: string;
};

type HeaderForm = {
  inputNo?: string;
  supplierCode: string; supplierName: string; inputDate: string;
  status: string; buyerCode: string; buyerName: string;
  summary: string; deptCode: string; deptName: string;
  totalAmount: number; taxAmount: number; totalWithTax: number; paymentAmount: number;
};

type UserItem = {
  id: string; username: string; userId: string; position: string; employeeNo: string;
};

type InputItem = {
  id: string; seqNo: number; receiptHistoryId: string | null; receiptNo: string;
  itemCode: string; itemName: string; unit: string;
  inputQty: number; inputAmount: number; convertedAmount: number;
  taxAmount: number; totalWithTax: number; note: string; purchaseOrderNo: string;
};

type UnreceivedItem = {
  id: string; receiptNo: string; itemCode: string; itemName: string; unit: string;
  unreceiptQty: number; inputQty: number; receiptDate: string;
  unitPrice: number; receiptAmount: number; taxAmount: number; totalWithTax: number;
  poNumber: string; supplierCode: string; supplierName: string; vehicleModel: string;
};

// ── 초기값 ───────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const firstOfMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};

const emptyHeader = (): HeaderForm => ({
  supplierCode: "", supplierName: "", inputDate: todayStr(),
  status: "입력중", buyerCode: "", buyerName: "",
  summary: "", deptCode: "", deptName: "",
  totalAmount: 0, taxAmount: 0, totalWithTax: 0, paymentAmount: 0,
});

// ── 폼 스타일 (create/page.tsx 패턴) ─────────────────────────────────────────
const FLD = "bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground";
const REQ = "h-8 text-xs bg-blue-50 border-blue-200 dark:bg-primary/15 dark:border-primary/40 dark:text-foreground";

const statusOptions: SelectOption[] = [
  { value: "입력중",  label: "0.입력중"  },
  { value: "확정",    label: "1. 매입확정결재" },
  { value: "회계처리",label: "2.회계처리" },
  { value: "취소",    label: "9.취소"    },
];

// ── 페이지 ───────────────────────────────────────────────────────────────────

export default function PurchaseInputPage() {
  // 좌측 목록 검색
  const [listSearch, setListSearch] = useState({
    supplierCode: "",
    dateFrom: firstOfMonthStr(),
    dateTo:   todayStr(),
  });
  const [list,       setList]       = useState<ListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // 선택된 항목
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew,      setIsNew]      = useState(false);

  // 우측 헤더 폼
  const [header, setHeader] = useState<HeaderForm>(emptyHeader());
  const [saving, setSaving] = useState(false);
  const [isSupplierOpen,     setIsSupplierOpen]     = useState(false);
  const [isListSupplierOpen, setIsListSupplierOpen] = useState(false);
  const [listSupplierName,   setListSupplierName]   = useState("");
  const [isBuyerOpen,        setIsBuyerOpen]        = useState(false);

  // 사용자 목록 (구매담당자 팝업)
  const [users,          setUsers]          = useState<UserItem[]>([]);
  const [buyerSearch,    setBuyerSearch]    = useState("");
  const loginBuyerRef = useRef<{ buyerCode: string; buyerName: string }>({ buyerCode: "", buyerName: "" });

  // 탭
  const [activeTab, setActiveTab] = useState<"매입내역" | "구매입고참조">("매입내역");

  // 매입내역 탭
  const [inputItems,         setInputItems]         = useState<InputItem[]>([]);
  const [selectedItemIds,    setSelectedItemIds]    = useState<Set<string>>(new Set());
  const [itemsLoading,       setItemsLoading]       = useState(false);

  // 구매입고참조 탭
  const [unSearch, setUnSearch] = useState({
    dateFrom: firstOfMonthStr(), dateTo: todayStr(), model: "",
  });
  const [unItemCode,   setUnItemCode]   = useState("");
  const [unItemName,   setUnItemName]   = useState("");
  const [unreceivedItems,    setUnreceivedItems]    = useState<UnreceivedItem[]>([]);
  const [selectedUnIds,      setSelectedUnIds]      = useState<Set<string>>(new Set());
  const [unLoading,          setUnLoading]          = useState(false);

  // 모델 팝업 (구매입고참조)
  const [modelList,      setModelList]      = useState<string[]>([]);
  const [isUnModelOpen,  setIsUnModelOpen]  = useState(false);
  const [unModelSearch,  setUnModelSearch]  = useState("");
  const [unModelIdx,     setUnModelIdx]     = useState(-1);
  const unModelRowRef = useRef<HTMLTableRowElement>(null);

  // 품목 팝업 (구매입고참조)
  const [isUnItemOpen,   setIsUnItemOpen]   = useState(false);

  // ── 내부 모달 (alert / confirm) ───────────────────────────────────────────────
  type DialogState =
    | { type: "alert";   message: string }
    | { type: "confirm"; message: string; onConfirm: () => void }
    | null;
  const [dialog, setDialog] = useState<DialogState>(null);
  const showAlert   = (message: string) => setDialog({ type: "alert", message });
  const showConfirm = (message: string, onConfirm: () => void) =>
    setDialog({ type: "confirm", message, onConfirm });

  const supplierCodeRef    = useRef<HTMLInputElement>(null);
  const supplierDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 로그인 사용자 / 사용자 목록 로드 ─────────────────────────────────────────
  useEffect(() => {
    // 로그인 사용자 → 구매담당자 기본값
    fetch(apiPath("/api/auth/me"))
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        const buyerCode = d.username ?? "";
        const buyerName = d.userId   ?? d.username ?? "";
        loginBuyerRef.current = { buyerCode, buyerName };
        setHeader((prev) => ({ ...prev, buyerCode, buyerName }));
      })
      .catch(() => {});
    // 사용자 목록 (팝업용)
    fetch(apiPath("/api/users"))
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUsers(d.items.map((u: any) => ({
          id:         String(u.Id),
          username:   String(u.Username   ?? ""),
          userId:     String(u.UserId     ?? ""),
          position:   String(u.Position   ?? ""),
          employeeNo: String(u.EmployeeNo ?? ""),
        })));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 모델 목록 로드 ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiPath("/api/items"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const s = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.items.forEach((x: any) => { if (x.VehicleModel) s.add(x.VehicleModel as string); });
        setModelList(Array.from(s).sort());
      })
      .catch(() => {});
  }, []);

  const filteredModelList = useMemo(() => {
    const kw = unModelSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [unModelSearch, modelList]);

  useEffect(() => { unModelRowRef.current?.scrollIntoView({ block: "nearest" }); }, [unModelIdx]);

  // ── 목록 조회 ───────────────────────────────────────────────────────────────
  const loadList = useCallback(() => {
    const p = new URLSearchParams();
    if (listSearch.supplierCode) p.set("supplierCode", listSearch.supplierCode);
    if (listSearch.dateFrom)     p.set("dateFrom",     listSearch.dateFrom);
    if (listSearch.dateTo)       p.set("dateTo",       listSearch.dateTo);
    setListLoading(true);
    fetch(apiPath(`/api/purchase-inputs?${p}`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setList(d.items); })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [listSearch]);

  useEffect(() => { loadList(); }, []);  // 최초 로드

  // ── 헤더 단건 로드 ──────────────────────────────────────────────────────────
  const loadHeader = useCallback((id: string) => {
    fetch(apiPath(`/api/purchase-inputs/${id}`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setHeader(d.header); })
      .catch(() => {});
  }, []);

  // ── 매입내역 로드 ────────────────────────────────────────────────────────────
  const loadItems = useCallback((id: string) => {
    setItemsLoading(true);
    fetch(apiPath(`/api/purchase-inputs/${id}/items`))
      .then((r) => r.json())
      .then((d) => { if (d.ok) setInputItems(d.items); })
      .catch(() => {})
      .finally(() => setItemsLoading(false));
  }, []);

  // ── 구매입고참조 조회 ─────────────────────────────────────────────────────────
  const loadUnreceived = useCallback(() => {
    if (!header.supplierCode) return;
    const p = new URLSearchParams({ supplierCode: header.supplierCode });
    if (unItemCode)        { p.set("itemCodeFrom", unItemCode); p.set("itemCodeTo", unItemCode); }
    if (unSearch.dateFrom) p.set("dateFrom", unSearch.dateFrom);
    if (unSearch.dateTo)   p.set("dateTo",   unSearch.dateTo);
    if (unSearch.model)    p.set("model",    unSearch.model);
    setUnLoading(true);
    fetch(apiPath(`/api/purchase-inputs/unreceived?${p}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setUnreceivedItems(d.items);
          setSelectedUnIds(new Set());
        }
      })
      .catch(() => {})
      .finally(() => setUnLoading(false));
  }, [header.supplierCode, unSearch, unItemCode]);

  // 탭 전환 시 자동 조회
  useEffect(() => {
    if (activeTab === "구매입고참조" && header.supplierCode && !isNew) {
      loadUnreceived();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 목록 행 클릭 ─────────────────────────────────────────────────────────────
  const handleSelectRow = (item: ListItem) => {
    setSelectedId(item.id);
    setIsNew(false);
    loadHeader(item.id);
    loadItems(item.id);
    setActiveTab("매입내역");
    setUnreceivedItems([]);
    setSelectedItemIds(new Set());
    setSelectedUnIds(new Set());
  };

  // ── 신규 ─────────────────────────────────────────────────────────────────────
  const handleNew = () => {
    setSelectedId(null);
    setIsNew(true);
    setHeader({ ...emptyHeader(), ...loginBuyerRef.current });
    setInputItems([]);
    setUnreceivedItems([]);
    setSelectedItemIds(new Set());
    setSelectedUnIds(new Set());
    setActiveTab("매입내역");
    setTimeout(() => supplierCodeRef.current?.focus(), 0);
  };

  // ── 헤더 저장 ────────────────────────────────────────────────────────────────
  const handleSaveHeader = async () => {
    if (!header.supplierCode) { showAlert("구매처번호를 입력하세요."); return; }
    if (!header.inputDate)    { showAlert("매입일자를 입력하세요.");   return; }

    setSaving(true);
    try {
      if (isNew) {
        const res  = await fetch(apiPath("/api/purchase-inputs"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(header),
        });
        const data = await res.json();
        if (!data.ok) { showAlert(data.message || "저장 실패"); return; }
        setSelectedId(data.id);
        setIsNew(false);
        loadList();
        loadItems(data.id);
      } else if (selectedId) {
        const res = await fetch(apiPath(`/api/purchase-inputs/${selectedId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(header),
        });
        const data = await res.json();
        if (!data.ok) { showAlert("수정 실패"); return; }
        loadList();
      }
    } finally {
      setSaving(false);
    }
  };

  // ── 헤더 삭제 ────────────────────────────────────────────────────────────────
  const handleDeleteHeader = () => {
    if (!selectedId) return;
    showConfirm("이 매입 실적을 삭제하시겠습니까?", async () => {
      await fetch(apiPath(`/api/purchase-inputs/${selectedId}`), { method: "DELETE" });
      setSelectedId(null);
      setIsNew(false);
      setHeader(emptyHeader());
      setInputItems([]);
      loadList();
    });
  };

  // ── 매입내역 행 삭제 ──────────────────────────────────────────────────────────
  const handleDeleteItems = () => {
    if (!selectedId || !selectedItemIds.size) return;
    showConfirm(`선택한 ${selectedItemIds.size}건을 삭제하시겠습니까?`, async () => {
      for (const itemId of Array.from(selectedItemIds)) {
        await fetch(apiPath(`/api/purchase-inputs/${selectedId}/items/${itemId}`), { method: "DELETE" });
      }
      setSelectedItemIds(new Set());
      loadItems(selectedId);
      loadHeader(selectedId);
      loadList();
    });
  };

  // ── 매입확정 ─────────────────────────────────────────────────────────────────
  const handleConfirmPurchase = async () => {
    if (!selectedId) { showAlert("먼저 매입 실적을 저장하세요."); return; }
    const selected = unreceivedItems.filter((i) => selectedUnIds.has(i.id));
    if (!selected.length) { showAlert("처리할 항목을 선택하세요."); return; }

    const body = selected.map((i) => ({
      receiptHistoryId: Number(i.id),
      receiptNo:        i.receiptNo,
      itemCode:         i.itemCode,
      itemName:         i.itemName,
      unit:             i.unit,
      inputQty:         i.inputQty,
      inputAmount:      Math.round(i.inputQty * i.unitPrice),
      taxAmount:        Math.round(i.inputQty * i.unitPrice * 0.1),
      purchaseOrderNo:  i.poNumber,
    }));

    const res  = await fetch(apiPath(`/api/purchase-inputs/${selectedId}/items`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) { showAlert(data.message || "매입확정 실패"); return; }

    loadItems(selectedId);
    loadHeader(selectedId);
    loadList();
    loadUnreceived();
    setSelectedUnIds(new Set());
    setActiveTab("매입내역");
  };

  // ── 구매입고참조 매입량 수정 ──────────────────────────────────────────────────
  const updateInputQty = (id: string, qty: number) => {
    setUnreceivedItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, inputQty: qty } : i)
    );
  };

  // ── 전체 선택 토글 ────────────────────────────────────────────────────────────
  const toggleAllItems = () => {
    if (selectedItemIds.size === inputItems.length) setSelectedItemIds(new Set());
    else setSelectedItemIds(new Set(inputItems.map((i) => i.id)));
  };
  const toggleAllUn = () => {
    if (selectedUnIds.size === unreceivedItems.length) setSelectedUnIds(new Set());
    else setSelectedUnIds(new Set(unreceivedItems.map((i) => i.id)));
  };

  const fmt = (n: number) => n.toLocaleString("ko-KR");
  const hd  = (key: keyof HeaderForm, val: string | number) =>
    setHeader((p) => ({ ...p, [key]: val }));

  const isEditable   = isNew || !!selectedId;
  const isFormLocked = isEditable && (header.status === "확정" || header.status === "회계처리");

  // ── 렌더 ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-0" style={{ height: "calc(100vh - 7rem)" }}>

      {/* ── 좌측 패널: 매입 목록 ─────────────────────────────────────────── */}
      <div className="w-[440px] flex flex-col border-r bg-card shrink-0">

        {/* 목록 헤더 */}
        <div className="border-b px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <PageHeader title="매입 실적 관리" description="" className="mb-0" />
            <Button type="button" size="sm" className="h-7 px-3 shrink-0" onClick={handleNew}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              신규
            </Button>
          </div>
          {/* 1행: 구매처번호 팝업조회 + 초기화 */}
          <div className="flex gap-1 mb-1">
            <Input
              value={listSearch.supplierCode}
              onChange={(e) => { setListSearch((p) => ({ ...p, supplierCode: e.target.value })); setListSupplierName(""); }}
              placeholder="구매처번호"
              className="h-7 text-xs w-24 shrink-0"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setIsListSupplierOpen(true); } }}
            />
            <Button type="button" size="icon" variant="outline" className="h-7 w-7 shrink-0"
              onClick={() => setIsListSupplierOpen(true)}>
              <Search className="h-3 w-3" />
            </Button>
            <Input
              value={listSupplierName}
              readOnly
              placeholder="구매처명"
              className="h-7 text-xs flex-1 bg-muted text-muted-foreground"
            />
            <Button type="button" size="icon" variant="outline" className="h-7 w-7 shrink-0"
              onClick={() => { setListSearch({ supplierCode: "", dateFrom: firstOfMonthStr(), dateTo: todayStr() }); setListSupplierName(""); }}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          {/* 2행: 일자 범위 */}
          <div className="flex gap-1 items-center mb-1">
            <DateInput value={listSearch.dateFrom}
              onChange={(e) => setListSearch((p) => ({ ...p, dateFrom: e.target.value }))}
              className="h-7 text-xs flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">~</span>
            <DateInput value={listSearch.dateTo}
              onChange={(e) => setListSearch((p) => ({ ...p, dateTo: e.target.value }))}
              className="h-7 text-xs flex-1" />
          </div>
        </div>

        {/* 목록 그리드 */}
        <div className="flex-1 overflow-auto text-xs">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-muted/90 z-10">
              <tr>
                <th className="px-2 py-1.5 text-right border-b border-r border-border w-15">매입번호</th>
                <th className="px-2 py-1.5 text-left border-b border-r border-border w-20">구매처번호</th>
                <th className="px-2 py-1.5 text-center border-b border-r border-border w-21">매입일자</th>
                <th className="px-2 py-1.5 text-right border-b border-r border-border">부가세포함금액</th>
                <th className="px-2 py-1.5 text-center border-b border-border w-22">상태</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">조회 중...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">데이터 없음</td></tr>
              ) : list.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleSelectRow(item)}
                  className={cn(
                    "border-b cursor-pointer hover:bg-muted/40",
                    selectedId === item.id && "bg-primary/10 font-medium"
                  )}
                >
                  <td className="px-2 py-1 text-right border-r border-border tabular-nums">{item.inputNo}</td>
                  <td className="px-2 py-1 border-r border-border">
                    <div className="font-mono">{item.supplierCode}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[76px]">{item.supplierName}</div>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-border">{item.inputDate}</td>
                  <td className="px-2 py-1 text-right border-r border-border tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                    {fmt(item.totalWithTax)}
                  </td>
                  <td className={cn("px-2 py-1 text-center text-[11px]",
                    item.status === "확정" ? "text-emerald-600 dark:text-emerald-400 font-semibold" :
                    item.status === "회계처리" ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-muted-foreground")}>
                    {statusOptions.find(o => o.value === item.status)?.label ?? item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 합계 */}
        <div className="shrink-0 border-t px-3 py-1.5 flex items-center justify-between text-xs bg-muted/30">
          <span className="text-muted-foreground">총 <b className="text-foreground">{list.length.toLocaleString("ko-KR")}</b>건</span>
          <span className="text-muted-foreground">부가세포함 총 금액 : <b className="tabular-nums font-semibold text-blue-600 dark:text-blue-400">
            {list.reduce((s, i) => s + i.totalWithTax, 0).toLocaleString("ko-KR")}
          </b></span>
        </div>

      </div>

      {/* ── 우측 패널 ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">

        {/* 헤더 폼 */}
        <div className="shrink-0 border-b">
          {/* 툴바 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
            <span className="text-sm font-semibold text-foreground mr-2">
              {isNew ? "신규 등록" : selectedId ? `매입번호 ${header.inputNo}` : "항목을 선택하거나 신규를 누르세요"}
            </span>
            <div className="ml-auto flex gap-2">
              <Button type="button" size="sm" className="h-7 px-3" onClick={handleSaveHeader}
                disabled={!isEditable || saving || isFormLocked}>
                <Save className="mr-1 h-3 w-3" />
                저장
              </Button>
              {header.status !== "회계처리" && (
                <Button type="button" size="sm" variant="destructive" className="h-7 px-3"
                  onClick={handleDeleteHeader} disabled={!selectedId || isNew}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  삭제
                </Button>
              )}
            </div>
          </div>

          {/* 폼 필드 */}
          {isEditable && (
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 p-4">
              {/* 열 1 */}
              <div className="space-y-2">
                {/* 구매처번호 */}
                <div className="grid grid-cols-[110px_minmax(0,0.4fr)_32px_minmax(0,0.6fr)] gap-1 items-center">
                  <Label className={FLD}>구매처번호 <span className="text-destructive ml-0.5">*</span></Label>
                  <Input
                    ref={supplierCodeRef}
                    value={header.supplierCode}
                    readOnly={isFormLocked}
                    onChange={(e) => {
                      if (isFormLocked) return;
                      const v = e.target.value;
                      setHeader((p) => ({ ...p, supplierCode: v, supplierName: "" }));
                      if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
                      supplierDebounceRef.current = setTimeout(async () => {
                        if (!v.trim()) return;
                        try {
                          const res = await fetch(apiPath("/api/purchasers"));
                          const data = await res.json();
                          if (data?.ok && Array.isArray(data.items)) {
                            const match = data.items.find(
                              (item: Record<string, string>) =>
                                (item.PurchaserNo ?? "").toLowerCase() === v.trim().toLowerCase()
                            );
                            if (match) {
                              setHeader((p) => ({ ...p, supplierCode: match.PurchaserNo, supplierName: match.PurchaserName }));
                            }
                          }
                        } catch {}
                      }, 300);
                    }}
                    onKeyDown={(e) => {
                      if (isFormLocked) return;
                      if (e.key === "Enter") {
                        if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
                        const v = header.supplierCode.trim();
                        if (!v) return;
                        fetch(apiPath("/api/purchasers"))
                          .then((r) => r.json())
                          .then((data) => {
                            if (data?.ok && Array.isArray(data.items)) {
                              const match = data.items.find(
                                (item: Record<string, string>) =>
                                  (item.PurchaserNo ?? "").toLowerCase() === v.toLowerCase()
                              );
                              if (match) {
                                setHeader((p) => ({ ...p, supplierCode: match.PurchaserNo, supplierName: match.PurchaserName }));
                              }
                            }
                          })
                          .catch(() => {});
                      }
                    }}
                    className={cn(REQ, isFormLocked && "opacity-60 cursor-not-allowed")}
                    placeholder="구매처 CODE"
                  />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    disabled={isFormLocked}
                    onClick={() => setIsSupplierOpen(true)}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <Input value={header.supplierName} readOnly
                    className="h-8 text-xs bg-muted text-muted-foreground" placeholder="구매처명" />
                </div>
                {/* 매입일자 */}
                <div className="grid grid-cols-[110px_1fr] gap-1 items-center">
                  <Label className={FLD}>매입일자 <span className="text-destructive ml-0.5">*</span></Label>
                  <DateInput value={header.inputDate}
                    readOnly={isFormLocked}
                    onChange={(e) => { if (!isFormLocked) hd("inputDate", e.target.value); }}
                    className={cn(REQ, isFormLocked && "opacity-60 cursor-not-allowed")} />
                </div>
                {/* 매입실적상태 */}
                <div className="grid grid-cols-[110px_1fr] gap-1 items-center">
                  <Label className={FLD}>매입실적상태</Label>
                  <Select options={statusOptions} value={header.status}
                    onChange={(v) => { if (!isFormLocked) hd("status", v); }}
                    disabled={isFormLocked}
                    className="h-8 text-xs" />
                </div>
              </div>

              {/* 열 2 */}
              <div className="space-y-2">
                {/* 적 요 */}
                <div className="grid grid-cols-[110px_1fr] gap-1 items-center">
                  <Label className={FLD}>적&nbsp;&nbsp;&nbsp;요</Label>
                  <Input value={header.summary} readOnly={isFormLocked}
                    onChange={(e) => { if (!isFormLocked) hd("summary", e.target.value); }}
                    className={cn("h-8 text-xs", isFormLocked && "opacity-60 cursor-not-allowed")} />
                </div>
                {/* 부서코드 */}
                <div className="grid grid-cols-[110px_minmax(0,0.35fr)_minmax(0,0.65fr)] gap-1 items-center">
                  <Label className={FLD}>부서코드</Label>
                  <Input value={header.deptCode} readOnly={isFormLocked}
                    onChange={(e) => { if (!isFormLocked) hd("deptCode", e.target.value); }}
                    className={cn("h-8 text-xs", isFormLocked && "opacity-60 cursor-not-allowed")} placeholder="코드" />
                  <Input value={header.deptName} readOnly={isFormLocked}
                    onChange={(e) => { if (!isFormLocked) hd("deptName", e.target.value); }}
                    className={cn("h-8 text-xs", isFormLocked && "opacity-60 cursor-not-allowed")} placeholder="부서명" />
                </div>
                {/* 구매담당자 */}
                <div className="grid grid-cols-[110px_minmax(0,0.4fr)_32px_minmax(0,0.6fr)] gap-1 items-center">
                  <Label className={FLD}>구매담당자</Label>
                  <Input value={header.buyerCode} readOnly
                    className="h-8 text-xs bg-muted text-muted-foreground" placeholder="코드" />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    disabled={isFormLocked}
                    onClick={() => { setBuyerSearch(""); setIsBuyerOpen(true); }}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <Input value={header.buyerName} readOnly
                    className="h-8 text-xs bg-muted text-muted-foreground" placeholder="성명" />
                </div>
              </div>
            </div>
          )}

          {/* 합계 요약 (저장된 경우만) */}
          {!isNew && selectedId && (
            <div className="flex gap-4 px-3 py-1.5 bg-muted/20 border-t text-xs">
              <span>매입금액 <b className="tabular-nums">{fmt(header.totalAmount)}</b></span>
              <span>부가세 <b className="tabular-nums">{fmt(header.taxAmount)}</b></span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                부가세포함금액 <b className="tabular-nums">{fmt(header.totalWithTax)}</b>
              </span>
              <span>대금지급금액 <b className="tabular-nums">{fmt(header.paymentAmount)}</b></span>
            </div>
          )}
        </div>

        {/* 탭 영역 */}
        {isEditable && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* 탭 바 */}
            <div className="flex border-b bg-muted/30 shrink-0">
              {(["매입내역", "구매입고참조"] as const).map((tab) => {
                const isLocked = tab === "구매입고참조" && (header.status === "확정" || header.status === "회계처리");
                return (
                  <button key={tab} type="button"
                    disabled={isLocked}
                    onClick={() => !isLocked && setActiveTab(tab)}
                    title={isLocked ? "매입확정결재 이후에는 구매입고참조를 사용할 수 없습니다." : undefined}
                    className={cn(
                      "px-5 py-2 text-xs font-medium border-r border-border transition-colors",
                      isLocked
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : activeTab === tab
                          ? "bg-background text-primary border-b-2 border-b-primary -mb-px"
                          : "text-muted-foreground hover:bg-muted/60"
                    )}>
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* ── 매입내역 탭 ──────────────────────────────────────────────── */}
            {activeTab === "매입내역" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* 툴바 */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20 shrink-0">
                  {header.status !== "회계처리" && (
                    <Button type="button" size="sm" variant="destructive" className="h-7 px-3"
                      onClick={handleDeleteItems} disabled={!selectedItemIds.size}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      선택 삭제
                    </Button>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    총 <b>{inputItems.length}</b>건
                  </span>
                </div>
                {/* 그리드 */}
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted/80 z-10">
                      <tr>
                        <th className="px-2 py-1.5 border-b border-r border-border w-8">
                          <input type="checkbox"
                            checked={inputItems.length > 0 && selectedItemIds.size === inputItems.length}
                            onChange={toggleAllItems}
                            disabled={header.status === "회계처리"} />
                        </th>
                        <th className="px-2 py-1.5 text-center border-b border-r border-border w-10">No.</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-32">품목번호</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border min-w-[120px]">품목명</th>
                        <th className="px-2 py-1.5 text-center border-b border-r border-border w-10">단위</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-20">매입수량</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-24">매입금액</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-24">환전매입금액</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-22">부가세액</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-24">부가세포함금액</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-36">입고번호</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-28">구매오더</th>
                        <th className="px-2 py-1.5 text-left border-b border-border">적요</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsLoading ? (
                        <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">조회 중...</td></tr>
                      ) : inputItems.length === 0 ? (
                        <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">
                          구매입고참조 탭에서 입고자료를 선택 후 매입확정하세요.
                        </td></tr>
                      ) : inputItems.map((item, idx) => (
                        <tr key={item.id}
                          className={cn("border-b hover:bg-muted/20",
                            selectedItemIds.has(item.id) && "bg-primary/5")}>
                          <td className="px-2 py-1 text-center border-r border-border">
                            <input type="checkbox" checked={selectedItemIds.has(item.id)}
                              disabled={header.status === "회계처리"}
                              onChange={(e) => {
                                const s = new Set(selectedItemIds);
                                e.target.checked ? s.add(item.id) : s.delete(item.id);
                                setSelectedItemIds(s);
                              }} />
                          </td>
                          <td className="px-2 py-1 text-center border-r border-border">{idx + 1}</td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.itemCode}</td>
                          <td className="px-2 py-1 border-r border-border">{item.itemName}</td>
                          <td className="px-2 py-1 text-center border-r border-border">{item.unit}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">{fmt(item.inputQty)}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">{fmt(item.inputAmount)}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">{fmt(item.convertedAmount)}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">{fmt(item.taxAmount)}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                            {fmt(item.totalWithTax)}
                          </td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.receiptNo}</td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.purchaseOrderNo}</td>
                          <td className="px-2 py-1">{item.note}</td>
                        </tr>
                      ))}
                    </tbody>
                    {inputItems.length > 0 && (
                      <tfoot className="sticky bottom-0 bg-yellow-50/80 dark:bg-yellow-500/10 font-semibold">
                        <tr>
                          <td colSpan={5} className="px-3 py-1.5 text-right border-t border-r border-border">합&nbsp;&nbsp;계</td>
                          <td className="px-2 py-1.5 text-right border-t border-r border-border tabular-nums">
                            {fmt(inputItems.reduce((s, i) => s + i.inputQty, 0))}
                          </td>
                          <td className="px-2 py-1.5 text-right border-t border-r border-border tabular-nums">
                            {fmt(inputItems.reduce((s, i) => s + i.inputAmount, 0))}
                          </td>
                          <td className="px-2 py-1.5 text-right border-t border-r border-border tabular-nums">
                            {fmt(inputItems.reduce((s, i) => s + i.convertedAmount, 0))}
                          </td>
                          <td className="px-2 py-1.5 text-right border-t border-r border-border tabular-nums">
                            {fmt(inputItems.reduce((s, i) => s + i.taxAmount, 0))}
                          </td>
                          <td className="px-2 py-1.5 text-right border-t border-r border-border tabular-nums text-blue-600 dark:text-blue-400">
                            {fmt(inputItems.reduce((s, i) => s + i.totalWithTax, 0))}
                          </td>
                          <td colSpan={3} className="border-t" />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ── 구매입고참조 탭 ──────────────────────────────────────────── */}
            {activeTab === "구매입고참조" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* 검색 영역 */}
                <div className="shrink-0 border-b px-3 py-2 bg-muted/10">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* 입고일자 */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="text-xs font-medium text-muted-foreground">입고일자</label>
                      <div className="flex gap-1 items-center">
                        <DateInput value={unSearch.dateFrom}
                          onChange={(e) => setUnSearch((p) => ({ ...p, dateFrom: e.target.value }))}
                          className="h-7 text-xs w-[120px]" />
                        <span className="text-xs text-muted-foreground">~</span>
                        <DateInput value={unSearch.dateTo}
                          onChange={(e) => setUnSearch((p) => ({ ...p, dateTo: e.target.value }))}
                          className="h-7 text-xs w-[120px]" />
                      </div>
                    </div>
                    {/* 품목번호 */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="text-xs font-medium text-muted-foreground">품목번호</label>
                      <div className="flex gap-1">
                        <Input value={unItemCode}
                          onChange={(e) => { setUnItemCode(e.target.value); setUnItemName(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setIsUnItemOpen(true); } }}
                          placeholder="품목번호"
                          className="h-7 text-xs w-32" />
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0"
                          onClick={() => setIsUnItemOpen(true)}>
                          <Search className="h-3 w-3" />
                        </Button>
                        <Input value={unItemName} readOnly placeholder="품목명"
                          className="h-7 text-xs w-36 bg-muted text-muted-foreground" />
                      </div>
                    </div>
                    {/* 모델(차종) */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="text-xs font-medium text-muted-foreground">모델(차종)</label>
                      <div className="flex gap-1">
                        <Input value={unSearch.model}
                          onChange={(e) => setUnSearch((p) => ({ ...p, model: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setUnModelSearch(unSearch.model); setUnModelIdx(-1); setIsUnModelOpen(true); } }}
                          placeholder="모델"
                          className="h-7 text-xs w-28" />
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0"
                          onClick={() => { setUnModelSearch(unSearch.model); setUnModelIdx(-1); setIsUnModelOpen(true); }}>
                          <Search className="h-3 w-3" />
                        </Button>
                        {unSearch.model && (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                            onClick={() => setUnSearch((p) => ({ ...p, model: "" }))}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" className="h-7 px-3" onClick={loadUnreceived}
                      disabled={!header.supplierCode}>
                      <Search className="mr-1 h-3 w-3" />
                      조회
                    </Button>
                    <Button type="button" size="sm" variant="default" className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleConfirmPurchase} disabled={!selectedUnIds.size || !selectedId}>
                      <CheckSquare className="mr-1 h-3 w-3" />
                      매입확정
                    </Button>
                    {!header.supplierCode && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        ※ 구매처번호를 입력하고 저장한 후 조회하세요.
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      총 <b>{unreceivedItems.length}</b>건 / 선택 <b>{selectedUnIds.size}</b>건
                    </span>
                  </div>
                </div>

                {/* 그리드 */}
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted/80 z-10">
                      <tr>
                        <th className="px-2 py-1.5 border-b border-r border-border w-8">
                          <input type="checkbox"
                            checked={unreceivedItems.length > 0 && selectedUnIds.size === unreceivedItems.length}
                            onChange={toggleAllUn} />
                        </th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-36">입고번호</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-32">품목번호</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border min-w-[80px]">품목명</th>
                        <th className="px-2 py-1.5 text-center border-b border-r border-border w-10">단위</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-16">미매입량</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-16">매입량</th>
                        <th className="px-2 py-1.5 text-center border-b border-r border-border w-24">입고일자</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-20">입고단가</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-24">입고금액</th>
                        <th className="px-2 py-1.5 text-right border-b border-r border-border w-20">부가세액</th>
                        <th className="px-2 py-1.5 text-center border-b border-r border-border w-12">과세</th>
                        <th className="px-2 py-1.5 text-left border-b border-r border-border w-20">업체코드</th>
                        <th className="px-2 py-1.5 text-left border-b border-border min-w-[80px]">업체명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unLoading ? (
                        <tr><td colSpan={14} className="py-8 text-center text-muted-foreground">조회 중...</td></tr>
                      ) : unreceivedItems.length === 0 ? (
                        <tr><td colSpan={14} className="py-8 text-center text-muted-foreground">
                          {header.supplierCode ? "조회 버튼을 눌러 미매입 입고자료를 불러오세요." : "구매처를 먼저 입력하세요."}
                        </td></tr>
                      ) : unreceivedItems.map((item) => (
                        <tr key={item.id}
                          className={cn("border-b hover:bg-muted/20",
                            selectedUnIds.has(item.id) && "bg-primary/5")}>
                          <td className="px-2 py-1 text-center border-r border-border">
                            <input type="checkbox" checked={selectedUnIds.has(item.id)}
                              onChange={(e) => {
                                const s = new Set(selectedUnIds);
                                e.target.checked ? s.add(item.id) : s.delete(item.id);
                                setSelectedUnIds(s);
                              }} />
                          </td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.receiptNo}</td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.itemCode}</td>
                          <td className="px-2 py-1 border-r border-border">{item.itemName}</td>
                          <td className="px-2 py-1 text-center border-r border-border">{item.unit}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums text-muted-foreground">
                            {fmt(item.unreceiptQty)}
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <input
                              type="number"
                              value={item.inputQty}
                              onChange={(e) => updateInputQty(item.id, Number(e.target.value))}
                              className="w-full text-right tabular-nums text-red-600 dark:text-red-400 font-semibold bg-yellow-50/60 dark:bg-yellow-500/10 border border-border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="px-2 py-1 text-center border-r border-border">{item.receiptDate}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">{fmt(item.unitPrice)}</td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                            {fmt(Math.round(item.inputQty * item.unitPrice))}
                          </td>
                          <td className="px-2 py-1 text-right border-r border-border tabular-nums">
                            {fmt(Math.round(item.inputQty * item.unitPrice * 0.1))}
                          </td>
                          <td className="px-2 py-1 text-center border-r border-border">과세</td>
                          <td className="px-2 py-1 font-mono text-[11px] border-r border-border">{item.supplierCode}</td>
                          <td className="px-2 py-1 text-[11px]">{item.supplierName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 항목 미선택 안내 */}
        {!isEditable && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            좌측 목록에서 항목을 선택하거나 신규 버튼을 누르세요.
          </div>
        )}
      </div>

      {/* 구매처 팝업 (우측 폼) */}
      <SearchPopup<{ Id: string; PurchaserNo: string; PurchaserName: string; [key: string]: unknown }>
        open={isSupplierOpen}
        onOpenChange={setIsSupplierOpen}
        title="구매처"
        apiUrl={apiPath("/api/purchasers")}
        columns={[
          { key: "PurchaserNo", header: "구매처번호", width: 120 },
          { key: "PurchaserName", header: "구매처명" },
        ]}
        searchKeys={["PurchaserNo", "PurchaserName"]}
        keyExtractor={(item) => String(item.Id)}
        initialSearchCode={header.supplierCode}
        onSelect={(item) => {
          setHeader((p) => ({ ...p, supplierCode: String(item.PurchaserNo), supplierName: String(item.PurchaserName) }));
        }}
      />

      {/* 구매처 팝업 (좌측 목록 검색) */}
      <SearchPopup<{ Id: string; PurchaserNo: string; PurchaserName: string; [key: string]: unknown }>
        open={isListSupplierOpen}
        onOpenChange={setIsListSupplierOpen}
        title="구매처"
        apiUrl={apiPath("/api/purchasers")}
        columns={[
          { key: "PurchaserNo", header: "구매처번호", width: 120 },
          { key: "PurchaserName", header: "구매처명" },
        ]}
        searchKeys={["PurchaserNo", "PurchaserName"]}
        keyExtractor={(item) => String(item.Id)}
        initialSearchCode={listSearch.supplierCode}
        onSelect={(item) => {
          setListSearch((p) => ({ ...p, supplierCode: String(item.PurchaserNo) }));
          setListSupplierName(String(item.PurchaserName));
        }}
      />

      {/* 구매담당자 팝업 */}
      {isBuyerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => { if (e.key === "Escape") setIsBuyerOpen(false); }}>
          <div className="w-96 rounded-lg bg-background p-4 shadow-xl border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">구매담당자 선택</h3>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setIsBuyerOpen(false)}>
                <span className="text-base leading-none">×</span>
              </Button>
            </div>
            <Input
              value={buyerSearch}
              onChange={(e) => setBuyerSearch(e.target.value)}
              placeholder="사용자명 검색"
              className="h-8 text-xs mb-2"
              autoFocus
            />
            <div className="h-[280px] rounded border overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 text-left w-28">사용자명</th>
                    <th className="px-3 py-1.5 text-left w-24">사원번호</th>
                    <th className="px-3 py-1.5 text-left">직위</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => {
                      const kw = buyerSearch.trim().toLowerCase();
                      return !kw || u.username.toLowerCase().includes(kw) || u.userId.toLowerCase().includes(kw);
                    })
                    .map((u) => (
                      <tr key={u.id}
                        className="cursor-pointer border-t hover:bg-muted"
                        onClick={() => {
                          hd("buyerCode", u.username);
                          hd("buyerName", u.userId || u.username);
                          setIsBuyerOpen(false);
                        }}>
                        <td className="px-3 py-1.5 font-mono">{u.username}</td>
                        <td className="px-3 py-1.5">{u.employeeNo}</td>
                        <td className="px-3 py-1.5">{u.position}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 품목 팝업 (구매입고참조) */}
      <ItemSelectModal
        open={isUnItemOpen}
        onOpenChange={setIsUnItemOpen}
        onSelect={(item) => {
          setUnItemCode(item.itemCode);
          setUnItemName(item.itemName);
          setIsUnItemOpen(false);
        }}
      />

      {/* 내부 Alert / Confirm 모달 */}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          onKeyDown={(e) => { if (e.key === "Escape" && dialog.type === "alert") setDialog(null); }}>
          <div className="w-80 rounded-lg bg-background shadow-xl border p-5 flex flex-col gap-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <Button variant="outline" size="sm"
                  onClick={() => setDialog(null)}>
                  취소
                </Button>
              )}
              <Button size="sm"
                onClick={() => {
                  if (dialog.type === "confirm") dialog.onConfirm();
                  setDialog(null);
                }}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 모델 팝업 (구매입고참조) */}
      {isUnModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => { if (e.key === "Escape") setIsUnModelOpen(false); }}>
          <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">모델 선택</h3>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setIsUnModelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={unModelSearch}
              onChange={(e) => { setUnModelSearch(e.target.value); setUnModelIdx(-1); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setUnModelIdx((p) => Math.min(p + 1, filteredModelList.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setUnModelIdx((p) => Math.max(p - 1, -1)); }
                else if (e.key === "Enter") {
                  e.preventDefault();
                  const t = unModelIdx >= 0 ? filteredModelList[unModelIdx]
                    : filteredModelList.length === 1 ? filteredModelList[0] : null;
                  if (t) { setUnSearch((p) => ({ ...p, model: t })); setIsUnModelOpen(false); }
                }
              }}
              placeholder="모델명 검색"
              className="h-8 text-xs mb-2"
              autoFocus
            />
            <div className="h-[260px] rounded border overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr><th className="px-3 py-1.5 text-left">모델</th></tr>
                </thead>
                <tbody>
                  {filteredModelList.length === 0 ? (
                    <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                  ) : filteredModelList.map((m, idx) => (
                    <tr key={m}
                      ref={idx === unModelIdx ? unModelRowRef : null}
                      className={`cursor-pointer border-t ${idx === unModelIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40" : "hover:bg-muted"}`}
                      onClick={() => {
                        setUnSearch((p) => ({ ...p, model: m }));
                        setIsUnModelOpen(false);
                      }}>
                      <td className="px-3 py-1.5">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              <span className="font-semibold">{filteredModelList.length}</span>건
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
