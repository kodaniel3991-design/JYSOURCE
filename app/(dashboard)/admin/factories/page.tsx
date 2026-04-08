"use client";

import { useCallback, useEffect, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Factory } from "lucide-react";
import { apiPath } from "@/lib/api-path";

interface FactoryRow {
  FactoryCode: string;
  FactoryName: string;
  SortOrder: number;
  IsActive: boolean;
}

const EMPTY_DRAFT: Omit<FactoryRow, "FactoryCode"> & { FactoryCode: string } = {
  FactoryCode: "",
  FactoryName: "",
  SortOrder: 0,
  IsActive: true,
};

export default function AdminFactoriesPage() {
  const [rows, setRows] = useCachedState<FactoryRow[]>("admin/factories/rows", []);
  const [loading, setLoading] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FactoryRow | null>(null);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/admin/factories"));
      const data = await res.json();
      if (data.ok) setRows(data.factories);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (rows.length > 0) return; load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setDraft({ ...EMPTY_DRAFT });
    setError(null);
    setSheetOpen(true);
  };

  const openEdit = (row: FactoryRow) => {
    setEditTarget(row);
    setDraft({
      FactoryCode: row.FactoryCode,
      FactoryName: row.FactoryName,
      SortOrder: row.SortOrder,
      IsActive: row.IsActive,
    });
    setError(null);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(apiPath(`/api/admin/factories/${editTarget.FactoryCode}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            factoryName: draft.FactoryName,
            sortOrder: draft.SortOrder,
            isActive: draft.IsActive,
          }),
        });
      } else {
        res = await fetch(apiPath("/api/admin/factories"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            factoryCode: draft.FactoryCode,
            factoryName: draft.FactoryName,
            sortOrder: draft.SortOrder,
            isActive: draft.IsActive,
          }),
        });
      }
      const data = await res.json();
      if (!data.ok) { setError(data.message); return; }
      setSheetOpen(false);
      await load();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: FactoryRow) => {
    if (!confirm(`"${row.FactoryName}" 공장을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(apiPath(`/api/admin/factories/${row.FactoryCode}`), { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) { alert(data.message); return; }
      await load();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="공장 관리"
        description="로그인 시 선택 가능한 공장 목록을 관리합니다."
      />

      <div className="flex items-center justify-between">
        <DataGridToolbar
          active={gridSettingsOpen ? gridSettingsTab : undefined}
          onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
        />
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          공장 추가
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공장코드</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공장명</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">순서</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">상태</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  불러오는 중...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Factory className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  등록된 공장이 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.FactoryCode} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-medium">{row.FactoryCode}</td>
                <td className="px-4 py-3">{row.FactoryName}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{row.SortOrder}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.IsActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}>
                    {row.IsActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">내보내기 설정</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => setGridSettingsTab("export")}>내보내기</Button>
            </div>
            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">현재 공장 목록을 CSV 파일로 다운로드합니다.</p>
                <Button size="sm" disabled={rows.length === 0} onClick={() => {
                  if (rows.length === 0) return;
                  const header = ["공장코드", "공장명", "정렬순서", "상태"];
                  const csvRows = rows.map((r) => [r.FactoryCode, r.FactoryName, String(r.SortOrder), r.IsActive ? "활성" : "비활성"]);
                  const csv = [header, ...csvRows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
                  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "factories.csv";
                  document.body.appendChild(a); a.click();
                  document.body.removeChild(a); URL.revokeObjectURL(url);
                }}>CSV 내보내기</Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editTarget ? "공장 수정" : "공장 추가"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>공장코드</Label>
              <Input
                value={draft.FactoryCode}
                onChange={(e) => setDraft((d) => ({ ...d, FactoryCode: e.target.value.toUpperCase() }))}
                placeholder="예: F01"
                disabled={!!editTarget || saving}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label>공장명</Label>
              <Input
                value={draft.FactoryName}
                onChange={(e) => setDraft((d) => ({ ...d, FactoryName: e.target.value }))}
                placeholder="예: 1공장"
                disabled={saving}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>정렬 순서</Label>
              <Input
                type="number"
                value={draft.SortOrder}
                onChange={(e) => setDraft((d) => ({ ...d, SortOrder: Number(e.target.value) }))}
                disabled={saving}
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={draft.IsActive}
                onChange={(e) => setDraft((d) => ({ ...d, IsActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer"
                disabled={saving}
              />
              <Label htmlFor="isActive" className="cursor-pointer">활성화</Label>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={saving}
                onClick={() => setSheetOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || !draft.FactoryCode.trim() || !draft.FactoryName.trim()}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
