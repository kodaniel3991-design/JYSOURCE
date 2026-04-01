/** 구매발주서 HTML 생성 (인쇄 팝업과 동일한 템플릿) */

export interface PoItemForHtml {
  itemCode:      string;
  itemName:      string;
  material:      string;
  specification: string;
  dueDate:       string;
  quantity:      number;
  unitPrice:     number;
  amount:        number;
}

export interface PurchaseOrderHtmlOptions {
  poNumber:            string;
  orderDate:           string;
  businessPlace:       string;
  supplierCode:        string;
  supplierName:        string;
  supplierRep:         string;
  supplierAddress:     string;
  supplierPhone:       string;
  supplierFax:         string;
  buyerName:           string;
  buyerCode:           string;
  currencyCode:        string;
  paymentType:         string;
  paymentTerms:        string;
  vatRate:             string;
  importType:          string;
  supplierQuotationNo: string;
  notes:               string;
  // 공급받는자 (자사 정보)
  recipient: {
    companyName:    string;
    representative: string;
    address:        string;
    tel:            string;
    fax:            string;
  };
  items: PoItemForHtml[];
}

const CURRENCY_LABELS: Record<string, string>  = { KRW: "KRW", USD: "USD", EUR: "EUR", JPY: "JPY" };
const PAYMENT_TYPE_LABELS: Record<string, string>  = { cash: "현금", transfer: "계좌이체", card: "카드", note: "어음", other: "기타" };
const PAYMENT_TERMS_LABELS: Record<string, string> = { immediate: "즉시", "30days": "30일", "60days": "60일", "90days": "90일", monthly: "월말" };
const IMPORT_TYPE_LABELS: Record<string, string>   = { domestic: "내수", import: "수입" };

function labelOf(map: Record<string, string>, val: string) {
  return map[val] ?? val ?? "";
}

export function buildPurchaseOrderHtml(opts: PurchaseOrderHtmlOptions): string {
  const B = "1px solid #000";
  const G = "background-color:#c6efce;";
  const Y = "background-color:#ffffc0;";

  const td = (style: string, content: string) => `<td style="${style}">${content}</td>`;
  const th = (style: string, content: string) => `<th style="${G}${style}">${content}</th>`;
  const fmt = (n: number) => n.toLocaleString("ko-KR");

  const filledItems = opts.items.filter((r) => r.itemCode);
  const EMPTY_ROWS = Math.max(0, 30 - filledItems.length);
  const totalQty  = filledItems.reduce((s, r) => s + r.quantity, 0);
  const supply    = filledItems.reduce((s, r) => s + r.amount, 0);
  const vat       = Math.round(supply * Number(opts.vatRate || 10) / 100);
  const total     = supply + vat;

  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>구매발주서 - ${opts.poNumber}</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic","맑은 고딕",sans-serif; font-size: 10px; color:#000; padding:8mm 10mm; }
  table { border-collapse: collapse; width: 100%; }
</style>
</head><body>

<table style="border:${B};margin-bottom:0;">
  <tr>
    <td colspan="4" style="text-align:center;font-size:22px;font-weight:700;letter-spacing:0.5em;padding:8px 6px;border-bottom:${B};">구 매 발 주 서</td>
  </tr>
  <tr>
    ${td(`padding:3px 6px;width:26%;`, "발주번호 : " + opts.poNumber)}
    ${td(`padding:3px 6px;width:30%;`, "발주일자 : " + opts.orderDate)}
    ${td(`padding:3px 6px;width:36%;`, "사업장 : " + opts.businessPlace)}
    ${td(`padding:3px 6px;width:8%;text-align:right;`, "Page : 1/1")}
  </tr>
</table>

<table style="margin-top:0;border:${B};">
  <colgroup>
    <col style="width:16px;"><col style="width:48px;"><col style="width:calc(50% - 64px);">
    <col style="width:16px;"><col style="width:48px;"><col>
  </colgroup>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${opts.recipient.companyName}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">공</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">상 호</td>
    <td style="border-bottom:${B};padding:2px 6px;">${opts.supplierName}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${opts.recipient.representative}&nbsp;(인)</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">대표자</td>
    <td style="border-bottom:${B};padding:2px 6px;">${opts.supplierRep}&nbsp;&nbsp;구매처 번호 : ${opts.supplierCode}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">받</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${opts.recipient.address}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">급</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">주 소</td>
    <td style="border-bottom:${B};padding:2px 6px;">${opts.supplierAddress}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">는</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;">${opts.recipient.tel}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">&nbsp;</td>
    <td style="border-right:${B};border-bottom:${B};padding:2px 6px;font-size:9px;">TEL</td>
    <td style="border-bottom:${B};padding:2px 6px;">${opts.supplierPhone}</td>
  </tr>
  <tr>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="border-right:${B};padding:2px 6px;">${opts.recipient.fax}</td>
    <td style="border-right:${B};text-align:center;padding:2px 1px;font-weight:700;font-size:9px;">자</td>
    <td style="border-right:${B};padding:2px 6px;font-size:9px;">FAX</td>
    <td style="padding:2px 6px;">${opts.supplierFax}</td>
  </tr>
</table>

<table style="margin-top:0;border:${B};">
  <tr>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">통화</td>
    <td style="border:${B};padding:2px 6px;width:10%;">${labelOf(CURRENCY_LABELS, opts.currencyCode)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:12%;">대금지급형태</td>
    <td style="border:${B};padding:2px 6px;width:12%;">${labelOf(PAYMENT_TYPE_LABELS, opts.paymentType)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:12%;">대금지급조건</td>
    <td style="border:${B};padding:2px 6px;width:12%;">${labelOf(PAYMENT_TERMS_LABELS, opts.paymentTerms)}</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">부가세율</td>
    <td style="border:${B};padding:2px 6px;width:8%;">${opts.vatRate}%</td>
    <td style="${G}border:${B};padding:2px 6px;font-size:9px;width:10%;">수입구분</td>
    <td style="border:${B};padding:2px 6px;">${labelOf(IMPORT_TYPE_LABELS, opts.importType)}</td>
  </tr>
</table>

<table style="margin-top:0;">
  <thead>
    <tr>
      ${th("border:" + B + ";padding:3px 2px;text-align:center;width:4%;", "순서")}
      ${th("border:" + B + ";padding:3px 4px;width:13%;", "품목번호")}
      ${th("border:" + B + ";padding:3px 4px;width:18%;", "품명")}
      ${th("border:" + B + ";padding:3px 4px;width:10%;", "재질")}
      ${th("border:" + B + ";padding:3px 4px;width:10%;", "규격")}
      ${th("border:" + B + ";padding:3px 4px;width:13%;", "납품요구일자")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:8%;", "수량")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:10%;", "단가")}
      ${th("border:" + B + ";padding:3px 4px;text-align:right;width:12%;", "금액")}
      ${th("border:" + B + ";padding:3px 4px;width:6%;", "단위")}
    </tr>
  </thead>
  <tbody>
    ${filledItems.map((row, idx) => `
    <tr style="height:19px;">
      ${td(`border:${B};padding:2px 2px;text-align:center;`, String(idx + 1))}
      ${td(`border:${B};padding:3px 4px;`, row.itemCode)}
      ${td(`border:${B};padding:3px 4px;`, row.itemName)}
      ${td(`border:${B};padding:3px 4px;`, row.material || "")}
      ${td(`border:${B};padding:3px 4px;`, row.specification || "")}
      ${td(`border:${B};padding:3px 4px;`, row.dueDate || "")}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, fmt(row.quantity))}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, fmt(row.unitPrice))}
      ${td(`border:${B};padding:3px 4px;text-align:right;`, fmt(row.amount))}
      ${td(`border:${B};padding:3px 4px;text-align:center;`, "EA")}
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

<table style="margin-top:0;">
  <tr>
    <td style="${Y}border:${B};padding:3px 4px;text-align:left;width:4%;">${filledItems.length} 건</td>
    <td style="${Y}border:${B};padding:3px 10px;text-align:left;width:13%;">** 합 계 **</td>
    <td style="${Y}border:${B};padding:3px 4px;width:18%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:10%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:10%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;width:13%;"></td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;width:8%;">${fmt(totalQty)}</td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;width:10%;">${fmt(supply)}</td>
    <td style="${Y}border:${B};padding:3px 4px;text-align:right;font-weight:700;width:12%;">${fmt(total)}</td>
    <td style="${Y}border:${B};padding:3px 4px;width:6%;"></td>
  </tr>
</table>

<table style="margin-top:0;border:${B};">
  <tr>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;">공급가액</td>
    <td style="border:${B};padding:3px 6px;width:20%;text-align:right;">${fmt(supply)} 원</td>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;">부가세 (${opts.vatRate}%)</td>
    <td style="border:${B};padding:3px 6px;width:20%;text-align:right;">${fmt(vat)} 원</td>
    <td style="${G}border:${B};padding:3px 6px;font-size:9px;width:12%;font-weight:700;">합계금액</td>
    <td style="border:${B};padding:3px 6px;font-weight:700;text-align:right;">${fmt(total)} 원</td>
  </tr>
</table>

<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:${B};padding:0;width:70%;height:58px;"></td>
    <td style="border:${B};padding:0;width:4%;vertical-align:middle;text-align:center;">
      <span style="writing-mode:vertical-rl;font-size:10px;letter-spacing:0.4em;font-weight:600;">결재</span>
    </td>
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

<table style="margin-top:0;width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:${B};padding:5px 20px;text-align:center;font-size:10px;">
      발주담당자 &nbsp;:&nbsp; ${opts.buyerName} (${opts.buyerCode})
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      구매처견적번호 &nbsp;:&nbsp; ${opts.supplierQuotationNo || "-"}
    </td>
  </tr>
</table>

</body></html>`;
}
