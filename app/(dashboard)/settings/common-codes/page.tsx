"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { businessPlaceOptions, paymentTypeOptions, paymentTermOptions, importTypeOptions } from "@/lib/mock/po-options";

type CommonCode = {
  code: string;
  name: string;
};

// 분류명에서 분류코드 자동 생성 (간단 로마자/영문 슬러그 변환)
function toCategoryKey(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";

  // 자주 쓸 것으로 예상되는 한글 분류명 매핑
  const predefined: Record<string, string> = {
    "사업장 코드": "plant",
    사업장: "plant",
    "결제방법": "payment_type",
    "결제 방법": "payment_type",
    "결제수단": "payment_type",
    "결제 조건": "payment_term",
    "결제조건": "payment_term",
    "수입구분": "import_type",
    "수입 구분": "import_type",
    "통화코드": "currency",
    통화: "currency",
  };

  if (predefined[trimmed]) return predefined[trimmed];

  // 한글을 단순 영문으로 치환하기 위한 기본 매핑 (초성 위주, 데모용)
  const korMap: Record<string, string> = {
    사: "sa",
    업: "up",
    장: "jang",
    결: "gyeol",
    제: "je",
    조: "jo",
    건: "geon",
    수: "su",
    입: "ip",
    구: "gu",
    분: "bun",
    통: "tong",
    화: "hwa",
    코: "ko",
    드: "deu",
  };

  let result = "";
  for (const ch of trimmed) {
    if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch.toLowerCase();
    } else if (ch === " " || ch === "-" || ch === "_") {
      result += "_";
    } else if (korMap[ch]) {
      result += korMap[ch];
    }
    // 기타 문자는 제거
  }

  // 연속된 언더스코어 정리
  result = result.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return result || "category";
}

export default function CommonCodesPage() {
  const [categories, setCategories] = useState<
    { key: string; label: string; description: string }[]
  >([
    {
      key: "plant",
      label: "사업장 코드",
      description: "공장/사업장 구분 코드 (예: 김해공장, 울산공장).",
    },
    {
      key: "paymentType",
      label: "결제방법",
      description: "계좌이체, L/C, 어음 등 결제 수단.",
    },
    {
      key: "paymentTerm",
      label: "결제조건",
      description: "매입 30일, 60일, 선급 등 결제 조건.",
    },
    {
      key: "importType",
      label: "수입구분",
      description: "내수 / 수입 등 구매 유형.",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("plant");

  const [codesByCategory, setCodesByCategory] = useState<
    Record<string, CommonCode[]>
  >({
    plant: businessPlaceOptions.map((o) => ({
      code: o.value,
      name: o.label,
    })),
    paymentType: paymentTypeOptions.map((o) => ({
      code: o.value,
      name: o.label,
    })),
    paymentTerm: paymentTermOptions.map((o) => ({
      code: o.value,
      name: o.label,
    })),
    importType: importTypeOptions.map((o) => ({
      code: o.value,
      name: o.label,
    })),
  });

  const [draftCode, setDraftCode] = useState("");
  const [draftName, setDraftName] = useState("");

  const selectedMeta = useMemo(
    () => categories.find((c) => c.key === selectedCategory) ?? categories[0],
    [categories, selectedCategory]
  );

  const currentCodes = codesByCategory[selectedCategory];

  const handleAdd = () => {
    if (!draftCode.trim() || !draftName.trim()) return;
    setCodesByCategory((prev) => ({
      ...prev,
      [selectedCategory]: [
        ...prev[selectedCategory],
        { code: draftCode.trim(), name: draftName.trim() },
      ],
    }));
    setDraftCode("");
    setDraftName("");
  };

  const [newCategoryKey, setNewCategoryKey] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  // 분류명 입력 시 분류코드 자동 생성 (사용자가 직접 코드를 입력하면 그 값 우선)
  useEffect(() => {
    if (newCategoryLabel && !newCategoryKey) {
      setNewCategoryKey(toCategoryKey(newCategoryLabel));
    }
  }, [newCategoryLabel, newCategoryKey]);

  const handleAddCategory = () => {
    const key = newCategoryKey.trim();
    const label = newCategoryLabel.trim();
    const desc = newCategoryDesc.trim();
    if (!key || !label) return;
    // 이미 존재하는 키는 추가하지 않음
    if (categories.some((c) => c.key === key)) return;

    const nextCategories = [
      ...categories,
      {
        key,
        label,
        description: desc || `${label} 관련 공통코드입니다.`,
      },
    ];
    setCategories(nextCategories);
    setCodesByCategory((prev) => ({
      ...prev,
      [key]: [],
    }));
    setSelectedCategory(key);
    setNewCategoryKey("");
    setNewCategoryLabel("");
    setNewCategoryDesc("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="공통코드 관리"
        description="1차 분류(사업장, 결제방법 등)를 선택한 뒤, 해당 분류의 세부 코드를 등록·관리합니다. (데모)"
      />

      {/* 1 Depth / 2 Depth 영역을 동일한 가로 비율로 나누기 위해 grid 2열 사용.
          높이는 헤더를 제외한 화면 하단까지 확장되도록 계산식 적용. */}
      <div className="grid gap-4 md:grid-cols-2 md:h-[calc(100vh-220px)]">
        {/* 1 depth: 코드 분류 선택 */}
        <Card className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              코드 분류 (1 Depth)
            </span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              공통코드를 묶는 상위 분류입니다. 예: 사업장 코드, 결제조건, 결제방법 등.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            {/* 1Depth 분류 추가 - 2Depth 입력과 동일한 구조 */}
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
              <div className="flex flex-1 min-w-[140px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">분류코드</span>
                <Input
                  placeholder="예: plant, paymentType"
                  className="h-8 text-[11px]"
                  value={newCategoryKey}
                  onChange={(e) => setNewCategoryKey(e.target.value)}
                />
              </div>
              <div className="flex flex-1 min-w-[140px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">분류명</span>
                <Input
                  placeholder="예: 사업장 코드, 결제조건"
                  className="h-8 text-[11px]"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-1"
                onClick={handleAddCategory}
              >
                분류 추가
              </Button>
            </div>

            {/* 1Depth 목록 - 2Depth와 동일한 테이블 형태 */}
            <div className="rounded-md border">
              <div className="flex border-b bg-muted px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                <div className="w-24">분류코드</div>
                <div className="flex-1">분류명</div>
              </div>
              {categories.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                  등록된 분류가 없습니다. 위 입력 영역에서 1 Depth 분류를 추가하세요.
                </div>
              ) : (
                <div className="max-h-52 overflow-auto">
                  {categories.map((cat) => {
                    const isActive = cat.key === selectedCategory;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          setDraftCode("");
                          setDraftName("");
                        }}
                        className={`flex w-full border-t px-3 py-1.5 text-left text-[11px] transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="w-24 font-mono text-[11px] text-slate-700">
                          {cat.key}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold">
                            {cat.label}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                            {cat.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2 depth: 선택된 분류의 코드 목록 + 입력 */}
        <Card className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedMeta.label} 코드 (2 Depth)
                </span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  화면 전체에서 공통으로 사용하는 코드 값입니다. 이 화면의 변경은
                  데모 상태에서만 로컬에 반영됩니다.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
              <div className="flex flex-1 min-w-[160px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">코드</span>
                <Input
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  placeholder="예: gimhae, net30, transfer"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-1 min-w-[160px] flex-col gap-1">
                <span className="text-[11px] text-slate-600">명칭</span>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="예: 김해공장, 매입 30일, 계좌이체"
                  className="h-8 text-xs"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-1"
                onClick={handleAdd}
              >
                코드 추가
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="flex border-b bg-muted px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                <div className="w-32">코드</div>
                <div className="flex-1">명칭</div>
              </div>
              {currentCodes.length === 0 ? (
                <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                  등록된 코드가 없습니다. 상단 입력 영역에서 코드를 추가해 주세요.
                </div>
              ) : (
                <div className="max-h-72 overflow-auto text-xs">
                  {currentCodes.map((c) => (
                    <div
                      key={c.code}
                      className="flex border-t px-3 py-1.5 text-xs"
                    >
                      <div className="w-32 font-mono text-[11px] text-slate-700">
                        {c.code}
                      </div>
                      <div className="flex-1">{c.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


