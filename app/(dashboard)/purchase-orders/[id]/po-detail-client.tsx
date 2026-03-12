"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { POSummaryCards } from "@/components/purchase/po-summary-cards";
import { POItemsTable } from "@/components/purchase/po-items-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getPurchaseOrderById } from "@/lib/mock/purchase-orders";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Pencil, Send, FileDown } from "lucide-react";

export function PODetailClient({ id }: { id: string }) {
  const router = useRouter();
  const po = useMemo(() => getPurchaseOrderById(id), [id]);
  if (!po) notFound();

  const poItems = Array.isArray(po.items) ? po.items : [];

  const handleEdit = () => {
    // 데모용: 신규 구매오더 작성 페이지로 이동 (실제에선 편집 화면으로 연결)
    router.push("/purchase-orders/create");
  };

  const handleIssue = () => {
    // 데모용: 구매발주서 인쇄용 화면 생성
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) {
      window.alert("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요."); // eslint-disable-line no-alert
      return;
    }

    const createdDate = formatDate(po.createdAt);
    const dueDate = formatDate(po.dueDate);

    win.document.write(`<!doctype html>
<html lang="ko">
  <head>
    <meta charSet="utf-8" />
    <title>구매발주서 - ${po.poNumber}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
      }
      .title {
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        margin: 12px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #999;
        padding: 4px 6px;
      }
      .no-border { border: none !important; }
      .header-table th {
        background: #f8f8f8;
        font-weight: 500;
        text-align: left;
      }
      .line-green {
        background: #e6ffe6;
      }
      .line-yellow {
        background: #fff9cc;
      }
      .right { text-align: right; }
      .center { text-align: center; }
      .mt-8 { margin-top: 8px; }
      .mt-16 { margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="title">구 매 발 주 서</div>

    <table class="header-table">
      <tr>
        <th style="width: 80px;">발주번호</th>
        <td style="width: 160px;">${po.poNumber}</td>
        <th style="width: 80px;">발주일자</th>
        <td style="width: 160px;">${createdDate}</td>
        <th style="width: 60px;">Page</th>
        <td>1 / 1</td>
      </tr>
      <tr>
        <th>공&nbsp;&nbsp;&nbsp;급&nbsp;&nbsp;&nbsp;사</th>
        <td colspan="2">${po.supplierName}</td>
        <th>납품요구일자</th>
        <td colspan="2">${dueDate}</td>
      </tr>
    </table>

    <table class="mt-8">
      <tr>
        <th style="width: 40px;" class="center">순번</th>
        <th style="width: 120px;">거래처품목코드</th>
        <th>품명</th>
        <th style="width: 120px;">규격</th>
        <th style="width: 80px;" class="center">수량</th>
        <th style="width: 80px;" class="center">단위</th>
        <th style="width: 100px;" class="center">단가</th>
        <th style="width: 120px;" class="center">금액</th>
      </tr>
      ${poItems
        .map(
          (item, idx) => `
      <tr class="line-green">
        <td class="center">${idx + 1}</td>
        <td>${item.itemCode}</td>
        <td>${item.itemName}</td>
        <td></td>
        <td class="right">${item.quantity.toLocaleString("ko-KR")}</td>
        <td class="center">EA</td>
        <td class="right">${item.unitPrice.toLocaleString("ko-KR")}</td>
        <td class="right">${item.amount.toLocaleString("ko-KR")}</td>
      </tr>`
        )
        .join("")}
    </table>

    <table class="mt-8">
      <tr class="line-yellow">
        <td style="width: 60px;" class="center">건수</td>
        <td style="width: 80px;" class="center">${poItems.length}</td>
        <td>합계</td>
        <td class="right">${po.totalAmount.toLocaleString("ko-KR")}</td>
      </tr>
    </table>

    <div class="mt-16">
      발주담당자: ${po.assignedTo}
    </div>
  </body>
</html>`);

    win.document.close();
  };

  const handleDownloadPdf = () => {
    // 데모용: 간단한 텍스트 내용을 가진 가짜 "PDF" 파일 다운로드
    const content = `PO 번호: ${po.poNumber}\n구매처: ${po.supplierName}\n총 금액: ${po.totalAmount.toLocaleString(
      "ko-KR"
    )} ${po.currency}\n발주일자: ${formatDate(po.createdAt)}`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${po.poNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/purchase-orders" className="hover:text-foreground">
          구매오더
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{po.poNumber}</span>
      </nav>

      <PageHeader
        title={`구매오더 상세 · ${po.poNumber}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Pencil className="mr-2 h-4 w-4" />
              편집
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIssue}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Send className="mr-2 h-4 w-4" />
              PO 발행
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <FileDown className="mr-2 h-4 w-4" />
              PDF 다운로드
            </Button>
          </>
        }
      />

      <POSummaryCards po={po} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <POItemsTable items={poItems} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">발주 기본정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">담당자</span>
                <span>{po.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">통화</span>
                <span>{po.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">생성일</span>
                <span>{formatDate(po.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수정일</span>
                <span>{formatDate(po.updatedAt)}</span>
              </div>
              {po.priority && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">우선순위</span>
                  <span className="capitalize">{po.priority}</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">첨부파일</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                등록된 첨부파일이 없습니다.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {po.notes || "등록된 메모가 없습니다."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="receipt">입고 이력</TabsTrigger>
          <TabsTrigger value="changelog">변경 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">개요</CardTitle>
              <p className="text-sm text-muted-foreground">
                발주 요약 및 주요 일자 정보입니다.
              </p>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                이 PO는 {formatDate(po.createdAt)}에 생성되었으며, 마지막 수정일은{" "}
                {formatDate(po.updatedAt)} 입니다. 납기 예정일은{" "}
                {formatDate(po.dueDate)} 입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">입고 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                아직 등록된 입고 이력이 없습니다. (mock 데이터)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="changelog">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">변경 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span>상태가 Issued 로 변경됨</span>
                  <span className="text-muted-foreground">
                    {formatDate(po.updatedAt)}
                  </span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span>PO 생성</span>
                  <span className="text-muted-foreground">
                    {formatDate(po.createdAt)}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
