"use client";

import { useEffect, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { Sheet, SheetContent, SheetHeader as SheetHdr, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { apiPath } from "@/lib/api-path";

interface Category {
  Id: number;
  CategoryKey: string;
  Label: string;
  Description: string;
  SortOrder: number;
  CodeCount: number;
}

interface CodeItem {
  Id: number;
  Category: string;
  Code: string;
  Name: string;
  SortOrder: number;
}

export default function CommonCodesPage() {
  const [categories, setCategories] = useCachedState<Category[]>("common-codes/categories", []);
  const [selectedKey, setSelectedKey] = useCachedState<string>("common-codes/selectedKey", "");
  const [codes, setCodes] = useCachedState<CodeItem[]>("common-codes/codes", []);
  const [cachedCodesKey, setCachedCodesKey] = useCachedState<string>("common-codes/cachedCodesKey", "");
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");

  // 분류 입력
  const [newCatKey, setNewCatKey] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // 코드 입력
  const [draftCode, setDraftCode] = useState("");
  const [draftName, setDraftName] = useState("");

  // ── 분류 목록 로드 ──
  const loadCategories = async () => {
    setLoadingCat(true);
    try {
      const r = await fetch(apiPath("/api/common-codes/categories"));
      const data = await r.json();
      if (data.ok) {
        setCategories(data.categories);
        if (!selectedKey && data.categories.length > 0)
          setSelectedKey(data.categories[0].CategoryKey);
      }
    } finally {
      setLoadingCat(false);
    }
  };

  // ── 코드 목록 로드 ──
  const loadCodes = async (category: string) => {
    if (!category) return;
    setLoadingCode(true);
    try {
      const r = await fetch(apiPath(`/api/common-codes?category=${encodeURIComponent(category)}`));
      const data = await r.json();
      if (data.ok) { setCodes(data.items); setCachedCodesKey(category); }
    } finally {
      setLoadingCode(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (categories.length > 0) return; loadCategories(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedKey && selectedKey !== cachedCodesKey) loadCodes(selectedKey); }, [selectedKey]);

  // ── 분류 추가 ──
  const handleAddCategory = async () => {
    const key = newCatKey.trim();
    const label = newCatLabel.trim();
    if (!key || !label) return;
    const r = await fetch(apiPath("/api/common-codes/categories"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryKey: key, label, description: newCatDesc.trim(), sortOrder: categories.length }),
    });
    const data = await r.json();
    if (!data.ok) { alert(data.message); return; }
    setNewCatKey(""); setNewCatLabel(""); setNewCatDesc("");
    await loadCategories();
    setSelectedKey(key);
  };

  // ── 코드 추가 ──
  const handleAddCode = async () => {
    if (!draftCode.trim() || !draftName.trim() || !selectedKey) return;
    const r = await fetch(apiPath("/api/common-codes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: selectedKey, code: draftCode.trim(), name: draftName.trim(), sortOrder: codes.length }),
    });
    const data = await r.json();
    if (!data.ok) { alert(data.message); return; }
    setDraftCode(""); setDraftName("");
    await loadCodes(selectedKey);
    await loadCategories();
  };

  // ── 코드 삭제 ──
  const handleDeleteCode = async (id: number) => {
    if (!confirm("이 코드를 삭제하시겠습니까?")) return;
    const r = await fetch(apiPath(`/api/common-codes/${id}`), { method: "DELETE" });
    const data = await r.json();
    if (!data.ok) { alert(data.message); return; }
    await loadCodes(selectedKey);
    await loadCategories();
  };

  const selectedMeta = categories.find((c) => c.CategoryKey === selectedKey);

  return (
    <>
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 7rem)" }}>
      <PageHeader
        title="공통코드 관리"
        description="1차 분류를 선택한 뒤 해당 분류의 세부 코드를 등록·관리합니다."
      />

      <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
        {/* 1 Depth: 분류 선택 */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <span className="text-sm font-medium text-muted-foreground">코드 분류 (1 Depth)</span>
            <p className="mt-1 text-[11px] text-muted-foreground">공통코드를 묶는 상위 분류입니다.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2 text-xs flex-1 min-h-0 overflow-hidden">
            {/* 분류 추가 입력 */}
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
              <div className="flex flex-1 min-w-[120px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">분류코드</span>
                <Input placeholder="예: plant, warehouse" className="h-8 text-[11px]"
                  value={newCatKey} onChange={(e) => setNewCatKey(e.target.value)} />
              </div>
              <div className="flex flex-1 min-w-[120px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">분류명</span>
                <Input placeholder="예: 사업장 코드" className="h-8 text-[11px]"
                  value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} />
              </div>
              <Button type="button" size="sm" className="mt-1" onClick={handleAddCategory}>
                분류 추가
              </Button>
            </div>

            {/* 분류 목록 */}
            <div className="rounded-md border flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex border-b bg-muted px-3 py-1.5 text-[11px] font-semibold text-slate-700 shrink-0">
                <div className="w-28">분류코드</div>
                <div className="flex-1">분류명</div>
                <div className="w-10 text-right">건수</div>
              </div>
              {loadingCat ? (
                <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">조회 중...</div>
              ) : categories.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">등록된 분류가 없습니다.</div>
              ) : (
                <div className="flex-1 overflow-auto">
                  {categories.map((cat) => {
                    const isActive = cat.CategoryKey === selectedKey;
                    return (
                      <button
                        key={cat.CategoryKey}
                        type="button"
                        onClick={() => { setSelectedKey(cat.CategoryKey); setDraftCode(""); setDraftName(""); }}
                        className={`flex w-full border-t px-3 py-1.5 text-left text-[11px] transition-colors ${
                          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <div className="w-28 font-mono text-[11px] text-slate-700 truncate">{cat.CategoryKey}</div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold">{cat.Label}</div>
                          {cat.Description && (
                            <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{cat.Description}</div>
                          )}
                        </div>
                        <div className="w-10 text-right text-[10px] text-muted-foreground">{cat.CodeCount}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2 Depth: 코드 목록 */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-2 shrink-0 flex flex-row items-start justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {selectedMeta ? `${selectedMeta.Label} 코드 (2 Depth)` : "코드 목록"}
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">화면 전체에서 공통으로 사용하는 코드 값입니다.</p>
            </div>
            <DataGridToolbar
              active={gridSettingsOpen ? gridSettingsTab : undefined}
              onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2 text-xs flex-1 min-h-0 overflow-hidden">
            {/* 코드 추가 입력 */}
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
              <div className="flex flex-1 min-w-[120px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">코드</span>
                <Input placeholder="예: gimhae, 10" className="h-8 text-xs"
                  value={draftCode} onChange={(e) => setDraftCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCode()} />
              </div>
              <div className="flex flex-1 min-w-[120px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">명칭</span>
                <Input placeholder="예: 김해공장, 원부자재창고" className="h-8 text-xs"
                  value={draftName} onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCode()} />
              </div>
              <Button type="button" size="sm" className="mt-1" onClick={handleAddCode} disabled={!selectedKey}>
                코드 추가
              </Button>
            </div>

            {/* 코드 목록 */}
            <div className="rounded-md border flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex border-b bg-muted px-3 py-1.5 text-[11px] font-semibold text-slate-700 shrink-0">
                <div className="w-28">코드</div>
                <div className="flex-1">명칭</div>
                <div className="w-8" />
              </div>
              {loadingCode ? (
                <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">조회 중...</div>
              ) : codes.length === 0 ? (
                <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                  {selectedKey ? "등록된 코드가 없습니다." : "왼쪽에서 분류를 선택하세요."}
                </div>
              ) : (
                <div className="flex-1 overflow-auto text-xs">
                  {codes.map((c) => (
                    <div key={c.Id} className="flex items-center border-t px-3 py-2 text-xs hover:bg-muted/40">
                      <div className="w-28 font-mono text-[11px] text-slate-700 shrink-0">{c.Code}</div>
                      <div className="flex-1 font-medium">{c.Name}</div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCode(c.Id)}
                        className="w-8 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
      <SheetContent>
        <SheetHdr>
          <SheetTitle>그리드 설정</SheetTitle>
          <SheetDescription className="text-xs">내보내기 설정</SheetDescription>
        </SheetHdr>
        <div className="mt-4 space-y-5 text-xs">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="default" onClick={() => setGridSettingsTab("export")}>내보내기</Button>
          </div>
          {gridSettingsTab === "export" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">현재 선택된 분류의 코드 목록을 CSV 파일로 다운로드합니다.</p>
              <Button size="sm" disabled={codes.length === 0} onClick={() => {
                if (codes.length === 0) return;
                const header = ["코드","명칭"];
                const rows = codes.map((c) => [`"${c.Code}"`, `"${c.Name}"`].join(",")).join("\n");
                const csv = [header.join(","), rows].join("\n");
                const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `common-codes-${selectedKey}.csv`;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); URL.revokeObjectURL(url);
              }}>CSV 내보내기</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
