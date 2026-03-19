import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center bg-background">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold text-foreground">404</p>
        <h1 className="text-xl font-semibold text-foreground">페이지를 찾을 수 없습니다</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Home className="h-4 w-4" />
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
