"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemSelectModal } from "@/components/common/item-select-modal";
import { SupplierSelectPopup } from "@/components/common/supplier-select-popup";
import { formatCurrency } from "@/lib/utils";
import { Search, RotateCcw, Save, PackageCheck, X, Printer, FileText, ChevronDown } from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type POListItem = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  buyerName: string;
  totalAmount: number;
};

type SpecRow = {
  seq: number;
  itemCode: string;
  itemName: string;
  specification: string;
  warehouse: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  inputQty: number;
  returnQty: number;
  receiptDate: string;
  lotNo: string;
  note: string;
  unit: string;
  vehicleModel: string;
  storageLocation: string;
};

type FlatSpecRow = SpecRow & {
  poId: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  orderDate: string;
  uid: string; // `${poId}::${itemCode}`
};

type PoGroup = {
  poId: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  orderStatus: string;
  rows: FlatSpecRow[];
};

type HistoryEntry = {
  id: string;
  receiptNo: string;
  processedAt: string;
  type: "입고" | "반품";
  itemCode: string;
  itemName: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  lotNo: string;
  note: string;
  unit: string;
  vehicleModel: string;
  storageLocation: string;
  poNumber?: string;
  seq?: number;
};

type ReturnSlipItem = {
  seq: number;
  itemCode: string;
  itemName: string;
  specification: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  lotNo: string;
  note: string;
};

type ReturnSlip = {
  slipNo: string;
  processedAt: string;
  po: POListItem;
  items: ReturnSlipItem[];
};

type HistorySearchItem = {
  id: string;
  receiptNo: string;
  processedAt: string;
  type: "입고" | "반품";
  itemCode: string;
  itemName: string;
  qty: number;
  receiptDate: string;
  warehouse: string;
  lotNo: string;
  note: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  businessPlace: string;
  unitPrice: number;
  receiptAmount: number;
  storageLocation: string;
  unit: string;
  vehicleModel: string;
  specNo: number;
};

// ── 키보드 지원 커스텀 셀렉트 ─────────────────────────────────────────────────

function DropdownSelect({
  value,
  onChange,
  onNext,
  options,
  triggerRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  options: { value: string; label: string }[];
  triggerRef?: RefObject<HTMLButtonElement>;
}) {
  const [open, setOpen] = useState(false);
  const [hIdx, setHIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  const select = (opt: { value: string; label: string }, idx: number) => {
    onChange(opt.value);
    setOpen(false);
    setHIdx(idx);
    setTimeout(() => onNext(), 0);
  };

  const openDropdown = () => {
    const idx = options.findIndex((o) => o.value === value);
    setHIdx(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="h-7 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (open) {
              if (hIdx >= 0 && hIdx < options.length) select(options[hIdx], hIdx);
              else { setOpen(false); onNext(); }
            } else {
              openDropdown();
            }
          } else if (e.key === " ") {
            e.preventDefault();
            open ? setOpen(false) : openDropdown();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) { openDropdown(); return; }
            setHIdx((p) => Math.min(p + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHIdx((p) => Math.max(p - 1, 0));
          } else if (e.key === "Escape") {
            e.stopPropagation();
            setOpen(false);
          } else if (e.key === "Tab") {
            setOpen(false);
          }
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-0.5 w-full rounded-md border bg-background shadow-md">
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              className={`px-3 py-1.5 text-xs cursor-pointer ${
                idx === hIdx ? "bg-sky-100 dark:bg-sky-500/20" : "hover:bg-muted"
              }`}
              onMouseDown={(e) => { e.preventDefault(); select(opt, idx); }}
              onMouseEnter={() => setHIdx(idx)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function PurchaseReceiptsPage() {
  const [activeTab, setActiveTab] = useState("history");

  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string; displayLabel?: string }[]>([]);
  useEffect(() => {
    fetch("/api/common-codes?category=warehouse")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok)
          setWarehouseOptions(data.items.map((c: { Code: string; Name: string }) => ({
            value: c.Code,
            label: `${c.Code} ${c.Name}`,
            displayLabel: c.Name,
          })));
      })
      .catch(() => {});
  }, []);

  // ── 이력선택 탭 상태 ────────────────────────────────────────────────────────
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [hDateFrom, setHDateFrom]         = useState(firstOfMonth);
  const [hDateTo, setHDateTo]             = useState(todayStr);
  const [hItemCode, setHItemCode]         = useState("");
  const [hItemName, setHItemName]         = useState("");
  const [hWarehouse, setHWarehouse]       = useState("");
  const [hSupplierCode, setHSupplierCode] = useState("");
  const [hSupplierName, setHSupplierName] = useState("");
  const [hModel, setHModel]               = useState("");
  const [hType, setHType]                 = useState("");

  const [isItemModalOpen, setIsItemModalOpen]         = useState(false);
  const [isSupplierPopupOpen, setIsSupplierPopupOpen] = useState(false);
  const [isModelPopupOpen, setIsModelPopupOpen]       = useState(false);
  const [modelList, setModelList]                     = useState<string[]>([]);
  const [modelSubSearch, setModelSubSearch]           = useState("");
  const [modelSubIdx, setModelSubIdx]                 = useState(-1);
  const modelSubRowRef = useRef<HTMLTableRowElement>(null);

  // 검색 패널 필드 refs (Enter 네비게이션용)
  const refDateFrom     = useRef<HTMLInputElement>(null);
  const refDateTo       = useRef<HTMLInputElement>(null);
  const refItemCode     = useRef<HTMLInputElement>(null);
  const refWarehouse    = useRef<HTMLButtonElement>(null);
  const refSupplierCode = useRef<HTMLInputElement>(null);
  const refModel        = useRef<HTMLInputElement>(null);
  const refType         = useRef<HTMLButtonElement>(null);
  const refSearchBtn    = useRef<HTMLButtonElement>(null);

  // 모델 목록 로드 (최초 1회)
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const s = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.items.forEach((x: any) => { if (x.VehicleModel) s.add(x.VehicleModel); });
        setModelList(Array.from(s).sort());
      })
      .catch(() => {});
  }, []);

  useEffect(() => { modelSubRowRef.current?.scrollIntoView({ block: "nearest" }); }, [modelSubIdx]);

  const filteredModelList = useMemo(() => {
    const kw = modelSubSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [modelSubSearch, modelList]);

  const [historyItems, setHistoryItems]         = useState<HistorySearchItem[]>([]);
  const [historyTotalQty, setHistoryTotalQty]   = useState(0);
  const [historyTotalAmount, setHistoryTotalAmount] = useState(0);
  const [historyLoading, setHistoryLoading]     = useState(false);

  // ── 이력 인라인 편집 ─────────────────────────────────────────────────────────
  type HistoryEditDraft = { receiptDate: string; qty: string; unitPrice: string };
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [historyDraft,     setHistoryDraft]     = useState<HistoryEditDraft>({ receiptDate: "", qty: "", unitPrice: "" });
  const editDateRef      = useRef<HTMLInputElement>(null);
  const editQtyRef       = useRef<HTMLInputElement>(null);
  const editUnitPriceRef = useRef<HTMLInputElement>(null);
  const editSaveBtnRef   = useRef<HTMLButtonElement>(null);
  const [historySaving,    setHistorySaving]    = useState(false);

  const startEditHistory = (h: HistorySearchItem) => {
    setEditingHistoryId(h.id);
    setHistoryDraft({
      receiptDate: h.receiptDate ?? "",
      qty:         String(h.qty),
      unitPrice:   String(h.unitPrice ?? ""),
    });
  };

  const cancelEditHistory = () => setEditingHistoryId(null);

  const saveEditHistory = async () => {
    if (!editingHistoryId || historySaving) return;
    setHistorySaving(true);
    try {
      const res = await fetch(`/api/purchase-receipts/history/${editingHistoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptDate: historyDraft.receiptDate,
          qty:         Number(historyDraft.qty)       || 0,
          unitPrice:   Number(historyDraft.unitPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setNotifyModal({ open: true, title: "수정 실패", message: data.message ?? "수정 실패" }); return; }
      // 로컬 state 갱신
      const newQty    = Number(historyDraft.qty)       || 0;
      const newPrice  = Number(historyDraft.unitPrice) || 0;
      setHistoryItems((prev) => prev.map((h) =>
        h.id === editingHistoryId
          ? { ...h, receiptDate: historyDraft.receiptDate, qty: newQty, unitPrice: newPrice, receiptAmount: Math.round(newQty * newPrice) }
          : h
      ));
      setHistoryTotalQty((prev) => {
        const old = historyItems.find((h) => h.id === editingHistoryId);
        return prev - (old?.qty ?? 0) + newQty;
      });
      setHistoryTotalAmount((prev) => {
        const old = historyItems.find((h) => h.id === editingHistoryId);
        return prev - (old?.receiptAmount ?? 0) + Math.round(newQty * newPrice);
      });
      setEditingHistoryId(null);
    } catch {
      setNotifyModal({ open: true, title: "오류", message: "수정 중 오류가 발생했습니다." });
    } finally {
      setHistorySaving(false);
    }
  };

  const loadHistory = () => {
    const params = new URLSearchParams();
    if (hDateFrom)            params.set("dateFrom",      hDateFrom);
    if (hDateTo)              params.set("dateTo",        hDateTo);
    if (hItemCode.trim())     params.set("itemCode",      hItemCode.trim());
    if (hWarehouse)           params.set("warehouse",     hWarehouse);
    if (hSupplierCode.trim()) params.set("supplierCode",  hSupplierCode.trim());
    if (hType)                params.set("type",          hType);
    if (hModel.trim())        params.set("model",         hModel.trim());

    setHistoryLoading(true);
    fetch(`/api/purchase-receipts/history?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setHistoryItems(data.items);
          setHistoryTotalQty(data.totalQty);
          setHistoryTotalAmount(data.totalAmount);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const resetHistory = () => {
    setHDateFrom(firstOfMonth); setHDateTo(todayStr);
    setHItemCode(""); setHItemName("");
    setHWarehouse(""); setHSupplierCode(""); setHSupplierName("");
    setHModel(""); setHType("");
  };

  const resetRegister = () => {
    setSearchDateFrom(firstOfMonth); setSearchDateTo(todayStr);
    setRItemCode(""); setRItemName("");
    setRSupplierCode(""); setRSupplierName("");
    setRModel("");
    setRIncludeComplete(false);
  };

  // ── 등록작업 탭 상태 ────────────────────────────────────────────────────────
  const [searchDateFrom, setSearchDateFrom] = useState(firstOfMonth);
  const [searchDateTo, setSearchDateTo]     = useState(todayStr);
  const [rItemCode, setRItemCode]           = useState("");
  const [rItemName, setRItemName]           = useState("");
  const [rSupplierCode, setRSupplierCode]   = useState("");
  const [rSupplierName, setRSupplierName]   = useState("");
  const [rModel, setRModel]                 = useState("");
  const [rIncludeComplete, setRIncludeComplete] = useState(false);

  const [rIsItemModalOpen, setRIsItemModalOpen]         = useState(false);
  const [rIsSupplierPopupOpen, setRIsSupplierPopupOpen] = useState(false);
  const [rIsModelPopupOpen, setRIsModelPopupOpen]       = useState(false);
  const [rModelSubSearch, setRModelSubSearch]           = useState("");
  const [rModelSubIdx, setRModelSubIdx]                 = useState(-1);
  const rModelSubRowRef = useRef<HTMLTableRowElement>(null);

  const rRefDateFrom     = useRef<HTMLInputElement>(null);
  const rRefDateTo       = useRef<HTMLInputElement>(null);
  const rRefItemCode     = useRef<HTMLInputElement>(null);
  const rRefSupplierCode = useRef<HTMLInputElement>(null);
  const rRefModel        = useRef<HTMLInputElement>(null);
  const rRefSearchBtn    = useRef<HTMLButtonElement>(null);

  const rFilteredModelList = useMemo(() => {
    const kw = rModelSubSearch.trim().toLowerCase();
    if (!kw) return modelList;
    return modelList.filter((m) => m.toLowerCase().includes(kw));
  }, [rModelSubSearch, modelList]);

  useEffect(() => { rModelSubRowRef.current?.scrollIntoView({ block: "nearest" }); }, [rModelSubIdx]);

  const [poList, setPoList]                 = useState<POListItem[]>([]);
  const [flatRows, setFlatRows]             = useState<FlatSpecRow[]>([]);
  const [loadingFlat, setLoadingFlat]       = useState(false);
  const [history, setHistory]               = useState<HistoryEntry[]>([]);
  const [historyItemCode, setHistoryItemCode] = useState<string | null>(null);
  const [returnSlip, setReturnSlip]         = useState<ReturnSlip | null>(null);
  const [notifyModal, setNotifyModal] = useState<{ open: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    if (!notifyModal?.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setNotifyModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notifyModal?.open]);

  const loadAllPending = async () => {
    setLoadingFlat(true);
    try {
      const res = await fetch("/api/purchase-receipts");
      const data = await res.json();
      if (!data.ok) return;
      const pos: POListItem[] = data.items;
      setPoList(pos);
      const allRows: FlatSpecRow[] = [];
      const allHistory: HistoryEntry[] = [];
      await Promise.all(
        pos.map(async (po) => {
          try {
            const d = await fetch(`/api/purchase-receipts/${po.id}`).then((r) => r.json());
            if (d.ok) {
              (d.specRows as SpecRow[]).forEach((row) =>
                allRows.push({ ...row, poId: po.id, poNumber: po.orderNumber, supplierCode: po.supplierId, supplierName: po.supplierName, orderDate: po.orderDate, uid: `${po.id}::${row.itemCode}` })
              );
              allHistory.push(...(d.history as HistoryEntry[]).map((h, i) => ({ ...h, poNumber: po.orderNumber, seq: i + 1 })));
            }
          } catch {}
        })
      );
      setFlatRows(allRows);
      setHistory(allHistory);
    } finally {
      setLoadingFlat(false);
    }
  };

  useEffect(() => { loadAllPending(); }, []);

  const filteredFlatRows = useMemo(() => {
    return flatRows.filter((r) => {
      if (searchDateFrom && r.orderDate < searchDateFrom) return false;
      if (searchDateTo   && r.orderDate > searchDateTo)   return false;
      if (rItemCode.trim()     && !r.itemCode.toLowerCase().includes(rItemCode.trim().toLowerCase())) return false;
      if (rSupplierCode.trim() && !r.supplierCode.toLowerCase().includes(rSupplierCode.trim().toLowerCase()) && !r.supplierName.toLowerCase().includes(rSupplierCode.trim().toLowerCase())) return false;
      if (rModel.trim()        && !r.vehicleModel.toLowerCase().includes(rModel.trim().toLowerCase())) return false;
      if (!rIncludeComplete    && r.pendingQty === 0) return false;
      return true;
    });
  }, [flatRows, searchDateFrom, searchDateTo, rItemCode, rSupplierCode, rModel, rIncludeComplete]);

  const groupedRows = useMemo<PoGroup[]>(() => {
    const groups: PoGroup[] = [];
    const seen = new Map<string, number>();
    filteredFlatRows.forEach((r) => {
      if (!seen.has(r.poId)) {
        const po = poList.find((p) => p.id === r.poId);
        seen.set(r.poId, groups.length);
        groups.push({ poId: r.poId, poNumber: r.poNumber, supplierName: r.supplierName, orderDate: r.orderDate, orderStatus: po?.orderStatus ?? "", rows: [] });
      }
      groups[seen.get(r.poId)!].rows.push(r);
    });
    return groups;
  }, [filteredFlatRows, poList]);

  const handleReceipt = async () => {
    const targets = flatRows.filter((r) => r.inputQty > 0);
    if (targets.length === 0) { setNotifyModal({ open: true, title: "알림", message: "입고수량이 1 이상인 품목이 없습니다." }); return; }
    const byPo = new Map<string, FlatSpecRow[]>();
    targets.forEach((r) => { if (!byPo.has(r.poId)) byPo.set(r.poId, []); byPo.get(r.poId)!.push(r); });
    const receiptNos: string[] = [];
    try {
      for (const [poId, rows] of Array.from(byPo.entries())) {
        const res = await fetch(`/api/purchase-receipts/${poId}/receive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: rows.map((r: FlatSpecRow) => ({ itemCode: r.itemCode, itemName: r.itemName, inputQty: r.inputQty, receiptDate: r.receiptDate, warehouse: r.warehouse, lotNo: r.lotNo, note: r.note })),
          }),
        });
        const data = await res.json();
        if (!data.ok) { setNotifyModal({ open: true, title: "입고처리 실패", message: data.message ?? "입고처리 실패" }); return; }
        receiptNos.push(data.receiptNo);
      }
      setNotifyModal({ open: true, title: "입고처리 완료", message: `${targets.length}건의 입고처리가 완료되었습니다.\n(${receiptNos.join(", ")})` });
      loadAllPending();
    } catch {
      setNotifyModal({ open: true, title: "오류", message: "입고처리 중 오류가 발생했습니다." });
    }
  };

  const handleReset = () => {
    setFlatRows((prev) => prev.map((r) => ({ ...r, inputQty: 0, returnQty: 0 })));
  };

  const handleReturn = async () => {
    const targets = flatRows.filter((r) => r.returnQty > 0);
    if (targets.length === 0) { setNotifyModal({ open: true, title: "알림", message: "반품수량이 1 이상인 품목이 없습니다." }); return; }
    for (const r of targets) {
      if (r.returnQty > r.receivedQty) {
        setNotifyModal({ open: true, title: "알림", message: `[${r.itemCode}] 반품수량(${r.returnQty})이 입고수량(${r.receivedQty})을 초과합니다.` });
        return;
      }
    }
    const byPo = new Map<string, FlatSpecRow[]>();
    targets.forEach((r) => { if (!byPo.has(r.poId)) byPo.set(r.poId, []); byPo.get(r.poId)!.push(r); });
    const now = new Date();
    let lastSlip: ReturnSlip | null = null;
    try {
      for (const [poId, rows] of Array.from(byPo.entries())) {
        const po = poList.find((p) => p.id === poId);
        if (!po) continue;
        const res = await fetch(`/api/purchase-receipts/${poId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: rows.map((r: FlatSpecRow) => ({ itemCode: r.itemCode, itemName: r.itemName, returnQty: r.returnQty, receiptDate: r.receiptDate, warehouse: r.warehouse, lotNo: r.lotNo, note: r.note })),
          }),
        });
        const data = await res.json();
        if (!data.ok) { setNotifyModal({ open: true, title: "반품처리 실패", message: data.message ?? "반품처리 실패" }); return; }
        lastSlip = {
          slipNo: data.returnNo,
          processedAt: now.toISOString().slice(0, 16).replace("T", " "),
          po,
          items: rows.map((r: FlatSpecRow, i: number) => ({
            seq: i + 1, itemCode: r.itemCode, itemName: r.itemName,
            specification: r.specification, qty: r.returnQty,
            receiptDate: r.receiptDate, warehouse: r.warehouse,
            lotNo: r.lotNo, note: r.note,
          })),
        };
      }
      if (lastSlip) setReturnSlip(lastSlip);
      loadAllPending();
    } catch {
      setNotifyModal({ open: true, title: "오류", message: "반품처리 중 오류가 발생했습니다." });
    }
  };

  const updateRow = <K extends keyof SpecRow>(uid: string, field: K, value: SpecRow[K]) => {
    setFlatRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r)));
  };

  const handlePrint = () => {
    if (!returnSlip) return;
    const slip = returnSlip;

    const buildCopy = (label: string, bc: string) => {
      const minRows = 19;
      const items = [...slip.items];
      while (items.length < minRows)
        items.push({ seq: -1, itemCode: "", itemName: "", specification: "", qty: 0, receiptDate: "", warehouse: "", lotNo: "", note: "" });
      const totalQty = slip.items.reduce((s, i) => s + i.qty, 0);

      const dataRows = items.map((item) => `
        <tr>
          <td class="dc" style="text-align:center">${item.receiptDate ? item.receiptDate.slice(5).replace("-", "/") : "&nbsp;"}</td>
          <td class="dc" colspan="2">${item.seq > 0 ? `${item.itemName}${item.specification ? ` / ${item.specification}` : ""}` : "&nbsp;"}</td>
          <td class="dc" style="text-align:center">${item.seq > 0 && item.qty > 0 ? "EA" : "&nbsp;"}</td>
          <td class="dc" style="text-align:right">${item.seq > 0 && item.qty > 0 ? item.qty.toLocaleString("ko-KR") : "&nbsp;"}</td>
          <td class="dc">&nbsp;</td>
          <td class="dc" colspan="2">&nbsp;</td>
          <td class="dc">&nbsp;</td>
          <td class="dc">${item.seq > 0 && item.note ? item.note : "&nbsp;"}</td>
        </tr>`).join("");

      return `
      <div class="copy" style="border:2px solid ${bc}">
        <div style="font-size:10px;color:${bc};padding:1px 4px">〈${label}〉</div>
        <table>
          <colgroup>
            <col style="width:6%"><col style="width:13%"><col style="width:12%">
            <col style="width:6%"><col style="width:8%"><col style="width:10%">
            <col style="width:9%"><col style="width:9%"><col style="width:10%">
            <col style="width:17%">
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="2" colspan="4" class="sc" style="font-size:18px;font-weight:bold;text-align:center;color:${bc};height:12mm;line-height:1.2">
                거래명세표<div style="font-size:10px;font-weight:normal;color:#dc2626;margin-top:2px">（반 품）</div>
              </td>
              <td class="sc" style="text-align:center;color:${bc}">일자</td>
              <td class="sc" colspan="2">${slip.processedAt.slice(0, 10)}</td>
              <td class="sc" style="text-align:center;color:${bc}">No</td>
              <td class="sc" colspan="2" style="font-size:9px">${slip.slipNo}</td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">공급자<br>연락처</td>
              <td class="sc" colspan="5"></td>
            </tr>
            <tr>
              <td class="sc" colspan="5" style="text-align:center;color:${bc};font-weight:bold">공 급 자</td>
              <td class="sc" colspan="5" style="text-align:center;color:${bc};font-weight:bold">공 급 받 는 자</td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">상호</td>
              <td class="sc" colspan="2">주식회사 프로큐어허브</td>
              <td class="sc" style="text-align:center;color:${bc}">성명</td>
              <td class="sc">${slip.po.buyerName} <span style="color:${bc}">(인)</span></td>
              <td class="sc" style="text-align:center;color:${bc}">상호</td>
              <td class="sc" colspan="2">${slip.po.supplierName}</td>
              <td class="sc" style="text-align:center;color:${bc}">성명</td>
              <td class="sc"><span style="color:${bc}">(인)</span></td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">주소</td>
              <td class="sc" colspan="4"></td>
              <td class="sc" style="text-align:center;color:${bc}">주소</td>
              <td class="sc" colspan="4"></td>
            </tr>
            <tr>
              <td class="sc" style="text-align:center;color:${bc}">업태</td>
              <td class="sc"></td>
              <td class="sc" style="text-align:center;color:${bc}">종목</td>
              <td class="sc" colspan="2"></td>
              <td class="sc" style="text-align:center;color:${bc}">비고</td>
              <td class="sc" colspan="2">반품</td>
              <td class="sc" style="text-align:center;color:${bc}">인수자</td>
              <td class="sc"></td>
            </tr>
            <tr>
              <td class="hdr">월일</td>
              <td class="hdr" colspan="2">품명 / 규격</td>
              <td class="hdr">단위</td>
              <td class="hdr">수량</td>
              <td class="hdr">단가</td>
              <td class="hdr" colspan="2">공급가액</td>
              <td class="hdr">세액</td>
              <td class="hdr">비고/합계</td>
            </tr>
            ${dataRows}
            <tr>
              <td class="sc" colspan="4" style="text-align:center;font-weight:bold">합 계</td>
              <td class="sc" style="text-align:right;font-weight:bold">${totalQty.toLocaleString("ko-KR")}</td>
              <td class="sc"></td>
              <td class="sc" colspan="2"></td>
              <td class="sc" style="text-align:right;color:${bc}">전 잔금</td>
              <td class="sc" style="text-align:right">₩</td>
            </tr>
            <tr>
              <td class="sc" colspan="4" style="text-align:center">메 모</td>
              <td class="sc" colspan="4"></td>
              <td class="sc" style="text-align:right;color:${bc}">총 잔금</td>
              <td class="sc" style="text-align:right">₩</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    };

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "맑은 고딕", "Malgun Gothic", sans-serif; font-size: 10px; }
  .page { width: 194mm; height: 281mm; display: flex; flex-direction: column; }
  .copy { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
  .copy table { width: 100%; border-collapse: collapse; table-layout: fixed; flex: 1; }
  .divider { height: 5mm; border-top: 2px dashed #9ca3af; flex-shrink: 0; }
  .sc { border: 1px solid currentColor; padding: 1px 4px; font-size: 10px; vertical-align: middle; }
  .dc { border: 1px dashed currentColor; padding: 1px 3px; font-size: 10px; vertical-align: middle; height: 5mm; }
  .hdr { border: 1px solid currentColor; padding: 1px 4px; font-size: 10px; vertical-align: middle; text-align: center; font-weight: bold; background-color: #f5f5f5; }
  .page-break { page-break-after: always; break-after: page; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head><body>
<div class="page">
  ${buildCopy("공급 받는 자 보관용", "#1a56db")}
  <div class="divider"></div>
  ${buildCopy("공급자 보관용", "#e02424")}
</div>
<div class="page-break"></div>
<div class="page">
  ${buildCopy("경비실용", "#16a34a")}
  <div class="divider"></div>
  ${buildCopy("품질용", "#9333ea")}
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}<\/script>
</body></html>`;

    const pw = window.open("", "_blank", "width=794,height=1200");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
  };

  const renderSlipCopy = (slip: ReturnSlip, label: string, color: string) => {
    const bc = color;
    const sc = (extra?: object) =>
      ({ border: `1px solid ${bc}`, padding: "1px 4px", fontSize: "10px", verticalAlign: "middle" as const, ...extra });
    const dc = (extra?: object) =>
      ({ border: `1px dashed ${bc}`, padding: "1px 3px", fontSize: "10px", verticalAlign: "middle" as const, height: "5mm", ...extra });
    const hdr = (extra?: object) =>
      sc({ textAlign: "center" as const, color: bc, fontWeight: "bold", backgroundColor: "#f5f5f5", ...extra });

    const minRows = 22;
    const padded: ReturnSlipItem[] = [...slip.items];
    while (padded.length < minRows)
      padded.push({ seq: -1, itemCode: "", itemName: "", specification: "", qty: 0, receiptDate: "", warehouse: "", lotNo: "", note: "" });

    const totalQty = slip.items.reduce((s, i) => s + i.qty, 0);

    return (
      <div className="rtn-slip-copy" style={{ border: `2px solid ${bc}`, marginBottom: "8px" }}>
        <div style={{ fontSize: "10px", color: bc, padding: "1px 4px" }}>〈{label}〉</div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "6%" }} /><col style={{ width: "13%" }} /><col style={{ width: "12%" }} />
            <col style={{ width: "6%" }} /><col style={{ width: "8%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} /><col style={{ width: "9%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} colSpan={4} style={sc({ fontSize: "18px", fontWeight: "bold", textAlign: "center" as const, color: bc, height: "44px", lineHeight: "1.2" })}>
                거래명세표
                <div style={{ fontSize: "10px", fontWeight: "normal", color: "#dc2626", marginTop: "2px" }}>（반 품）</div>
              </td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>일자</td>
              <td colSpan={2} style={sc()}>{slip.processedAt.slice(0, 10)}</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>No</td>
              <td colSpan={2} style={sc({ fontSize: "9px" })}>{slip.slipNo}</td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, fontSize: "10px", color: bc })}>공급자{"\n"}연락처</td>
              <td colSpan={5} style={sc()}></td>
            </tr>
            <tr>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 자</td>
              <td colSpan={5} style={sc({ textAlign: "center" as const, color: bc, fontWeight: "bold" })}>공 급 받 는 자</td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>주식회사 프로큐어허브</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}>{slip.po.buyerName} <span style={{ color: bc }}>(인)</span></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>상호</td>
              <td colSpan={2} style={sc()}>{slip.po.supplierName}</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>성명</td>
              <td style={sc()}><span style={{ color: bc }}>(인)</span></td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>주소</td>
              <td colSpan={4} style={sc()}></td>
            </tr>
            <tr>
              <td style={sc({ textAlign: "center" as const, color: bc })}>업태</td>
              <td style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>종목</td>
              <td colSpan={2} style={sc()}></td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>비고</td>
              <td colSpan={2} style={sc()}>반품</td>
              <td style={sc({ textAlign: "center" as const, color: bc })}>인수자</td>
              <td style={sc()}></td>
            </tr>
            <tr>
              <td style={hdr()}>월일</td>
              <td colSpan={2} style={hdr()}>품명 / 규격</td>
              <td style={hdr()}>단위</td>
              <td style={hdr()}>수량</td>
              <td style={hdr()}>단가</td>
              <td colSpan={2} style={hdr()}>공급가액</td>
              <td style={hdr()}>세액</td>
              <td style={hdr()}>비고/합계</td>
            </tr>
            {padded.map((item, i) => (
              <tr key={i}>
                <td style={dc({ textAlign: "center" as const })}>
                  {item.receiptDate ? item.receiptDate.slice(5).replace("-", "/") : "\u00A0"}
                </td>
                <td colSpan={2} style={dc()}>
                  {item.seq > 0 ? `${item.itemName}${item.specification ? ` / ${item.specification}` : ""}` : "\u00A0"}
                </td>
                <td style={dc({ textAlign: "center" as const })}>
                  {item.seq > 0 && item.qty > 0 ? "EA" : "\u00A0"}
                </td>
                <td style={dc({ textAlign: "right" as const })}>
                  {item.seq > 0 && item.qty > 0 ? item.qty.toLocaleString("ko-KR") : "\u00A0"}
                </td>
                <td style={dc()}>{"\u00A0"}</td>
                <td colSpan={2} style={dc()}>{"\u00A0"}</td>
                <td style={dc()}>{"\u00A0"}</td>
                <td style={dc()}>
                  {item.seq > 0 && item.note ? item.note : "\u00A0"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={sc({ textAlign: "center" as const, fontWeight: "bold" })}>합 계</td>
              <td style={sc({ textAlign: "right" as const, fontWeight: "bold" })}>{totalQty.toLocaleString("ko-KR")}</td>
              <td style={sc()}>{"\u00A0"}</td>
              <td colSpan={2} style={sc()}>{"\u00A0"}</td>
              <td style={sc({ textAlign: "right" as const, color: bc })}>전 잔금</td>
              <td style={sc({ textAlign: "right" as const })}>₩</td>
            </tr>
            <tr>
              <td colSpan={4} style={sc({ textAlign: "center" as const })}>메 모</td>
              <td colSpan={4} style={sc()}>{"\u00A0"}</td>
              <td style={sc({ textAlign: "right" as const, color: bc })}>총 잔금</td>
              <td style={sc({ textAlign: "right" as const })}>₩</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "issued":    return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "confirmed": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400";
      case "partial":   return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      case "received":  return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      default:          return "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground";
    }
  };
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      issued: "발주", confirmed: "확정", partial: "부분입고", received: "입고완료",
    };
    return map[status] ?? status;
  };

  const modalItemHistory = historyItemCode ? history.filter((h) => h.itemCode === historyItemCode) : [];
  const modalItemName = modalItemHistory[0]?.itemName ?? historyItemCode ?? "";
  const modalTotalQty = modalItemHistory.reduce((s, h) => s + h.qty, 0);

  return (
    <>
    <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 7rem)" }}>
      <PageHeader
        title="구매입고처리"
        description="구매 입고 이력을 조회하거나 발주된 구매오더를 선택하여 입고/반품 처리합니다."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 self-start h-9">
          <TabsTrigger value="history" className="text-xs px-5">이력선택</TabsTrigger>
          <TabsTrigger value="register" className="text-xs px-5">등록작업</TabsTrigger>
        </TabsList>

        {/* ══ 이력선택 탭 ══════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 pt-2">
            {/* 검색 패널 */}
            <Card className="shrink-0">
              <CardContent className="p-3">
                {/* 조건 1행 */}
                <div className="flex items-end gap-3 mb-3">
                  {/* 입고일자 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">입고일자</label>
                    <div className="flex gap-1 items-center">
                      <Input
                        ref={refDateFrom}
                        type="date" value={hDateFrom}
                        onChange={(e) => setHDateFrom(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refDateTo.current?.focus(); } }}
                        className="h-7 text-xs w-[130px]"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">~</span>
                      <Input
                        ref={refDateTo}
                        type="date" value={hDateTo}
                        onChange={(e) => setHDateTo(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refItemCode.current?.focus(); } }}
                        className="h-7 text-xs w-[130px]"
                      />
                    </div>
                  </div>

                  {/* 품목번호 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">품목번호</label>
                    <div className="flex gap-1">
                      <Input
                        ref={refItemCode}
                        value={hItemCode}
                        onChange={(e) => { setHItemCode(e.target.value); setHItemName(""); }}
                        placeholder="품목번호"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); setIsItemModalOpen(true); }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0" onClick={() => setIsItemModalOpen(true)}>
                        <Search className="h-3 w-3" />
                      </Button>
                      <Input value={hItemName} readOnly placeholder="품목명"
                        className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
                    </div>
                  </div>

                  {/* 구매처코드 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">구매처</label>
                    <div className="flex gap-1">
                      <Input
                        ref={refSupplierCode}
                        value={hSupplierCode}
                        onChange={(e) => { setHSupplierCode(e.target.value); setHSupplierName(""); }}
                        placeholder="코드"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); setIsSupplierPopupOpen(true); }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0" onClick={() => setIsSupplierPopupOpen(true)}>
                        <Search className="h-3 w-3" />
                      </Button>
                      <Input value={hSupplierName} readOnly placeholder="구매처명"
                        className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
                    </div>
                  </div>

                  {/* 모델 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">모델</label>
                    <div className="flex gap-1">
                      <Input
                        ref={refModel}
                        value={hModel}
                        onChange={(e) => setHModel(e.target.value)}
                        placeholder="모델"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setModelSubSearch(hModel); setModelSubIdx(-1); setIsModelPopupOpen(true);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => { setModelSubSearch(hModel); setModelSubIdx(-1); setIsModelPopupOpen(true); }}>
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 창고 */}
                  <div className="flex flex-col gap-1 shrink-0 w-40">
                    <label className="text-xs font-medium text-muted-foreground">창고</label>
                    <DropdownSelect
                      triggerRef={refWarehouse}
                      value={hWarehouse}
                      onChange={setHWarehouse}
                      onNext={() => refType.current?.focus()}
                      options={[{ value: "", label: "전체" }, ...warehouseOptions]}
                    />
                  </div>

                  {/* 입고구분 */}
                  <div className="flex flex-col gap-1 shrink-0 w-40">
                    <label className="text-xs font-medium text-muted-foreground">입고구분</label>
                    <DropdownSelect
                      triggerRef={refType}
                      value={hType}
                      onChange={setHType}
                      onNext={() => refSearchBtn.current?.focus()}
                      options={[
                        { value: "", label: "전체" },
                        { value: "입고", label: "입고" },
                        { value: "반품", label: "반품" },
                      ]}
                    />
                  </div>
                </div>

                {/* 버튼 행 */}
                <div className="flex items-center gap-2 pt-2.5 border-t">
                  <Button
                    ref={refSearchBtn}
                    type="button"
                    size="sm"
                    onClick={loadHistory}
                    disabled={historyLoading}
                    className="h-8 px-4"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadHistory(); } }}
                  >
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                    검색
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resetHistory}
                    className="h-8 px-3"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    필터 초기화
                  </Button>
                  <span className="ml-auto text-xs text-muted-foreground">
                    총{" "}
                    <span className="font-semibold text-foreground">
                      {historyItems.length.toLocaleString("ko-KR")}
                    </span>
                    건이 조회되었습니다.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 모델 팝업 */}
            {isModelPopupOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                onKeyDown={(e) => { if (e.key === "Escape") { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); } }}>
                <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">모델 선택</h3>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setIsModelPopupOpen(false); setTimeout(() => refModel.current?.focus(), 0); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={modelSubSearch}
                    onChange={(e) => { setModelSubSearch(e.target.value); setModelSubIdx(-1); }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") { e.preventDefault(); setModelSubIdx((p) => Math.min(p + 1, filteredModelList.length - 1)); }
                      else if (e.key === "ArrowUp") { e.preventDefault(); setModelSubIdx((p) => Math.max(p - 1, -1)); }
                      else if (e.key === "Enter") {
                        e.preventDefault();
                        const target = modelSubIdx >= 0 ? filteredModelList[modelSubIdx]
                          : filteredModelList.length === 1 ? filteredModelList[0] : null;
                        if (target) {
                          setHModel(target);
                          setIsModelPopupOpen(false);
                          setTimeout(() => refWarehouse.current?.focus(), 0);
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
                        <tr><th className="px-3 py-1.5 text-left">모델</th></tr>
                      </thead>
                      <tbody>
                        {filteredModelList.length === 0 ? (
                          <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                        ) : filteredModelList.map((m, idx) => (
                          <tr
                            key={m}
                            ref={idx === modelSubIdx ? modelSubRowRef : null}
                            className={`cursor-pointer border-t ${idx === modelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40" : "hover:bg-muted"}`}
                            onClick={() => {
                              setHModel(m);
                              setIsModelPopupOpen(false);
                              setTimeout(() => refWarehouse.current?.focus(), 0);
                            }}
                          >
                            <td className="px-3 py-1.5">{m}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 데이터 그리드 */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 border-b">
                      <tr>
                        <th className="px-2 py-2 text-left w-32">구매오더번호</th>
                        <th className="px-2 py-2 text-center w-12">순번</th>
                        <th className="px-2 py-2 text-center w-14">구분</th>
                        <th className="px-2 py-2 text-center w-24">입고일자</th>
                        <th className="px-2 py-2 text-left w-32">품목번호</th>
                        <th className="px-2 py-2 text-left">품목명</th>
                        <th className="px-2 py-2 text-center w-20">창고</th>
                        <th className="px-2 py-2 text-left w-24">저장위치</th>
                        <th className="px-2 py-2 text-center w-14">단위</th>
                        <th className="px-2 py-2 text-left w-28">모델</th>
                        <th className="px-2 py-2 text-right w-16">입고량</th>
                        <th className="px-2 py-2 text-right w-20">입고단가</th>
                        <th className="px-2 py-2 text-right w-24">입고금액</th>
                        <th className="px-2 py-2 text-left w-20">거래처코드</th>
                        <th className="px-2 py-2 text-left w-28">거래처명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan={15} className="py-10 text-center text-xs text-muted-foreground">조회 중...</td>
                        </tr>
                      ) : historyItems.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="py-10 text-center text-xs text-muted-foreground">
                            조회 조건을 입력하고 조회 버튼을 누르세요.
                          </td>
                        </tr>
                      ) : (
                        historyItems.map((h, i) => {
                          const isEditing = editingHistoryId === h.id;
                          const rowBase = h.type === "반품"
                            ? "bg-red-50/40 dark:bg-red-500/10"
                            : i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : "";

                          if (isEditing) {
                            const editAmount = (Number(historyDraft.qty) || 0) * (Number(historyDraft.unitPrice) || 0);
                            return (
                              <tr key={h.id} className="border-b last:border-0 bg-yellow-50/60 dark:bg-yellow-500/10 ring-1 ring-inset ring-yellow-400/60">
                                <td className="px-2 py-1 font-mono text-[11px] text-primary">{h.poNumber}</td>
                                <td className="px-2 py-1 text-center text-muted-foreground">{h.specNo || "-"}</td>
                                <td className="px-2 py-1 text-center">
                                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                                    {h.type}
                                  </span>
                                </td>
                                {/* 입고일자 편집 */}
                                <td className="px-1 py-0.5">
                                  <input
                                    ref={editDateRef}
                                    type="date"
                                    value={historyDraft.receiptDate}
                                    onChange={(e) => setHistoryDraft((d) => ({ ...d, receiptDate: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") { e.preventDefault(); cancelEditHistory(); }
                                      if (e.key === "Enter")  { e.preventDefault(); editQtyRef.current?.focus(); }
                                    }}
                                    className="h-6 w-full rounded border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                    autoFocus
                                  />
                                </td>
                                <td className="px-2 py-1 font-mono">{h.itemCode}</td>
                                <td className="px-2 py-1">{h.itemName}</td>
                                <td className="px-2 py-1 text-center">{h.warehouse}</td>
                                <td className="px-2 py-1 text-muted-foreground">{h.storageLocation || "-"}</td>
                                <td className="px-2 py-1 text-center text-muted-foreground">{h.unit || "-"}</td>
                                <td className="px-2 py-1 text-muted-foreground">{h.vehicleModel || "-"}</td>
                                {/* 입고량 편집 */}
                                <td className="px-1 py-0.5">
                                  <input
                                    ref={editQtyRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={historyDraft.qty}
                                    onChange={(e) => setHistoryDraft((d) => ({ ...d, qty: e.target.value.replace(/[^0-9.]/g, "") }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") { e.preventDefault(); cancelEditHistory(); }
                                      if (e.key === "Enter")  { e.preventDefault(); editUnitPriceRef.current?.focus(); }
                                    }}
                                    className="h-6 w-full rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </td>
                                {/* 단가 편집 */}
                                <td className="px-1 py-0.5">
                                  <input
                                    ref={editUnitPriceRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={historyDraft.unitPrice}
                                    onChange={(e) => setHistoryDraft((d) => ({ ...d, unitPrice: e.target.value.replace(/[^0-9.]/g, "") }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") { e.preventDefault(); cancelEditHistory(); }
                                      if (e.key === "Enter")  { e.preventDefault(); editSaveBtnRef.current?.focus(); }
                                    }}
                                    className="h-6 w-full rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </td>
                                {/* 입고금액 자동계산 */}
                                <td className="px-2 py-1 text-right text-xs font-semibold text-yellow-700 dark:text-yellow-400 tabular-nums">
                                  {editAmount > 0 ? formatCurrency(Math.round(editAmount)) : "-"}
                                </td>
                                <td className="px-2 py-1 font-mono">{h.supplierCode}</td>
                                <td className="px-1 py-0.5 text-right" colSpan={1}>
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      ref={editSaveBtnRef}
                                      onClick={saveEditHistory}
                                      disabled={historySaving}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); saveEditHistory(); }
                                        if (e.key === "Escape") { e.preventDefault(); cancelEditHistory(); }
                                      }}
                                      className="h-6 px-2 rounded text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                      {historySaving ? "저장중" : "저장"}
                                    </button>
                                    <button
                                      onClick={cancelEditHistory}
                                      onKeyDown={(e) => { if (e.key === "Escape") cancelEditHistory(); }}
                                      className="h-6 px-2 rounded text-[10px] font-semibold bg-muted hover:bg-muted/80"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                          <tr
                            key={h.id}
                            className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 ${rowBase}`}
                            onDoubleClick={() => startEditHistory(h)}
                            title="더블클릭하여 수정"
                          >
                            <td className="px-2 py-1 font-mono text-[11px] text-primary">{h.poNumber}</td>
                            <td className="px-2 py-1 text-center text-muted-foreground">{h.specNo || "-"}</td>
                            <td className="px-2 py-1 text-center">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                                {h.type}
                              </span>
                            </td>
                            <td className="px-2 py-1 text-center">{h.receiptDate}</td>
                            <td className="px-2 py-1 font-mono">{h.itemCode}</td>
                            <td className="px-2 py-1">{h.itemName}</td>
                            <td className="px-2 py-1 text-center">{h.warehouse}</td>
                            <td className="px-2 py-1 text-muted-foreground">{h.storageLocation || "-"}</td>
                            <td className="px-2 py-1 text-center text-muted-foreground">{h.unit || "-"}</td>
                            <td className="px-2 py-1 text-muted-foreground">{h.vehicleModel || "-"}</td>
                            <td className={`px-2 py-1 text-right font-semibold ${h.type === "반품" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                              {h.qty.toLocaleString("ko-KR")}
                            </td>
                            <td className="px-2 py-1 text-right text-muted-foreground">
                              {h.unitPrice ? h.unitPrice.toLocaleString("ko-KR") : "-"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {h.receiptAmount ? formatCurrency(h.receiptAmount) : "-"}
                            </td>
                            <td className="px-2 py-1 font-mono">{h.supplierCode}</td>
                            <td className="px-2 py-1">{h.supplierName}</td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {historyItems.length > 0 && (
                  <div className="shrink-0 border-t bg-muted/40 px-3 py-1.5 flex gap-6 text-xs">
                    <span className="text-muted-foreground">
                      총 <strong className="text-foreground">{historyItems.length}</strong>건
                    </span>
                    <span className="text-muted-foreground">
                      총 수량: <strong className="text-blue-700 dark:text-blue-400">{historyTotalQty.toLocaleString("ko-KR")}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      총 입고금액: <strong className="text-blue-700 dark:text-blue-400">{formatCurrency(historyTotalAmount)}</strong>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ 등록작업 탭 ══════════════════════════════════════════════════════ */}
        {activeTab === "register" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 pt-2">
            {/* 검색 패널 */}
            <Card className="shrink-0">
              <CardContent className="p-3">
                {/* 조건 행 */}
                <div className="flex items-end gap-3 mb-3">
                  {/* 발주일자 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">발주일자</label>
                    <div className="flex gap-1 items-center">
                      <Input
                        ref={rRefDateFrom}
                        type="date" value={searchDateFrom}
                        onChange={(e) => setSearchDateFrom(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); rRefDateTo.current?.focus(); } }}
                        className="h-7 text-xs w-[130px]"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">~</span>
                      <Input
                        ref={rRefDateTo}
                        type="date" value={searchDateTo}
                        onChange={(e) => setSearchDateTo(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); rRefItemCode.current?.focus(); } }}
                        className="h-7 text-xs w-[130px]"
                      />
                    </div>
                  </div>

                  {/* 품목번호 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">품목번호</label>
                    <div className="flex gap-1">
                      <Input
                        ref={rRefItemCode}
                        value={rItemCode}
                        onChange={(e) => { setRItemCode(e.target.value); setRItemName(""); }}
                        placeholder="품목번호"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); setRIsItemModalOpen(true); }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0" onClick={() => setRIsItemModalOpen(true)}>
                        <Search className="h-3 w-3" />
                      </Button>
                      <Input value={rItemName} readOnly placeholder="품목명"
                        className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
                    </div>
                  </div>

                  {/* 구매처 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">구매처</label>
                    <div className="flex gap-1">
                      <Input
                        ref={rRefSupplierCode}
                        value={rSupplierCode}
                        onChange={(e) => { setRSupplierCode(e.target.value); setRSupplierName(""); }}
                        placeholder="코드"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); setRIsSupplierPopupOpen(true); }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0" onClick={() => setRIsSupplierPopupOpen(true)}>
                        <Search className="h-3 w-3" />
                      </Button>
                      <Input value={rSupplierName} readOnly placeholder="구매처명"
                        className="h-7 text-xs w-50 bg-muted text-muted-foreground" />
                    </div>
                  </div>

                  {/* 모델 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground">모델</label>
                    <div className="flex gap-1">
                      <Input
                        ref={rRefModel}
                        value={rModel}
                        onChange={(e) => setRModel(e.target.value)}
                        placeholder="모델"
                        className="h-7 text-xs w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setRModelSubSearch(rModel); setRModelSubIdx(-1); setRIsModelPopupOpen(true);
                          } else if (e.key === "Tab") {
                            rRefSearchBtn.current?.focus();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => { setRModelSubSearch(rModel); setRModelSubIdx(-1); setRIsModelPopupOpen(true); }}>
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                </div>

                {/* 버튼 행 */}
                <div className="flex items-center gap-2 pt-2.5 border-t">
                  <Button
                    ref={rRefSearchBtn}
                    type="button"
                    size="sm"
                    onClick={loadAllPending}
                    disabled={loadingFlat}
                    className="h-8 px-4"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadAllPending(); } }}
                  >
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                    {loadingFlat ? "로딩 중..." : "검색"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resetRegister}
                    className="h-8 px-3"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    필터 초기화
                  </Button>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none ml-2">
                    <input
                      type="checkbox"
                      checked={rIncludeComplete}
                      onChange={(e) => setRIncludeComplete(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-input accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">완료건 포함</span>
                  </label>
                  <span className="ml-auto text-xs text-muted-foreground">
                    총{" "}
                    <span className="font-semibold text-foreground">
                      {filteredFlatRows.length.toLocaleString("ko-KR")}
                    </span>
                    건이 조회되었습니다.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 등록작업 - 모델 팝업 */}
            {rIsModelPopupOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                onKeyDown={(e) => { if (e.key === "Escape") { setRIsModelPopupOpen(false); setTimeout(() => rRefModel.current?.focus(), 0); } }}>
                <div className="w-72 rounded-lg bg-background p-4 shadow-xl border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">모델 선택</h3>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setRIsModelPopupOpen(false); setTimeout(() => rRefModel.current?.focus(), 0); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={rModelSubSearch}
                    onChange={(e) => { setRModelSubSearch(e.target.value); setRModelSubIdx(-1); }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") { e.preventDefault(); setRModelSubIdx((p) => Math.min(p + 1, rFilteredModelList.length - 1)); }
                      else if (e.key === "ArrowUp") { e.preventDefault(); setRModelSubIdx((p) => Math.max(p - 1, -1)); }
                      else if (e.key === "Enter") {
                        e.preventDefault();
                        const target = rModelSubIdx >= 0 ? rFilteredModelList[rModelSubIdx]
                          : rFilteredModelList.length === 1 ? rFilteredModelList[0] : null;
                        if (target) {
                          setRModel(target);
                          setRIsModelPopupOpen(false);
                          setTimeout(() => rRefSearchBtn.current?.focus(), 0);
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
                        <tr><th className="px-3 py-1.5 text-left">모델</th></tr>
                      </thead>
                      <tbody>
                        {rFilteredModelList.length === 0 ? (
                          <tr><td className="px-3 py-4 text-center text-muted-foreground">조건에 맞는 모델이 없습니다.</td></tr>
                        ) : rFilteredModelList.map((m, idx) => (
                          <tr
                            key={m}
                            ref={idx === rModelSubIdx ? rModelSubRowRef : null}
                            className={`cursor-pointer border-t ${idx === rModelSubIdx ? "bg-sky-100 ring-1 ring-inset ring-sky-300 dark:bg-sky-500/20 dark:ring-sky-500/40" : "hover:bg-muted"}`}
                            onClick={() => {
                              setRModel(m);
                              setRIsModelPopupOpen(false);
                              setTimeout(() => rRefSearchBtn.current?.focus(), 0);
                            }}
                          >
                            <td className="px-3 py-1.5">{m}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 메인 카드 */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="p-3 pb-2 shrink-0 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">입고 / 반품 처리</span>
                    {groupedRows.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {groupedRows.length}개 발주 · {filteredFlatRows.length}개 품목
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleReset}
                      className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs h-8">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />초기화
                    </Button>
                    <Button type="button" size="sm" onClick={handleReceipt} className="text-xs h-8">
                      <Save className="mr-1.5 h-3.5 w-3.5" />입고처리
                    </Button>
                    <Button type="button" size="sm" onClick={handleReturn}
                      className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />반품처리
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {loadingFlat ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">발주 목록을 불러오는 중...</p>
                  </div>
                ) : groupedRows.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">처리 대기 중인 발주가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    {/* 입고처리 그리드 */}
                    <div className="overflow-auto flex-1 min-h-0 border-b">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted/80 border-b z-10">
                          <tr>
                            <th className="px-2 py-2 text-left w-32">발주번호</th>
                            <th className="px-2 py-2 text-center w-12">순번</th>
                            <th className="px-2 py-2 text-left w-36">품목번호</th>
                            <th className="px-2 py-2 text-left">품목명</th>
                            <th className="px-2 py-2 text-center w-24">창고</th>
                            <th className="px-2 py-2 text-left w-28">저장위치</th>
                            <th className="px-2 py-2 text-center w-14">단위</th>
                            <th className="px-2 py-2 text-left w-28">모델</th>
                            <th className="px-2 py-2 text-right w-16">발주량</th>
                            <th className="px-2 py-2 text-right w-16">입고량</th>
                            <th className="px-2 py-2 text-right w-16">입고잔량</th>
                            <th className="px-2 py-2 text-center w-20 bg-amber-50 dark:bg-amber-500/15">입고수량</th>
                            <th className="px-2 py-2 text-center w-20 bg-red-50 dark:bg-red-500/10">반품수량</th>
                            <th className="px-2 py-2 text-center w-32 bg-amber-50 dark:bg-amber-500/15">입고일자</th>
                            <th className="px-2 py-2 text-center w-28 bg-amber-50 dark:bg-amber-500/15">창고</th>
                            <th className="px-2 py-2 text-center w-24 bg-amber-50 dark:bg-amber-500/15">LOT번호</th>
                            <th className="px-2 py-2 text-left w-24 bg-amber-50 dark:bg-amber-500/15">비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFlatRows.map((row) => {
                            const isComplete = row.pendingQty === 0;
                            return (
                              <tr key={row.uid} className={`border-b last:border-0 ${isComplete ? "bg-green-50/60 dark:bg-green-500/10" : ""}`}>
                                <td className="px-2 py-1 font-mono text-[11px] text-primary">{row.poNumber}</td>
                                <td className="px-2 py-1 text-center text-muted-foreground">{row.seq}</td>
                                <td className="px-2 py-1 font-mono">{row.itemCode}</td>
                                <td className="px-2 py-1 font-medium">{row.itemName}</td>
                                <td className="px-2 py-1 text-center text-muted-foreground">{row.warehouse}</td>
                                <td className="px-2 py-1 text-muted-foreground">{row.storageLocation}</td>
                                <td className="px-2 py-1 text-center text-muted-foreground">{row.unit}</td>
                                <td className="px-2 py-1 text-muted-foreground">{row.vehicleModel}</td>
                                <td className="px-2 py-1 text-right">{row.orderedQty.toLocaleString("ko-KR")}</td>
                                <td className={`px-2 py-1 text-right font-semibold ${row.receivedQty > row.orderedQty ? "text-red-500 dark:text-red-400" : "text-foreground"}`}>
                                  {row.receivedQty > row.orderedQty
                                    ? `-${(row.receivedQty - row.orderedQty).toLocaleString("ko-KR")}`
                                    : row.receivedQty.toLocaleString("ko-KR")}
                                </td>
                                <td className={`px-2 py-1 text-right font-semibold ${isComplete ? "text-green-600 dark:text-green-400" : "text-orange-500"}`}>
                                  {isComplete ? "완료" : row.pendingQty.toLocaleString("ko-KR")}
                                </td>
                                <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10">
                                  <Input inputMode="numeric"
                                    value={row.inputQty > 0 ? row.inputQty.toLocaleString("ko-KR") : ""}
                                    placeholder="0"
                                    onChange={(e) => updateRow(row.uid, "inputQty", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                                    className="h-6 w-full text-xs text-right px-1 dark:bg-amber-500/10 dark:border-amber-600/30"
                                  />
                                </td>
                                <td className="px-1 py-1 bg-red-50 dark:bg-red-500/10">
                                  <Input inputMode="numeric" disabled={row.receivedQty === 0}
                                    value={row.returnQty > 0 ? row.returnQty.toLocaleString("ko-KR") : ""}
                                    placeholder="0"
                                    onChange={(e) => updateRow(row.uid, "returnQty", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                                    className="h-6 w-full text-xs text-right px-1 disabled:opacity-40 dark:bg-red-500/10 dark:border-red-600/30"
                                  />
                                </td>
                                <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10">
                                  <Input type="date" value={row.receiptDate}
                                    onChange={(e) => updateRow(row.uid, "receiptDate", e.target.value)}
                                    className="h-6 w-full text-xs px-1 dark:bg-amber-500/10 dark:border-amber-600/30 dark:text-foreground"
                                  />
                                </td>
                                <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10">
                                  <Select options={warehouseOptions} value={row.warehouse}
                                    onChange={(v) => updateRow(row.uid, "warehouse", v)}
                                    placeholder="창고선택" className="h-6 text-xs"
                                  />
                                </td>
                                <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10">
                                  <Input value={row.lotNo} placeholder="LOT"
                                    onChange={(e) => updateRow(row.uid, "lotNo", e.target.value)}
                                    className="h-6 w-full text-xs px-1 dark:bg-amber-500/10 dark:border-amber-600/30"
                                  />
                                </td>
                                <td className="px-1 py-1 bg-amber-50 dark:bg-amber-500/10">
                                  <Input value={row.note}
                                    onChange={(e) => updateRow(row.uid, "note", e.target.value)}
                                    className="h-6 w-full text-xs px-1 dark:bg-amber-500/10 dark:border-amber-600/30"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 하단: 입고 히스토리 */}
                    <div className="flex flex-col shrink-0" style={{ maxHeight: "35%" }}>
                      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 shrink-0">
                        <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">입고 히스토리</span>
                        <span className="ml-auto text-[11px] text-muted-foreground">총 {history.length}건 · 품목 클릭 시 상세 조회</span>
                      </div>
                      <div className="overflow-auto min-h-0 flex-1">
                        {history.length === 0 ? (
                          <p className="p-4 text-center text-xs text-muted-foreground">아직 처리된 입고 내역이 없습니다.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-muted/60 border-b">
                              <tr>
                                <th className="px-2 py-1.5 text-center w-14">구분</th>
                                <th className="px-2 py-1.5 text-left w-32">발주번호</th>
                                <th className="px-2 py-1.5 text-center w-10">순번</th>
                                <th className="px-2 py-1.5 text-left w-32">처리일시</th>
                                <th className="px-2 py-1.5 text-left w-36">품목번호</th>
                                <th className="px-2 py-1.5 text-left">품목명</th>
                                <th className="px-2 py-1.5 text-center w-24">창고</th>
                                <th className="px-2 py-1.5 text-left w-28">저장위치</th>
                                <th className="px-2 py-1.5 text-center w-14">단위</th>
                                <th className="px-2 py-1.5 text-left w-28">모델</th>
                                <th className="px-2 py-1.5 text-right w-16">수량</th>
                                <th className="px-2 py-1.5 text-center w-24">입고일자</th>
                                <th className="px-2 py-1.5 text-left w-24">LOT번호</th>
                                <th className="px-2 py-1.5 text-left w-24">비고</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((h, i) => (
                                <tr key={h.id}
                                  className={`border-b last:border-0 cursor-pointer hover:bg-primary/5 ${h.type === "반품" ? "bg-red-50/40 dark:bg-red-500/10" : i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : ""}`}
                                  onClick={() => setHistoryItemCode(h.itemCode)}
                                >
                                  <td className="px-2 py-1 text-center">
                                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                                      {h.type}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 font-mono text-[11px] text-primary">{h.poNumber ?? "-"}</td>
                                  <td className="px-2 py-1 text-center text-muted-foreground">{h.seq ?? "-"}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{h.processedAt}</td>
                                  <td className="px-2 py-1 font-mono">{h.itemCode}</td>
                                  <td className="px-2 py-1">{h.itemName}</td>
                                  <td className="px-2 py-1 text-center text-muted-foreground">{h.warehouse || "-"}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{h.storageLocation || "-"}</td>
                                  <td className="px-2 py-1 text-center text-muted-foreground">{h.unit || "-"}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{h.vehicleModel || "-"}</td>
                                  <td className={`px-2 py-1 text-right font-semibold ${h.type === "반품" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>{h.qty.toLocaleString("ko-KR")}</td>
                                  <td className="px-2 py-1 text-center">{h.receiptDate}</td>
                                  <td className="px-2 py-1">{h.lotNo || "-"}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{h.note || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>

    {/* 이력선택 - 품목 팝업 */}
    <ItemSelectModal
      open={isItemModalOpen}
      onOpenChange={setIsItemModalOpen}
      onSelect={(item) => {
        setHItemCode(item.itemCode);
        setHItemName(item.itemName);
        setTimeout(() => refSupplierCode.current?.focus(), 0);
      }}
    />

    {/* 이력선택 - 구매처 팝업 */}
    <SupplierSelectPopup
      open={isSupplierPopupOpen}
      onOpenChange={setIsSupplierPopupOpen}
      initialSearch={hSupplierCode}
      onSelect={(no, name) => {
        setHSupplierCode(no);
        setHSupplierName(name);
        setTimeout(() => refModel.current?.focus(), 0);
      }}
    />

    {/* 등록작업 - 품목 팝업 */}
    <ItemSelectModal
      open={rIsItemModalOpen}
      onOpenChange={setRIsItemModalOpen}
      onSelect={(item) => {
        setRItemCode(item.itemCode);
        setRItemName(item.itemName);
        setTimeout(() => rRefSupplierCode.current?.focus(), 0);
      }}
    />

    {/* 등록작업 - 구매처 팝업 */}
    <SupplierSelectPopup
      open={rIsSupplierPopupOpen}
      onOpenChange={setRIsSupplierPopupOpen}
      initialSearch={rSupplierCode}
      onSelect={(no, name) => {
        setRSupplierCode(no);
        setRSupplierName(name);
        setTimeout(() => rRefModel.current?.focus(), 0);
      }}
    />

    {/* 반품 거래명세서 모달 */}
    {returnSlip && (
      <>
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            * { visibility: hidden; }
            #rtn-slip-print-area, #rtn-slip-print-area * { visibility: visible; }
            #rtn-slip-print-area {
              position: fixed; top: 0; left: 0;
              width: 210mm; height: 297mm;
              padding: 8mm; box-sizing: border-box;
              background: white;
            }
            .rtn-slip-copy {
              height: 138mm;
              overflow: hidden;
              display: block;
              margin-bottom: 0 !important;
            }
            .rtn-slip-divider {
              display: block;
              height: 5mm !important;
              margin: 0 !important;
              border-top: 2px dashed #9ca3af;
            }
          }
        `}</style>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-2xl flex flex-col border" style={{ width: "720px", maxHeight: "95vh" }}>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white rounded-t-lg shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-semibold">반품 거래명세서 — {returnSlip.slipNo}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm"
                  className="text-white hover:bg-gray-700 text-xs h-7"
                  onClick={handlePrint}>
                  <Printer className="mr-1 h-3.5 w-3.5" />인쇄
                </Button>
                <Button type="button" variant="ghost" size="icon"
                  className="text-white hover:bg-gray-700 h-7 w-7"
                  onClick={() => setReturnSlip(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div id="rtn-slip-print-area" style={{ display: "flex", flexDirection: "column" }}>
                {renderSlipCopy(returnSlip, "공급 받는 자 보관용", "#1a56db")}
                <div className="rtn-slip-divider" style={{ borderTop: "2px dashed #9ca3af", margin: "4px 0" }} />
                {renderSlipCopy(returnSlip, "공급자 보관용", "#e02424")}
                <div className="rtn-slip-divider" style={{ borderTop: "2px dashed #9ca3af", margin: "4px 0" }} />
                {renderSlipCopy(returnSlip, "경비실용", "#16a34a")}
                <div className="rtn-slip-divider" style={{ borderTop: "2px dashed #9ca3af", margin: "4px 0" }} />
                {renderSlipCopy(returnSlip, "품질용", "#9333ea")}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-2 border-t shrink-0">
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setReturnSlip(null)}>닫기</Button>
              <Button type="button" size="sm" className="text-xs bg-gray-800 hover:bg-gray-900 text-white" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />인쇄
              </Button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* 품목별 히스토리 모달 */}
    {historyItemCode && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onKeyDown={(e) => { if (e.key === "Escape") setHistoryItemCode(null); }}>
        <div className="w-full max-w-5xl rounded-lg bg-background shadow-lg flex flex-col" style={{ maxHeight: "80vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div>
              <h2 className="text-sm font-semibold">{historyItemCode} — {modalItemName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                총 입고횟수 <strong>{modalItemHistory.length}회</strong> · 누적 입고수량 <strong className="text-blue-600">{modalTotalQty.toLocaleString("ko-KR")}</strong>
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" autoFocus onClick={() => setHistoryItemCode(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {modalItemHistory.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">해당 품목의 입고 내역이 없습니다.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/70 border-b">
                  <tr>
                    <th className="px-3 py-2 text-center w-14">구분</th>
                    <th className="px-3 py-2 text-left w-32">발주번호</th>
                    <th className="px-3 py-2 text-center w-12">순번</th>
                    <th className="px-3 py-2 text-left w-36">처리일시</th>
                    <th className="px-3 py-2 text-center w-24">창고</th>
                    <th className="px-3 py-2 text-left w-28">저장위치</th>
                    <th className="px-3 py-2 text-center w-14">단위</th>
                    <th className="px-3 py-2 text-left w-28">모델</th>
                    <th className="px-3 py-2 text-right w-20">수량</th>
                    <th className="px-3 py-2 text-center w-28">입고일자</th>
                    <th className="px-3 py-2 text-left w-24">LOT번호</th>
                    <th className="px-3 py-2 text-left w-12">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {modalItemHistory.map((h, i) => (
                    <tr key={h.id} className={`border-b last:border-0 ${h.type === "반품" ? "bg-red-50/40 dark:bg-red-500/10" : i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : ""}`}>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.type === "반품" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-primary">{h.poNumber ?? "-"}</td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{h.seq ?? "-"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.processedAt}</td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{h.warehouse || "-"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.storageLocation || "-"}</td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{h.unit || "-"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.vehicleModel || "-"}</td>
                      <td className={`px-3 py-1.5 text-right font-semibold ${h.type === "반품" ? "text-red-600" : "text-blue-600"}`}>{h.qty.toLocaleString("ko-KR")}</td>
                      <td className="px-3 py-1.5 text-center">{h.receiptDate}</td>
                      <td className="px-3 py-1.5">{h.lotNo || "-"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-muted/80 border-t">
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 text-right font-semibold text-xs">합계</td>
                    <td colSpan={4} />
                    <td className="px-3 py-1.5 text-right font-bold text-blue-700 dark:text-blue-400">{modalTotalQty.toLocaleString("ko-KR")}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    )}

      {/* 알림 모달 */}
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
    </>
  );
}
