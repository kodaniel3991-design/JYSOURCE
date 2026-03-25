"use client";

import { useCallback, useMemo, useState } from "react";
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
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CrudActions } from "@/components/common/crud-actions";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid, type MasterListGridColumn } from "@/components/common/master-list-grid";
import type { ModelCodeRecord } from "@/types/model-code";
import { Search } from "lucide-react";
import { SearchPanel } from "@/components/common/search-panel";
import { ModelCodeRegisterSheet } from "@/components/model-codes/model-code-register-sheet";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";

interface ModelCodeFilterState {
  modelCode: string;
  modelCodeName: string;
  customerNo: string;
}

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

export default function ModelCodesPage() {
  const [rows, setRows] = useCachedState<ModelCodeRecord[]>("model-codes/rows", []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useCachedState<boolean>("model-codes/hasSearched", false);
  const searchRef = useEnterNavigation();
  const [filters, setFilters] = useCachedState<ModelCodeFilterState>("model-codes/filters", {
    modelCode: "",
    modelCodeName: "",
    customerNo: "",
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useCachedState<number>("model-codes/page", 1);
  const pageSize = 20;
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useCachedState<keyof ModelCodeRecord>("model-codes/sortKey", "modelCode");
  const [sortDir, setSortDir] = useCachedState<"asc" | "desc">("model-codes/sortDir", "asc");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/model-codes");
      const data = await r.json();
      if (data?.ok) {
        setRows(
          (data.items ?? []).map((row: any) => ({
            id: String(row.Id),
            modelCode: row.ModelCode ?? "",
            modelName: row.ModelName ?? "",
            primaryCustomerCode: row.PrimaryCustomerCode ?? "",
            primaryCustomerName: row.PrimaryCustomerName ?? "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load model codes", err);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleFilterChange = <K extends keyof ModelCodeFilterState>(
    key: K,
    value: ModelCodeFilterState[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
      modelCode: "",
      modelCodeName: "",
      customerNo: "",
    });
    setSelectedRowId(null);
    setPage(1);
  };

  const filteredList = useMemo(() => {
    return rows.filter((row) => {
      if (filters.modelCode && !row.modelCode.includes(filters.modelCode))
        return false;
      if (
        filters.modelCodeName &&
        !row.modelName.toLowerCase().includes(filters.modelCodeName.toLowerCase())
      )
        return false;
      if (
        filters.customerNo &&
        !row.primaryCustomerCode.includes(filters.customerNo) &&
        !row.primaryCustomerName.includes(filters.customerNo)
      )
        return false;
      return true;
    });
  }, [filters, rows]);

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

  const allColumns = useMemo(
    () =>
      [
        {
          key: "modelCode",
          header: "모델코드",
          minWidth: 120,
          maxWidth: 120,
        },
        {
          key: "modelName",
          header: "모델명",
          minWidth: 140,
          maxWidth: 140,
        },
        {
          key: "primaryCustomerCode",
          header: "주요고객코드",
          minWidth: 120,
          maxWidth: 120,
          cell: (r: ModelCodeRecord) => r.primaryCustomerCode || "-",
          cellClassName: "text-muted-foreground",
        },
        {
          key: "primaryCustomerName",
          header: "주요고객명",
          minWidth: 140,
          maxWidth: 140,
          cell: (r: ModelCodeRecord) => r.primaryCustomerName || "-",
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
    const filtered = cols.length > 0 ? cols : allColumns.slice(0, 1);
    const noCol: MasterListGridColumn<ModelCodeRecord> = {
      key: "__no__",
      header: "No",
      minWidth: 48,
      maxWidth: 48,
      headerClassName: "text-center",
      cellClassName: "text-center text-muted-foreground",
      cell: (_row, index) => (page - 1) * pageSize + index + 1,
    };
    return [noCol, ...filtered];
  }, [allColumns, visibleColumnKeys, page, pageSize]);

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

  const exportExcel = useCallback(async () => {
    const cols = visibleColumns;
    // 페이징이 아닌, 현재 검색·정렬이 적용된 전체 목록을 내보내기
    const rows = sortedList;

    // 스타일 적용을 위해 xlsx-js-style 사용
    const XLSX = await import("xlsx-js-style");
    const header = cols.map((c) => c.header);
    const data = rows.map((r) =>
      cols.map((c) => {
        const value = (r as any)[c.key];
        return value == null ? "" : value;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

    // 전체 셀 글자 크기를 10pt로 통일
    Object.keys(ws).forEach((cellAddr) => {
      if (cellAddr.startsWith("!")) return;
      const cell = (ws as any)[cellAddr];
      if (!cell) return;
      const prevStyle = cell.s ?? {};
      cell.s = {
        ...prevStyle,
        font: {
          ...(prevStyle.font ?? {}),
          sz: 10,
        },
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "모델코드");

    const fileName = `model_codes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    (XLSX as any).writeFile(wb, fileName);
  }, [sortedList, visibleColumns]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <PageHeader
        title="모델코드 관리"
        description="차종·모델코드 기준정보를 조회하고 관리합니다."
        actions={
          <CrudActions
            onRegister={() => setRegisterOpen(true)}
            onEdit={() => {
              if (!selectedRowId) return;
              const row = rows.find((r) => r.id === selectedRowId);
              if (!row) return;
              setEditOpen(true);
            }}
            onDelete={async () => {
              if (!selectedRowId) return;
              const row = rows.find((r) => r.id === selectedRowId);
              if (!row) return;
              const ok = window.confirm(
                `선택한 모델코드를 삭제하시겠습니까?\n\n모델코드: ${row.modelCode}\n모델명: ${row.modelName}`
              );
              if (!ok) return;
              try {
                const res = await fetch(`/api/model-codes/${selectedRowId}`, {
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
        }
      />

      {/* 검색 */}
      <SearchPanel
        description="모델코드, 모델코드 명, 고객번호로 검색할 수 있습니다."
        onSearch={handleSearch}
        onReset={resetFilters}
        loading={loading}
        totalCountLabel={`총 ${filteredList.length.toLocaleString("ko-KR")}건이 조회되었습니다.`}
      >
        <div ref={searchRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="모델코드"
            value={filters.modelCode}
            onChange={(v) => handleFilterChange("modelCode", v)}
          />
          <Field
            label="모델코드 명"
            value={filters.modelCodeName}
            onChange={(v) => handleFilterChange("modelCodeName", v)}
          />
          <div className="space-y-1">
            <Label className="text-[14px] text-slate-600">고객번호</Label>
            <div className="flex gap-1">
              <Input
                value={filters.customerNo}
                onChange={(e) =>
                  handleFilterChange("customerNo", e.target.value)
                }
                className="h-8 flex-1 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="고객 조회"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </SearchPanel>

      {/* 그리드: 남은 높이를 채우고 내부만 스크롤 */}
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
            <MasterListGrid<ModelCodeRecord>
              maxHeight="100%"
              columns={visibleColumns as unknown as any}
              data={paged}
              keyExtractor={(r) => r.id}
              onRowClick={(row) => setSelectedRowId(row.id)}
              selectedRowId={selectedRowId}
              variant={stripedRows ? "striped" : "default"}
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
              }}
              getRowClassName={(_row, index) => {
                const density = compactView ? "" : "h-10";
                return [density].filter(Boolean).join(" ");
              }}
              emptyMessage={!hasSearched ? "검색 버튼을 클릭하면 조회됩니다." : loading ? "조회 중..." : "조건에 맞는 모델코드가 없습니다."}
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
                  검색/정렬된 전체 모델코드 데이터가 EXCEL 파일(.xlsx)로 다운로드됩니다.
                </p>
                <Button size="sm" onClick={() => void exportExcel()}>
                  EXCEL 내보내기
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
                    onChange={(v) => setSortKey(v as keyof ModelCodeRecord)}
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
                    onClick={() => setVisibleColumnKeys(["modelCode", "modelName"])}
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

      <ModelCodeRegisterSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        mode="create"
        onSave={async (draft) => {
          try {
            const res = await fetch("/api/model-codes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!data.ok) {
              alert("저장 실패: " + (data.message ?? ""));
              return;
            }

            const created: ModelCodeRecord = {
              id: String(data.id),
              modelCode: draft.modelCode,
              modelName: draft.modelName,
              primaryCustomerCode: draft.primaryCustomerCode,
              primaryCustomerName: draft.primaryCustomerName,
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

      <ModelCodeRegisterSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialDraft={
          selectedRowId
            ? (() => {
                const row = rows.find((r) => r.id === selectedRowId);
                if (!row) return undefined;
                return {
                  modelCode: row.modelCode,
                  modelName: row.modelName,
                  primaryCustomerCode: row.primaryCustomerCode,
                  primaryCustomerName: row.primaryCustomerName,
                };
              })()
            : undefined
        }
        onSave={async (draft) => {
          if (!selectedRowId) return;
          try {
            const res = await fetch(`/api/model-codes/${selectedRowId}`, {
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
              prev.map((r) =>
                r.id === selectedRowId
                  ? {
                      ...r,
                      modelCode: draft.modelCode,
                      modelName: draft.modelName,
                      primaryCustomerCode: draft.primaryCustomerCode,
                      primaryCustomerName: draft.primaryCustomerName,
                    }
                  : r
              )
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
