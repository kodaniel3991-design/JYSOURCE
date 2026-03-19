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
    const win = window.open("", "_blank", "width=860,height=1200");
    if (!win) {
      window.alert("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요."); // eslint-disable-line no-alert
      return;
    }

    const createdDate = po.createdAt
      ? (() => {
          const d = new Date(po.createdAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })()
      : "";
    const formatDueDate = (d: string) => (d ? d.replace(/-/g, "/") : "");

    const recipient = {
      companyName: "진양오토모티브(주) 김해공장",
      representative: "김상용",
      address: "경상남도 김해시 진영읍 서부로179번길",
      tel: "055-345-2100",
      fax: "055-342-4110",
    };
    const supplier = {
      companyName: po.supplierName,
      representative: "",
      purchaserNo: po.supplierId,
      address: "",
      telFax: "",
    };

    const totalQty = poItems.reduce((sum, i) => sum + i.quantity, 0);
    const EMPTY_ROWS = Math.max(0, 30 - poItems.length);

    const B = "1px solid #000";
    const G = "background-color:#c6efce;";
    const Y = "background-color:#ffffc0;";
    const td = (style: string, content: string, extra = "") =>
      `<td style="${style}" ${extra}>${content}</td>`;
    const th = (style: string, content: string) =>
      `<th style="${G}${style}">${content}</th>`;

    win.document.write(`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>구매발주서 - ${po.poNumber}</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic","맑은 고딕",sans-serif; font-size: 10px; color:#000; padding:8mm 10mm; }
  table { border-collapse: collapse; width: 100%; }
  .print-btn { text-align:right; margin-bottom:6px; }
  .print-btn button { padding:3px 14px; font-size:11px; cursor:pointer; }
  @media print { .print-btn { display:none; } }
</style>
</head><body>

<div class="print-btn"><button onclick="window.print()">인 쇄</button></div>

<!-- 제목 + 발주번호 (단일 외곽 테두리 박스) -->
<table style="border:${B};margin-bottom:0;">
  <tr>
    <td colspan="4" style="text-align:center;font-size:22px;font-weight:700;letter-spacing:0.5em;padding:8px 6px;border-bottom:${B};">구 매 발 주 서</td>
  </tr>
  <tr>
    ${td(`padding:3px 6px;width:26%;`,"발주번호 : "+po.poNumber)}
    ${td(`padding:3px 6px;width:30%;`,"발주일자 : "+createdDate)}
    ${td(`padding:3px 6px;width:36%;`,"")}
    ${td(`padding:3px 6px;width:8%;text-align:right;`,"Page : 1/1")}
  </tr>
</table>

<!-- 공급받는자 / 공급자 (6컬럼 단일 테이블 - 행 높이 자동 정렬) -->
<table style="margin-top:0;border:${B};">
  <colgroup>
    <col style="width:16px;"><col style="width:48px;"><col style="width:calc(50% - 64px);">
    <col style="width:16px;"><col style="width:48px;"><col>
  </colgroup>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.companyName}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-bottom:${B};padding:2px 6px;">${supplier.companyName}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.representative}&nbsp;(인)</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-bottom:${B};padding:2px 6px;">${supplier.representative || "김상용"}&nbsp;&nbsp;구매처 번호 : ${supplier.purchaserNo}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">받</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.address}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-bottom:${B};padding:2px 6px;">${supplier.address || "경상남도 김해시 진례면 테크로밸리로 108"}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">는</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${recipient.tel}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-bottom:${B};padding:2px 6px;">${(supplier.telFax || "").split("/")[0]?.trim() || ""}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="border-right:${B};padding:2px 6px;">${recipient.fax}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="padding:2px 6px;">${(supplier.telFax || "").split("/")[1]?.trim() || ""}</td>
  </tr>
</table>

<!-- 품목 테이블 -->
<table style="margin-top:0;">
  <thead>
    <tr>
      ${th("border:"+B+";padding:3px 2px;text-align:center;width:4%;","순서")}
      ${th("border:"+B+";padding:3px 4px;width:13%;","품목번호")}
      ${th("border:"+B+";padding:3px 4px;width:18%;","품명")}
      ${th("border:"+B+";padding:3px 4px;width:13%;","거래처품목번호")}
      ${th("border:"+B+";padding:3px 4px;width:10%;","규격")}
      ${th("border:"+B+";padding:3px 4px;width:13%;","납품요구일자")}
      ${th("border:"+B+";padding:3px 4px;text-align:center;width:9%;","차종")}
      ${th("border:"+B+";padding:3px 4px;text-align:right;width:7%;","수량")}
      ${th("border:"+B+";padding:3px 4px;text-align:center;width:5%;","단위")}
      ${th("border:"+B+";padding:3px 4px;width:8%;","비고")}
    </tr>
  </thead>
  <tbody>
    ${poItems.map((item, idx) => `
    <tr style="height:19px;">
      ${td(`border:${B};padding:2px 2px;text-align:center;`, String(idx + 1))}
      ${td(`border:${B};padding:3px 4px;`, item.itemCode)}
      ${td(`border:${B};padding:3px 4px;`, item.itemName)}
      ${td(`border:${B};padding:3px 4px;`, "")}
      ${td(`border:${B};padding:3px 4px;`, "")}
      ${td(`border:${B};padding:3px 4px;`, formatDueDate(item.dueDate))}
      ${td(`border:${B};padding:3px 4px;`, "")}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, item.quantity.toLocaleString("ko-KR"))}
      ${td(`border:${B};padding:3px 4px;text-align:center;`, "EA")}
      ${td(`border:${B};padding:3px 4px;`, "")}
    </tr>`).join("")}
    ${Array.from({ length: EMPTY_ROWS }, () => `
    <tr style="height:19px;">
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td><td style="border:${B};"></td><td style="border:${B};"></td>
      <td style="border:${B};"></td>
    </tr>`).join("")}
  </tbody>
</table>

<!-- 합계 행 (품목 테이블과 동일한 10컬럼, 노란 배경) -->
<table style="margin-top:0;">
  <tr>
    <td style="${Y}border:${B};padding:3px 4px;text-align:left;width:4%;">${poItems.length} 건</td>
    <td style="${Y}border:${B};padding:3px 10px;text-align:left;width:13%;">** 합 계 **</td>
    <td style="${Y}border:${B};padding:3px 4px;width:18%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:13%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:10%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:13%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:9%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;width:7%;">${totalQty.toLocaleString("ko-KR")}</td>
    <td style="${Y}border:${B};padding:3px 4px;width:5%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:8%;"></td>
  </tr>
</table>

<!-- 결재란 행 -->
<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <!-- 좌측 넓은 빈 셀 -->
    <td style="border:${B};padding:0;width:70%;height:58px;"></td>
    <!-- 결재 세로 텍스트 -->
    <td style="border:${B};padding:0;width:4%;vertical-align:middle;text-align:center;">
      <span style="writing-mode:vertical-rl;font-size:10px;letter-spacing:0.4em;font-weight:600;">결재</span>
    </td>
    <!-- 작성·검토·확인·승인 -->
    <td style="border:${B};padding:0;width:26%;vertical-align:top;">
      <table style="width:100%;height:100%;border-collapse:collapse;">
        <tr>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">작 성</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">검 토</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">확 인</td>
          <td style="border:${B};padding:3px 2px;text-align:center;font-size:10px;width:25%;">승 인</td>
        </tr>
        <tr>
          <td style="border:${B};height:42px;"></td>
          <td style="border:${B};"></td>
          <td style="border:${B};"></td>
          <td style="border:${B};"></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- 발주담당자 행 -->
<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:${B};padding:5px 20px;text-align:center;font-size:10px;">
      발주담당자 &nbsp;:&nbsp; ${po.assignedTo}
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      H.P &nbsp;:&nbsp; 010-0000-0000
    </td>
  </tr>
</table>

</body></html>`);
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
