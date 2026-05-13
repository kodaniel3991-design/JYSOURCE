"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function LedgerPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="매입매출장" />
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          준비 중입니다.
        </CardContent>
      </Card>
    </div>
  );
}
