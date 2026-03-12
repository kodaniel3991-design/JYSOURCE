"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DisplaySettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isLight = resolvedTheme === "light";

  return (
    <div className="space-y-6">
      <PageHeader
        title="화면 설정"
        description="라이트 / 다크 모드 등 화면 테마를 설정합니다. (브라우저 로컬 기준 데모)"
      />

      <Card>
        <CardHeader className="pb-3">
          <span className="text-sm font-medium text-muted-foreground">
            테마 모드
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            이 브라우저에서만 적용되는 화면 테마입니다. 시스템 기본값을 따라가도록 설정할 수도
            있습니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              라이트 모드
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              다크 모드
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
            >
              시스템 기본값 사용
            </Button>
          </div>

          <div className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-[11px]">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              현재 상태
            </div>
            <div className="mt-1 text-muted-foreground">
              저장된 설정:{" "}
              <span className="font-medium text-foreground">
                {theme === "light"
                  ? "라이트 모드"
                  : theme === "dark"
                  ? "다크 모드"
                  : "시스템 기본값"}
              </span>
              <br />
              실제 적용 모드:{" "}
              <span className="font-medium text-foreground">
                {isLight ? "라이트" : "다크"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

