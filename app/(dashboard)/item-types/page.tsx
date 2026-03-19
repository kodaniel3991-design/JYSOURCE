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
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CrudActions } from "@/components/common/crud-actions";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import type { ItemTypeRecord } from "@/types/item-type";
import { Search, RotateCcw } from "lucide-react";
import { ItemTypeRegisterSheet } from "@/components/item-types/item-type-register-sheet";
import { useEnterNavigation } from "@/lib/hooks/use-enter-navigation";
import { itemTypes as mockData } from "@/lib/mock/item-types";

interface FilterState {
  itemTypeCode: string;
  itemTypeName: string;
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

export default function ItemTypesPage() {
  const [rows, setRows] = useState<ItemTypeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useEnterNavigation();
  const [filters, setFilters] = useState<FilterState>({ itemTypeCode: "", itemTypeName: "" });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("sort");
  const [sortKey, setSortKey] = useState<keyof ItemTypeRecord>("itemTypeCode");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/item-types");
      const data = await r.json();
      if (data?.ok) {
        setRows(
          (data.items ?? []).map((row: any) => ({
            id: String(row.Id),
            itemTypeCode: row.ItemTypeCode ?? "",
            itemTypeName: row.ItemTypeName ?? "",
          }))
        );
      } else {
        setRows(mockData);
      }
    } catch {
      setRows(mockData);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({ itemTypeCode: "", itemTypeName: "" });
    setSelectedRowId(null);
    setPage(1);
  };

  const filteredList = useMemo(() =>
    rows.filter((row) => {
      if (filters.itemTypeCode && !row.itemTypeCode.toLowerCase().includes(filters.itemTypeCode.toLowerCase())) return false;
      if (filters.itemTypeName && !row.itemTypeName.toLowerCase().includes(filters.itemTypeName.toLowerCase())) return false;
      return true;
    }),
    [filters, rows]
  );

  const sortedList = useMemo(() => {
    const copy = [...filteredList];
    copy.sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredList, sortDir, sortKey]);

  const total = sortedList.length;
  const paged = sortedList.slice((page - 1) * pageSize, page * pageSize);

  const allColumns = useMemo(
    () =>
      [
        { key: "itemTypeCode", header: "품목유형코드", minWidth: 130, maxWidth: 130 },
        { key: "itemTypeName", header: "품목유형명",   minWidth: 200, maxWidth: 400 },
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

  const sortOptions = useMemo(
    () => allColumns.map((c) => ({ value: c.key, label: c.header })),
    [allColumns]
  );

  const toggleSortDir = useCallback(() => setSortDir((d) => (d === "asc" ? "desc" : "asc")), []);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx-js-style");
    const header = visibleColumns.map((c) => c.header);
    const data = sortedList.map((r) => visibleColumns.map((c) => (r as any)[c.key] ?? ""));
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    Object.keys(ws).forEach((addr) => {
      if (addr.startsWith("!")) return;
      const cell = (ws as any)[addr];
      if (!cell) return;
      cell.s = { ...(cell.s ?? {}), font: { ...(cell.s?.font ?? {}), sz: 10 } };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "품목유형");
    (XLSX as any).writeFile(wb, `item_types_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [sortedList, visibleColumns]);

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedRowId), [rows, selectedRowId]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <PageHeader
        title="품목유형 관리"
        description="품목유형 기준정보를 조회하고 관리합니다."
        actions={
          <CrudActions
            onRegister={() => setRegisterOpen(true)}
            onEdit={() => { if (selectedRowId) setEditOpen(true); }}
            onDelete={async () => {
              if (!selectedRow) return;
              const ok = window.confirm(
                `선택한 품목유형을 삭제하시겠습니까?\n\n코드: ${selectedRow.itemTypeCode}\n명칭: ${selectedRow.itemTypeName}`
              );
              if (!ok) return;
              try {
                const res = await fetch(`/api/item-types/${selectedRowId}`, { method: "DELETE" });
                const data = await res.json();
                if (!data.ok) { alert("삭제 실패: " + (data.message ?? "")); return; }
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">검색 조건</CardTitle>
          <p className="text-xs text-muted-foreground">품목유형코드, 품목유형명으로 검색할 수 있습니다.</p>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div ref={searchRef} className="grid gap-3 sm:grid-cols-2">
            <Field
              label="품목유형코드"
              value={filters.itemTypeCode}
              onChange={(v) => handleFilterChange("itemTypeCode", v)}
            />
            <Field
              label="품목유형명"
              value={filters.itemTypeName}
              onChange={(v) => handleFilterChange("itemTypeName", v)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleSearch} disabled={loading}>
              <Search className="mr-1.5 h-4 w-4" />
              {loading ? "조회 중..." : "검색"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              필터 초기화
            </Button>
            <p className="text-[11px] text-muted-foreground">
              총 <span className="font-semibold">{filteredList.length}</span>건이 조회되었습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 그리드 */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-end">
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
            onSort={() => { setGridSettingsTab("sort"); setGridSettingsOpen(true); toggleSortDir(); }}
            onColumns={() => { setGridSettingsTab("columns"); setGridSettingsOpen(true); }}
            onView={() => { setGridSettingsTab("view"); setGridSettingsOpen(true); setStripedRows((v) => !v); }}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1">
            <MasterListGrid<ItemTypeRecord>
              maxHeight="100%"
              columns={visibleColumns as unknown as any}
              data={paged}
              keyExtractor={(r) => r.id}
              onRowClick={(row) => setSelectedRowId(row.id)}
              selectedRowId={selectedRowId}
              variant={stripedRows ? "striped" : "default"}
              pagination={{ page, pageSize, total, onPageChange: setPage }}
              getRowClassName={(_row, _index) => (compactView ? "" : "h-10")}
              emptyMessage={!hasSearched ? "검색 버튼을 클릭하면 조회됩니다." : loading ? "조회 중..." : "조건에 맞는 품목유형이 없습니다."}
            />
          </div>
        </CardContent>
      </Card>

      {/* 그리드 설정 Sheet */}
      <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">내보내기 · 정렬 · 컬럼 · 보기 설정</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              {(["export", "sort", "columns", "view"] as const).map((tab) => (
                <Button key={tab} size="sm" variant={gridSettingsTab === tab ? "default" : "outline"} onClick={() => setGridSettingsTab(tab)}>
                  {tab === "export" ? "내보내기" : tab === "sort" ? "정렬" : tab === "columns" ? "컬럼" : "보기"}
                </Button>
              ))}
            </div>

            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">검색/정렬된 전체 데이터가 EXCEL 파일(.xlsx)로 다운로드됩니다.</p>
                <Button size="sm" onClick={() => void exportExcel()}>EXCEL 내보내기</Button>
              </div>
            )}

            {gridSettingsTab === "sort" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">정렬 기준</Label>
                  <Select className="h-9 text-xs" value={String(sortKey)} options={sortOptions} onChange={(v) => setSortKey(v as keyof ItemTypeRecord)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSortDir}>{sortDir === "asc" ? "오름차순" : "내림차순"}</Button>
                  <p className="text-[11px] text-muted-foreground">정렬은 즉시 목록에 적용됩니다.</p>
                </div>
              </div>
            )}

            {gridSettingsTab === "columns" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">표시할 컬럼을 선택하세요. (최소 1개 유지)</p>
                <div className="grid grid-cols-2 gap-2">
                  {allColumns.map((c) => {
                    const checked = visibleColumnKeys.includes(c.key);
                    return (
                      <label key={c.key} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
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
                  <Button size="sm" variant="outline" onClick={() => setVisibleColumnKeys(allColumns.map((c) => c.key))}>전체 선택</Button>
                  <Button size="sm" variant="outline" onClick={() => setVisibleColumnKeys(["itemTypeCode", "itemTypeName"])}>기본값</Button>
                </div>
              </div>
            )}

            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                  <Checkbox checked={stripedRows} onChange={(e) => setStripedRows(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">컴팩트 보기</span>
                  <Checkbox checked={compactView} onChange={(e) => setCompactView(e.target.checked)} />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 등록 Sheet */}
      <ItemTypeRegisterSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        mode="create"
        onSave={async (draft) => {
          try {
            const res = await fetch("/api/item-types", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!data.ok) { alert("저장 실패: " + (data.message ?? "")); return; }
            setRows((prev) => [...prev, { id: String(data.id ?? Date.now()), ...draft }]);
            setSelectedRowId(null);
            setPage(1);
          } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
          }
        }}
      />

      {/* 수정 Sheet */}
      <ItemTypeRegisterSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialDraft={
          selectedRow
            ? { itemTypeCode: selectedRow.itemTypeCode, itemTypeName: selectedRow.itemTypeName }
            : undefined
        }
        onSave={async (draft) => {
          if (!selectedRowId) return;
          try {
            const res = await fetch(`/api/item-types/${selectedRowId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!data.ok) { alert("수정 실패: " + (data.message ?? "")); return; }
            setRows((prev) => prev.map((r) => (r.id === selectedRowId ? { ...r, ...draft } : r)));
          } catch (e) {
            console.error(e);
            alert("수정 중 오류가 발생했습니다.");
          }
        }}
      />
    </div>
  );
}
