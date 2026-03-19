"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">오류가 발생했습니다</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        페이지를 불러오는 중 문제가 생겼습니다. 새로고침하거나 로그인 페이지에서 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <Link href="/login">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              로그인
            </Button>
          </Link>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
