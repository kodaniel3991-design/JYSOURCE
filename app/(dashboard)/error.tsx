"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">페이지를 불러오지 못했습니다</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          데이터를 가져오는 중 오류가 발생했습니다.<br />
          잠시 후 다시 시도하거나 페이지를 새로고침 해주세요.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
          <Home className="h-4 w-4" />
          대시보드로
        </Button>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground/50">오류 코드: {error.digest}</p>
      )}
    </div>
  );
}
