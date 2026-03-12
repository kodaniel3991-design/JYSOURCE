"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">페이지를 불러오는 중 오류가 발생했습니다</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        개발 중이라면 터미널의 에러 로그를 확인하고, 캐시 삭제 후 다시 시도해 보세요.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>다시 시도</Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        해결이 안 되면: <code className="rounded bg-muted px-1.5 py-0.5">npm run dev:clean</code> 실행 후 브라우저 강력 새로고침(Ctrl+Shift+R)
      </p>
    </div>
  );
}
