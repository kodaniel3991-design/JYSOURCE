"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { CrudActions } from "@/components/common/crud-actions";
import { PurchaserRegisterSheet } from "@/components/purchasers/purchaser-register-sheet";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { Select } from "@/components/ui/select";
import type { PurchaserRecord } from "@/types/purchaser";
import { Upload, X, Download } from "lucide-react";
import { SearchPanel } from "@/components/common/search-panel";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";
import { apiPath } from "@/lib/api-path";
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from "@/components/common/action-buttons";

interface PurchaserFilterState {
  purchaserNo: string;
  purchaserName: string;
  transactionType: string;
  businessNo: string;
  tradeStatus: "" | "active" | "stopped";
}

const transactionTypeOptions = [
  { value: "", label: "전체" },
  { value: "고객 및 구매처", label: "고객 및 구매처" },
  { value: "구매처", label: "구매처" },
  { value: "고객", label: "고객" },
];

const tradeStatusOptions = [
  { value: "", label: "전체" },
  { value: "active", label: "거래중" },
  { value: "stopped", label: "거래중지" },
];

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-[14px] text-slate-600">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}

export default function PurchasersPage() {
  const [rows, setRows] = useCachedState<PurchaserRecord[]>("purchasers/rows", []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useCachedState<boolean>("purchasers/hasSearched", false);
  const searchRef = useEnterNavigation();

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiPath("/api/purchasers"));
      const data = await r.json();
      if (data?.ok) {
        setRows(
          (data.items ?? []).map((p: any) => ({
            id: String(p.Id),
            purchaserNo: p.PurchaserNo ?? "",
            purchaserName: p.PurchaserName ?? "",
            phoneNo: p.PhoneNo ?? "",
            faxNo: p.FaxNo ?? "",
            contactPerson: p.ContactPerson ?? "",
            contactDept: p.ContactDept ?? "",
            transactionType: p.TransactionType ?? "",
            representativeName: p.RepresentativeName ?? "",
            businessNo: p.BusinessNo ?? "",
            postalCode: p.PostalCode ?? "",
            address: p.Address ?? "",
            suspensionDate: p.SuspensionDate ?? "",
            suspensionReason: p.SuspensionReason ?? "거래중",
            registrant: p.Registrant ?? "",
            modifier: p.Modifier ?? "",
            email: p.Email ?? "",
            businessTypeName: p.BusinessTypeName ?? "",
            businessItemName: p.BusinessItemName ?? "",
            mobileNo: p.MobileNo ?? "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  const [filters, setFilters] = useCachedState<PurchaserFilterState>("purchasers/filters", {
    purchaserNo: "",
    purchaserName: "",
    transactionType: "",
    businessNo: "",
    tradeStatus: "",
  });
  const [selectedRowId, setSelectedRowId] = useCachedState<string | null>("purchasers/selectedRowId", null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useCachedState<number>("purchasers/page", 1);
  const pageSize = 20;
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useCachedState<keyof PurchaserRecord>("purchasers/sortKey", "purchaserNo");
  const [sortDir, setSortDir] = useCachedState<"asc" | "desc">("purchasers/sortDir", "asc");
  const [stripedRows, setStripedRows] = useCachedState<boolean>("purchasers/stripedRows", true);
  const [compactView, setCompactView] = useCachedState<boolean>("purchasers/compactView", true);
  const [excelSheetOpen, setExcelSheetOpen] = useState(false);
  const [excelResultMessage, setExcelResultMessage] = useState<string | null>(
    null
  );
  const [excelSelectedFile, setExcelSelectedFile] = useState<File | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = <K extends keyof PurchaserFilterState>(
    key: K,
    value: PurchaserFilterState[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
      purchaserNo: "",
      purchaserName: "",
      transactionType: "",
      businessNo: "",
      tradeStatus: "",
    });
    setSelectedRowId(null);
    setPage(1);
  };

  const filteredList = useMemo(() => {
    return rows.filter((row) => {
      const isActive = row.suspensionReason === "거래중" && !row.suspensionDate;

      if (
        filters.purchaserNo &&
        !row.purchaserNo
          .toLowerCase()
          .includes(filters.purchaserNo.toLowerCase())
      )
        return false;
      if (
        filters.purchaserName &&
        !row.purchaserName
          .toLowerCase()
          .includes(filters.purchaserName.toLowerCase())
      )
        return false;
      if (
        filters.transactionType &&
        row.transactionType !== filters.transactionType
      )
        return false;
      if (filters.businessNo && !row.businessNo.includes(filters.businessNo))
        return false;
      if (filters.tradeStatus === "active" && !isActive) return false;
      if (filters.tradeStatus === "stopped" && isActive) return false;
      return true;
    });
  }, [filters, rows]);

  const allColumns = useMemo(
    () =>
      [
      { key: "purchaserNo", header: "구매처번호", minWidth: 90, maxWidth: 90 },
      {
        key: "purchaserName",
        header: "구매처명",
        minWidth: 140,
        maxWidth: 180,
        cellClassName: "truncate",
      },
      {
        key: "phoneNo",
        header: "전화번호",
        minWidth: 100,
        maxWidth: 120,
        cell: (r: PurchaserRecord) => r.phoneNo || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "faxNo",
        header: "팩스번호",
        minWidth: 100,
        maxWidth: 120,
        cell: (r: PurchaserRecord) => r.faxNo || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "contactPerson",
        header: "담당자",
        minWidth: 80,
        maxWidth: 100,
        cell: (r: PurchaserRecord) => r.contactPerson || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "contactDept",
        header: "담당부서",
        minWidth: 90,
        maxWidth: 110,
        cell: (r: PurchaserRecord) => r.contactDept || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "transactionType",
        header: "거래형태",
        minWidth: 110,
        maxWidth: 130,
      },
      {
        key: "representativeName",
        header: "대표자성명",
        minWidth: 90,
        maxWidth: 110,
      },
      {
        key: "businessNo",
        header: "사업자번호",
        minWidth: 110,
        maxWidth: 130,
      },
      {
        key: "postalCode",
        header: "우편번호",
        minWidth: 80,
        maxWidth: 90,
        cell: (r: PurchaserRecord) => r.postalCode || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "address",
        header: "주소",
        minWidth: 160,
        maxWidth: 220,
        cellClassName: "truncate text-muted-foreground",
      },
      {
        key: "suspensionDate",
        header: "거래종지일자",
        minWidth: 100,
        maxWidth: 110,
        cell: (r: PurchaserRecord) => r.suspensionDate || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "suspensionReason",
        header: "종지사유",
        minWidth: 80,
        maxWidth: 100,
      },
      {
        key: "registrant",
        header: "등록자",
        minWidth: 90,
        maxWidth: 110,
        cellClassName: "text-muted-foreground",
      },
      {
        key: "modifier",
        header: "변경자",
        minWidth: 90,
        maxWidth: 110,
        cell: (r: PurchaserRecord) => r.modifier || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "email",
        header: "E-MAIL",
        minWidth: 140,
        maxWidth: 180,
        cell: (r: PurchaserRecord) => r.email || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "businessTypeName",
        header: "업태명",
        minWidth: 100,
        maxWidth: 140,
        cell: (r: PurchaserRecord) => r.businessTypeName || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "businessItemName",
        header: "종목명",
        minWidth: 100,
        maxWidth: 140,
        cell: (r: PurchaserRecord) => r.businessItemName || "-",
        cellClassName: "text-muted-foreground",
      },
      {
        key: "mobileNo",
        header: "휴대폰번호",
        minWidth: 120,
        maxWidth: 150,
        cell: (r: PurchaserRecord) => r.mobileNo || "-",
        cellClassName: "text-muted-foreground",
      },
    ] as const,
    []
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    allColumns.map((c) => c.key)
  );

  const visibleColumns = useMemo(() => {
    const set = new Set(visibleColumnKeys);
    const cols = allColumns.filter((c) => set.has(c.key));
    return cols.length > 0 ? cols : allColumns.slice(0, 1);
  }, [allColumns, visibleColumnKeys]);

  const sortedList = useMemo(() => {
    const copy = [...filteredList];

    const numericKeys: (keyof PurchaserRecord)[] = ["businessNo", "postalCode"];

    const isPureNumber = (v: unknown) =>
      /^\d+$/.test(String(v ?? "").trim());

    copy.sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;

      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;

      // 1) 구매처번호: 숫자 → 알파벳 순으로 정렬
      if (sortKey === "purchaserNo") {
        const aIsNum = isPureNumber(av);
        const bIsNum = isPureNumber(bv);

        // 둘 다 숫자면 숫자 비교
        if (aIsNum && bIsNum) {
          const na = Number(av);
          const nb = Number(bv);
          if (na < nb) return sortDir === "asc" ? -1 : 1;
          if (na > nb) return sortDir === "asc" ? 1 : -1;
          return 0;
        }

        // 한쪽만 숫자인 경우: 오름차순일 때 숫자가 먼저, 내림차순일 때 문자가 먼저
        if (aIsNum !== bIsNum) {
          if (sortDir === "asc") {
            return aIsNum ? -1 : 1;
          }
          return aIsNum ? 1 : -1;
        }
        // 둘 다 문자이면 알파벳(문자열) 비교
      }

      // 2) 기타 숫자형 컬럼은 숫자로 비교
      if (numericKeys.includes(sortKey)) {
        const na = Number(String(av).replace(/[^0-9.-]/g, ""));
        const nb = Number(String(bv).replace(/[^0-9.-]/g, ""));
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
          if (na < nb) return sortDir === "asc" ? -1 : 1;
          if (na > nb) return sortDir === "asc" ? 1 : -1;
          return 0;
        }
      }

      // 3) 기본: 문자열 비교
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [filteredList, sortDir, sortKey]);

  const total = sortedList.length;
  const start = (page - 1) * pageSize;
  const paged = sortedList.slice(start, start + pageSize);

  const sortOptions = useMemo(
    () =>
      allColumns.map((c) => ({
        value: c.key,
        label: c.header,
      })),
    [allColumns]
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  const handleExcelFile = useCallback(
    async (file: File) => {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["xlsx", "xls"].includes(ext)) {
          setExcelResultMessage(
            "지원하지 않는 파일 형식입니다. .xlsx 또는 .xls 형식의 EXCEL 파일을 선택해 주세요."
          );
          return;
        }

        const XLSX = await import("xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          setExcelResultMessage("워크북에 시트가 없습니다.");
          return;
        }
        const sheet = workbook.Sheets[firstSheet];
        const rows2D: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (!rows2D.length) {
          setExcelResultMessage("시트에 데이터가 없습니다.");
          return;
        }

        const [rawHeader, ...body] = rows2D;
        if (!body.length) {
          setExcelResultMessage("헤더 행만 있고, 데이터 행이 없습니다.");
          return;
        }

        const normalizeHeader = (h: unknown) =>
          String(h ?? "").replace(/\s+/g, "").toLowerCase();
        const header = rawHeader.map(normalizeHeader);
        const findIndex = (candidates: string[]) =>
          header.findIndex((h) => candidates.includes(h));

        const purchaserNoIdx = findIndex(["구매처번호", "purchaserno"]);
        const purchaserNameIdx = findIndex(["구매처명", "purchasername"]);

        if (purchaserNoIdx < 0 || purchaserNameIdx < 0) {
          setExcelResultMessage(
            "헤더 행에서 필수 컬럼을 찾을 수 없습니다. '구매처번호', '구매처명' 컬럼을 포함해 주세요."
          );
          return;
        }

        const phoneIdx = findIndex(["전화번호", "phoneno"]);
        const faxIdx = findIndex(["팩스번호", "faxno"]);
        const contactIdx = findIndex(["담당자"]);
        const deptIdx = findIndex(["담당부서"]);
        const typeIdx = findIndex(["거래형태"]);
        const repIdx = findIndex(["대표자성명"]);
        const bizNoIdx = findIndex(["사업자번호"]);
        const postalIdx = findIndex(["우편번호"]);
        const addrIdx = findIndex(["주소"]);
        const suspendDateIdx = findIndex(["거래중지일자", "거래종지일자"]);
        const suspendReasonIdx = findIndex(["중지사유", "종지사유"]);
        const registrantIdx = findIndex(["등록자"]);
        const modifierIdx = findIndex(["변경자"]);
        const emailIdx = findIndex(["e-mail", "email"]);
        const businessTypeIdx = findIndex(["업태명"]);
        const businessItemIdx = findIndex(["종목명"]);
        const mobileIdx = findIndex(["휴대폰번호"]);

        const getString = (row: any[], idx: number) => {
          if (idx < 0) return "";
          const v = row[idx];
          if (v instanceof Date) return v.toISOString().slice(0, 10);
          return String(v ?? "").trim();
        };

        let added = 0;
        let duplicate = 0;
        let invalid = 0;
        const newPurchasers: ReturnType<typeof buildRecord>[] = [];

        const buildRecord = (row: any[]) => ({
          purchaserNo: getString(row, purchaserNoIdx),
          purchaserName: getString(row, purchaserNameIdx),
          phoneNo: getString(row, phoneIdx),
          faxNo: getString(row, faxIdx),
          contactPerson: getString(row, contactIdx),
          contactDept: getString(row, deptIdx),
          transactionType: getString(row, typeIdx),
          representativeName: getString(row, repIdx),
          businessNo: getString(row, bizNoIdx),
          postalCode: getString(row, postalIdx),
          address: getString(row, addrIdx),
          suspensionDate: getString(row, suspendDateIdx),
          suspensionReason: getString(row, suspendReasonIdx) || "거래중",
          registrant: getString(row, registrantIdx) || "EXCEL 업로드",
          modifier: getString(row, modifierIdx),
          email: getString(row, emailIdx),
          businessTypeName: getString(row, businessTypeIdx),
          businessItemName: getString(row, businessItemIdx),
          mobileNo: getString(row, mobileIdx),
        });

        body.forEach((row) => {
          const purchaserNo = getString(row, purchaserNoIdx);
          const purchaserName = getString(row, purchaserNameIdx);
          if (!purchaserNo || !purchaserName) {
            invalid += 1;
            return;
          }
          if (rows.some((r) => r.purchaserNo === purchaserNo)) {
            duplicate += 1;
            return;
          }
          added += 1;
          newPurchasers.push(buildRecord(row));
        });

        const totalRows = body.length;

        if (!added) {
          setExcelResultMessage(
            `추가된 구매처가 없습니다.\n- 전체 행: ${totalRows}행\n- 중복 구매처번호: ${duplicate}행\n- 필수값(구매처번호/구매처명) 누락: ${invalid}행`
          );
          return;
        }

        // DB 저장
        try {
          const res = await fetch(apiPath("/api/purchasers/import"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: newPurchasers }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { message?: string } | null;
            setExcelResultMessage(
              data?.message ?? "DB에 저장하는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요."
            );
            return;
          }
          const saved = await res.json();
          const dbInserted: number = saved.count ?? added;
          const dbSkipped: number = saved.skipped ?? 0;

          // 저장 성공 → DB에서 다시 로딩하여 ID 포함한 최신 데이터 반영
          const listRes = await fetch(apiPath("/api/purchasers"));
          const listData = await listRes.json();
          if (listData?.ok) {
            setRows(
              (listData.items ?? []).map((p: any) => ({
                id: String(p.Id),
                purchaserNo: p.PurchaserNo ?? "",
                purchaserName: p.PurchaserName ?? "",
                phoneNo: p.PhoneNo ?? "",
                faxNo: p.FaxNo ?? "",
                contactPerson: p.ContactPerson ?? "",
                contactDept: p.ContactDept ?? "",
                transactionType: p.TransactionType ?? "",
                representativeName: p.RepresentativeName ?? "",
                businessNo: p.BusinessNo ?? "",
                postalCode: p.PostalCode ?? "",
                address: p.Address ?? "",
                suspensionDate: p.SuspensionDate ?? "",
                suspensionReason: p.SuspensionReason ?? "거래중",
                registrant: p.Registrant ?? "",
                modifier: p.Modifier ?? "",
                email: p.Email ?? "",
                businessTypeName: p.BusinessTypeName ?? "",
                businessItemName: p.BusinessItemName ?? "",
                mobileNo: p.MobileNo ?? "",
              }))
            );
          }

          setPage(1);
          setExcelSelectedFile(null);
          if (excelFileInputRef.current) excelFileInputRef.current.value = "";

          setExcelResultMessage(
            `업로드 결과\n- 전체 행: ${totalRows}행\n- 신규 등록: ${dbInserted}행\n- 중복 구매처번호로 건너뜀: ${duplicate + dbSkipped}행\n- 필수값(구매처번호/구매처명) 누락: ${invalid}행`
          );
        } catch (e) {
          console.error(e);
          setExcelResultMessage("DB에 연결할 수 없습니다. 서버 설정을 확인해 주세요.");
        }
      } catch (err) {
        console.error(err);
        setExcelResultMessage(
          "EXCEL 파일을 처리하는 중 오류가 발생했습니다. 파일 형식과 헤더 구성을 다시 확인해 주세요."
        );
      }
    },
    [rows]
  );

  const exportCsv = useCallback(() => {
    const cols = visibleColumns;
    const rows = paged;
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = cols.map((c) => escape(c.header)).join(",");
    const body = rows
      .map((r) =>
        cols
          .map((c) => escape((r as unknown as Record<string, unknown>)[c.key]))
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchasers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [paged, visibleColumns]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <PageHeader
        title="구매처 관리"
        description="구매처(매입처) 기준정보를 조회하고 관리합니다."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CrudActions
              onRegister={() => setRegisterOpen(true)}
              onEdit={() => {
                if (!selectedRowId) return;
                setEditOpen(true);
              }}
              onDelete={async () => {
                if (!selectedRowId) return;
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return;
                const ok = window.confirm(
                  `선택한 구매처를 삭제하시겠습니까?\n\n구매처번호: ${row.purchaserNo}\n구매처명: ${row.purchaserName}`
                );
                if (!ok) return;
                try {
                  const res = await fetch(apiPath(`/api/purchasers/${selectedRowId}`), {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (!data.ok) {
                    alert("삭제 실패: " + (data.message ?? ""));
                    return;
                  }
                  setRows((prev) => prev.filter((r) => r.id !== selectedRowId));
                  setSelectedRowId(null);
                  setPage(1);
                } catch (e) {
                  console.error(e);
                  alert("삭제 중 오류가 발생했습니다.");
                }
              }}
              editDisabled={!selectedRowId}
              deleteDisabled={!selectedRowId}
            />
            <PrimaryActionButton
              size="sm"
              className="ml-1 flex items-center gap-1 text-xs"
              onClick={() => {
                setExcelSelectedFile(null);
                setExcelResultMessage(null);
                setExcelSheetOpen(true);
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              EXCEL 업로드
            </PrimaryActionButton>
          </div>
        }
      />

      {/* 검색 조건 */}
      <SearchPanel
        onSearch={handleSearch}
        onReset={resetFilters}
        loading={loading}
        totalCountLabel={`총 ${filteredList.length.toLocaleString("ko-KR")}건이 조회되었습니다.`}
      >
        <div ref={searchRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field
            label="구매처번호"
            value={filters.purchaserNo}
            onChange={(v) => handleFilterChange("purchaserNo", v)}
          />
          <Field
            label="구매처명"
            value={filters.purchaserName}
            onChange={(v) => handleFilterChange("purchaserName", v)}
          />
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">거래형태</Label>
            <Select
              value={filters.transactionType}
              onChange={(v) => handleFilterChange("transactionType", v)}
              options={transactionTypeOptions}
              className="h-8 text-xs"
            />
          </div>
          <Field
            label="사업자번호"
            value={filters.businessNo}
            onChange={(v) => handleFilterChange("businessNo", v)}
          />
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">거래여부</Label>
            <Select
              value={filters.tradeStatus}
              onChange={(v) =>
                handleFilterChange(
                  "tradeStatus",
                  v as PurchaserFilterState["tradeStatus"]
                )
              }
              options={tradeStatusOptions}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </SearchPanel>

      {/* 그리드 */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-end">
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => {
              setGridSettingsTab("export");
              setGridSettingsOpen(true);
            }}
            onSort={() => {
              setGridSettingsTab("sort");
              setGridSettingsOpen(true);
              toggleSortDir();
            }}
            onColumns={() => {
              setGridSettingsTab("columns");
              setGridSettingsOpen(true);
            }}
            onView={() => {
              setGridSettingsTab("view");
              setGridSettingsOpen(true);
              setStripedRows((v) => !v);
            }}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1">
            <MasterListGrid<PurchaserRecord>
              columns={visibleColumns as unknown as any}
              data={paged}
              keyExtractor={(r) => r.id}
              onRowClick={(row) => setSelectedRowId(row.id)}
              selectedRowId={selectedRowId}
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
              }}
              variant={stripedRows ? "striped" : "default"}
              getRowClassName={(_row, index) => {
                const density = compactView ? "" : "h-10";
                return [density].filter(Boolean).join(" ");
              }}
              maxHeight="100%"
              emptyMessage={!hasSearched ? "검색 버튼을 클릭하면 조회됩니다." : loading ? "조회 중..." : "조건에 맞는 구매처가 없습니다."}
            />
          </div>
        </CardContent>
      </Card>

      {/* EXCEL 업로드 모달 */}
      <Sheet
        open={excelSheetOpen}
        onOpenChange={(open) => {
          setExcelSheetOpen(open);
          if (!open) {
            setExcelSelectedFile(null);
            setExcelResultMessage(null);
          }
        }}
        position="center"
      >
        <SheetContent className="sm:max-w-xl flex flex-col bg-white">
          <SheetHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
            <div>
              <SheetTitle className="text-lg">구매처 EXCEL 업로드</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-1">
                구매처번호, 구매처명을 포함한 EXCEL 파일을 업로드하여 구매처를 일괄 등록합니다.
              </SheetDescription>
            </div>
            <PrimaryActionButton
              type="button"
              size="sm"
              className="shrink-0"
              onClick={async () => {
                const XLSX = await import("xlsx-js-style");
                const wb = XLSX.utils.book_new();
                const headers = allColumns.map((c) => c.header);
                const ws = XLSX.utils.aoa_to_sheet([headers]);

                const headerColor = "9DC3E6";
                for (let c = 0; c < headers.length; c += 1) {
                  const addr = (XLSX.utils as any).encode_cell({ r: 0, c });
                  const cell = (ws as any)[addr];
                  if (cell) {
                    (cell as any).s = {
                      fill: {
                        patternType: "solid",
                        fgColor: { rgb: headerColor },
                      },
                      font: {
                        bold: true,
                        sz: 8,
                        color: { rgb: "000000" },
                      },
                      alignment: { horizontal: "center", vertical: "center" },
                    };
                  }
                }

                XLSX.utils.book_append_sheet(wb, ws, "구매처");
                (XLSX as any).writeFile(wb, "구매처_양식.xlsx");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              구매처 양식 다운로드
            </PrimaryActionButton>
          </SheetHeader>

          <div className="mt-4 flex-1 overflow-auto text-xs space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">업로드 파일</Label>
              <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-rose-50/80">
                <input
                  ref={excelFileInputRef}
                  id="purchaser-excel-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setExcelSelectedFile(file);
                    setExcelResultMessage(null);
                  }}
                />
                <Input
                  readOnly
                  value={excelSelectedFile?.name ?? ""}
                  placeholder="파일을 선택하세요"
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <SecondaryActionButton
                  type="button"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    document.getElementById("purchaser-excel-input")?.click()
                  }
                >
                  <Upload className="h-4 w-4" />
                </SecondaryActionButton>
                <SecondaryActionButton
                  type="button"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setExcelSelectedFile(null);
                    const el = document.getElementById(
                      "purchaser-excel-input"
                    ) as HTMLInputElement | null;
                    if (el) el.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </SecondaryActionButton>
              </div>
            </div>

            {excelResultMessage && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800">
                {excelResultMessage}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center gap-2 border-t pt-3">
            <PrimaryActionButton
              size="sm"
              onClick={() => {
                if (excelSelectedFile) void handleExcelFile(excelSelectedFile);
                else
                  setExcelResultMessage("업로드할 EXCEL 파일을 선택해 주세요.");
              }}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              업로드
            </PrimaryActionButton>
            <SecondaryActionButton
              size="sm"
              onClick={() => setExcelSheetOpen(false)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              닫기
            </SecondaryActionButton>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={gridSettingsOpen}
        onOpenChange={setGridSettingsOpen}
        position="center"
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">
              내보내기 · 정렬 · 컬럼 · 보기 설정
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={gridSettingsTab === "export" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("export")}
              >
                내보내기
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "sort" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("sort")}
              >
                정렬
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "columns" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("columns")}
              >
                컬럼
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "view" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("view")}
              >
                보기
              </Button>
            </div>

            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  현재 페이지({page}페이지) 데이터가 CSV로 다운로드됩니다.
                </p>
                <Button size="sm" onClick={exportCsv}>
                  CSV 내보내기
                </Button>
              </div>
            )}

            {gridSettingsTab === "sort" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">정렬 기준</Label>
                  <Select
                    className="h-9 text-xs"
                    value={String(sortKey)}
                    options={sortOptions}
                    onChange={(v) => setSortKey(v as keyof PurchaserRecord)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSortDir}>
                    {sortDir === "asc" ? "오름차순" : "내림차순"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    정렬은 즉시 목록에 적용됩니다.
                  </p>
                </div>
              </div>
            )}

            {gridSettingsTab === "columns" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  표시할 컬럼을 선택하세요. (최소 1개 유지)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allColumns.map((c) => {
                    const checked = visibleColumnKeys.includes(c.key);
                    return (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setVisibleColumnKeys((prev) => {
                              if (next) return Array.from(new Set([...prev, c.key]));
                              const filtered = prev.filter((k) => k !== c.key);
                              return filtered.length > 0 ? filtered : prev;
                            });
                          }}
                        />
                        <span className="text-[11px]">{c.header}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisibleColumnKeys(allColumns.map((c) => c.key))}
                  >
                    전체 선택
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setVisibleColumnKeys([
                        "purchaserNo",
                        "purchaserName",
                        "phoneNo",
                        "transactionType",
                        "businessNo",
                      ])
                    }
                  >
                    기본값
                  </Button>
                </div>
              </div>
            )}

            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                  <Checkbox
                    checked={stripedRows}
                    onChange={(e) => setStripedRows(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">컴팩트 보기</span>
                  <Checkbox
                    checked={compactView}
                    onChange={(e) => setCompactView(e.target.checked)}
                  />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PurchaserRegisterSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        mode="create"
        onSave={async (draft) => {
          try {
            const res = await fetch(apiPath("/api/purchasers"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!data.ok) {
              alert("저장 실패: " + (data.message ?? ""));
              return;
            }
            const created: PurchaserRecord = {
              id: String(data.id),
              ...draft,
              email: draft.email ?? "",
              businessTypeName: draft.businessTypeName ?? "",
              businessItemName: draft.businessItemName ?? "",
              mobileNo: draft.mobileNo ?? "",
            };
            setRows((prev) => [created, ...prev]);
            setSelectedRowId(null);
            setPage(1);
          } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
          }
        }}
      />

      <PurchaserRegisterSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialDraft={
          selectedRowId
            ? (() => {
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return undefined;
                const { id, ...rest } = row;
                return rest;
              })()
            : undefined
        }
        onSave={async (draft) => {
          if (!selectedRowId) return;
          try {
            const res = await fetch(apiPath(`/api/purchasers/${selectedRowId}`), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!data.ok) {
              alert("수정 실패: " + (data.message ?? ""));
              return;
            }
            setRows((prev) =>
              prev.map((r) => (r.id === selectedRowId ? { ...r, ...draft } : r))
            );
          } catch (e) {
            console.error(e);
            alert("수정 중 오류가 발생했습니다.");
          }
        }}
      />
    </div>
  );
}
