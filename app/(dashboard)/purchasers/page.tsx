"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { purchasers } from "@/lib/mock/purchasers";
import type { PurchaserRecord } from "@/types/purchaser";

interface PurchaserFilterState {
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
  const [rows, setRows] = useState<PurchaserRecord[]>(purchasers);
  const [filters, setFilters] = useState<PurchaserFilterState>({
    purchaserName: "",
    transactionType: "",
    businessNo: "",
    tradeStatus: "",
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useState<keyof PurchaserRecord>("purchaserNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);

  const handleFilterChange = <K extends keyof PurchaserFilterState>(
    key: K,
    value: PurchaserFilterState[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
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
    copy.sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;

      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;

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
          .map((c) => escape((r as Record<string, unknown>)[c.key]))
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
              onDelete={() => {
                if (!selectedRowId) return;
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return;
                const ok = window.confirm(
                  `선택한 구매처를 삭제하시겠습니까?\n\n구매처번호: ${row.purchaserNo}\n구매처명: ${row.purchaserName}`
                );
                if (!ok) return;
                setRows((prev) => prev.filter((r) => r.id !== selectedRowId));
                setSelectedRowId(null);
                setPage(1);
              }}
              editDisabled={!selectedRowId}
              deleteDisabled={!selectedRowId}
            />
          </div>
        }
      />

      {/* 검색 조건 */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">검색 조건</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm">검색</Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              필터 초기화
            </Button>
            <p className="text-[11px] text-muted-foreground">
              총 <span className="font-semibold">{filteredList.length}</span>건이
              조회되었습니다.
            </p>
          </div>
        </CardContent>
      </Card>

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
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
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
              emptyMessage="조회된 구매처가 없습니다. 검색 조건을 조정해 보세요."
            />
          </div>
        </CardContent>
      </Card>

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
        onSave={(draft) => {
          const id = `p-${Date.now()}`;
          setRows((prev) => [{ id, ...draft }, ...prev]);
          setSelectedRowId(null);
          setPage(1);
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
        onSave={(draft) => {
          if (!selectedRowId) return;
          setRows((prev) =>
            prev.map((r) => (r.id === selectedRowId ? { ...r, ...draft } : r))
          );
        }}
      />
    </div>
  );
}
