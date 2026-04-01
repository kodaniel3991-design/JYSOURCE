import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDbPool, sql } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { decryptText } from "@/lib/auth/crypto";
import { buildPurchaseOrderHtml } from "@/lib/pdf/purchase-order-html";
import { htmlToPdf } from "@/lib/pdf/html-to-pdf";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // ── 세션 확인 ────────────────────────────────────────────────────────────
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const pool = await getDbPool();
    const poId = Number(params.id);

    // EmailPassword 컬럼 없으면 자동 추가
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.AppUser') AND name = 'EmailPassword'
      )
      ALTER TABLE dbo.AppUser ADD EmailPassword NVARCHAR(500) NULL
    `);

    // ── 발신자 정보 조회 (AppUser) ────────────────────────────────────────
    const userResult = await pool.request()
      .input("Username", sql.NVarChar(50), session.username)
      .query(`
        SELECT
          ISNULL(UserId, Username) AS DisplayName,
          ISNULL(Email, '')         AS Email,
          ISNULL(EmailPassword, '') AS EmailPassword
        FROM dbo.AppUser
        WHERE Username = @Username AND IsActive = 1
      `);

    const senderName     = String(userResult.recordset[0]?.DisplayName  ?? session.username);
    const senderEmail    = String(userResult.recordset[0]?.Email        ?? "");
    const rawEmailPw     = String(userResult.recordset[0]?.EmailPassword ?? "");
    let smtpPass = "";
    if (rawEmailPw) {
      try { smtpPass = decryptText(rawEmailPw); } catch { smtpPass = ""; }
    }

    if (!senderEmail) {
      return NextResponse.json(
        { ok: false, message: "발신자 이메일이 등록되지 않았습니다. 관리자에게 이메일 주소 등록을 요청하세요." },
        { status: 400 }
      );
    }
    if (!smtpPass) {
      return NextResponse.json(
        { ok: false, message: "메일 비밀번호가 등록되지 않았습니다. 관리자에게 메일 비밀번호 등록을 요청하세요." },
        { status: 400 }
      );
    }

    // ── 발주서 기본정보 + 구매처 이메일 조회 ─────────────────────────────
    const poResult = await pool.request()
      .input("Id", sql.Int, poId)
      .query(`
        SELECT
          po.PoNumber, po.SupplierCode, po.SupplierName,
          po.BuyerCode, po.BuyerName,
          po.CurrencyCode, po.PaymentType, po.PaymentTerms,
          po.ImportType, po.SupplierQuotationNo,
          CONVERT(NVARCHAR(10), po.OrderDate, 23) AS OrderDate,
          po.BusinessPlace, po.VatRate, po.Notes,
          ISNULL(p.Email,                '') AS SupplierEmail,
          ISNULL(p.RepresentativeName,   '') AS SupplierRep,
          ISNULL(p.Address,              '') AS SupplierAddress,
          ISNULL(p.PhoneNo,              '') AS SupplierPhone,
          ISNULL(p.FaxNo,                '') AS SupplierFax
        FROM dbo.PurchaseOrder po
        LEFT JOIN dbo.Purchaser p ON p.PurchaserNo = po.SupplierCode
        WHERE po.Id = @Id
      `);

    if (poResult.recordset.length === 0) {
      return NextResponse.json({ ok: false, message: "발주서를 찾을 수 없습니다." }, { status: 404 });
    }

    const po = poResult.recordset[0] as Record<string, unknown>;
    const recipientEmail = String(po.SupplierEmail ?? "");

    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, message: "구매처 이메일이 등록되지 않았습니다." },
        { status: 400 }
      );
    }

    // ── 발주 품목 조회 ───────────────────────────────────────────────────
    const itemsResult = await pool.request()
      .input("PurchaseOrderId", sql.Int, poId)
      .query(`
        SELECT SpecNo, ItemCode, ItemName,
               ISNULL(Material, '')      AS Material,
               ISNULL(Specification, '') AS Specification,
               CONVERT(NVARCHAR(10), DueDate, 23) AS DueDate,
               Quantity, UnitPrice, Amount
        FROM dbo.PurchaseOrderItem
        WHERE PurchaseOrderId = @PurchaseOrderId
        ORDER BY SpecNo
      `);

    const items = itemsResult.recordset as Record<string, unknown>[];

    // ── 금액 계산 ────────────────────────────────────────────────────────
    const supplyTotal = items.reduce((s, i) => s + Number(i.Amount ?? 0), 0);
    const vatRate     = Number(po.VatRate ?? 10) / 100;
    const vatTotal    = Math.round(supplyTotal * vatRate);
    const grandTotal  = supplyTotal + vatTotal;

    const fmt = (n: number) => n.toLocaleString("ko-KR");
    const pad = (s: string, len: number) => s.padEnd(len, " ");

    // ── 품목 텍스트 테이블 ────────────────────────────────────────────────
    const itemLines = items.map((it, idx) => {
      const no    = String(idx + 1).padStart(3, " ");
      const code  = pad(String(it.ItemCode ?? ""), 14);
      const name  = pad(String(it.ItemName ?? ""), 20);
      const qty   = fmt(Number(it.Quantity  ?? 0)).padStart(8,  " ");
      const price = fmt(Number(it.UnitPrice ?? 0)).padStart(10, " ");
      const amt   = fmt(Number(it.Amount    ?? 0)).padStart(12, " ");
      return `  ${no}  ${code}${name}${qty}${price}${amt}`;
    }).join("\n");

    const divider = "─".repeat(74);
    const header  = `  ${"No.".padStart(3)}  ${"품목코드".padEnd(14)}${"품목명".padEnd(20)}${"수량".padStart(8)}${"단가".padStart(10)}${"금액".padStart(12)}`;

    // ── 이메일 본문 ──────────────────────────────────────────────────────
    const body = `안녕하세요, ${String(po.SupplierName ?? "")} 담당자님.

구매발주서를 아래와 같이 발행하오니 검토 후 확인 부탁드립니다.

${"━".repeat(50)}
발 주 번 호 : ${String(po.PoNumber ?? "")}
발 주 일 자 : ${String(po.OrderDate ?? "")}
사 업 장   : ${String(po.BusinessPlace ?? "")}
발 주 자   : ${senderName}
${"━".repeat(50)}

■ 발주 품목

${header}
${divider}
${itemLines}
${divider}

  공  급  가  액 : ${fmt(supplyTotal).padStart(15)} 원
  부 가 세 (${String(po.VatRate ?? 10)}%) : ${fmt(vatTotal).padStart(15)} 원
  합        계 : ${fmt(grandTotal).padStart(15)} 원
${po.Notes ? `\n  ■ 비고\n  ${String(po.Notes)}` : ""}

${"━".repeat(50)}

감사합니다.
${senderName} 드림
${senderEmail}
`;

    // ── 구매발주서 PDF 생성 (인쇄 팝업과 동일한 HTML 템플릿) ────────────
    const html = buildPurchaseOrderHtml({
      poNumber:            String(po.PoNumber            ?? ""),
      orderDate:           String(po.OrderDate           ?? ""),
      businessPlace:       String(po.BusinessPlace       ?? ""),
      supplierCode:        String(po.SupplierCode        ?? ""),
      supplierName:        String(po.SupplierName        ?? ""),
      supplierRep:         String(po.SupplierRep         ?? ""),
      supplierAddress:     String(po.SupplierAddress     ?? ""),
      supplierPhone:       String(po.SupplierPhone       ?? ""),
      supplierFax:         String(po.SupplierFax         ?? ""),
      buyerName:           String(po.BuyerName           ?? ""),
      buyerCode:           String(po.BuyerCode           ?? ""),
      currencyCode:        String(po.CurrencyCode        ?? "KRW"),
      paymentType:         String(po.PaymentType         ?? ""),
      paymentTerms:        String(po.PaymentTerms        ?? ""),
      vatRate:             String(po.VatRate             ?? "10"),
      importType:          String(po.ImportType          ?? ""),
      supplierQuotationNo: String(po.SupplierQuotationNo ?? ""),
      notes:               String(po.Notes               ?? ""),
      recipient: {
        companyName:    process.env.COMPANY_NAME    ?? "진양오토모티브(주) 김해공장",
        representative: process.env.COMPANY_REP     ?? "김상용",
        address:        process.env.COMPANY_ADDRESS ?? "경상남도 김해시 진영읍 서부로179번길",
        tel:            process.env.COMPANY_TEL     ?? "055-345-2100",
        fax:            process.env.COMPANY_FAX     ?? "055-342-4110",
      },
      items: items.map((it) => ({
        itemCode:      String(it.ItemCode      ?? ""),
        itemName:      String(it.ItemName      ?? ""),
        material:      String(it.Material      ?? ""),
        specification: String(it.Specification ?? ""),
        dueDate:       String(it.DueDate       ?? ""),
        quantity:      Number(it.Quantity      ?? 0),
        unitPrice:     Number(it.UnitPrice     ?? 0),
        amount:        Number(it.Amount        ?? 0),
      })),
    });
    const pdfBuffer = await htmlToPdf(html);

    // ── 발송 ────────────────────────────────────────────────────────────
    await sendMail({
      smtpUser:   senderEmail,
      smtpPass,
      senderName,
      to:         recipientEmail,
      subject:    `[구매발주서] ${String(po.PoNumber ?? "")} - ${String(po.SupplierName ?? "")}`,
      text:       body,
      attachment: {
        filename: `구매발주서_${String(po.PoNumber ?? "")}.pdf`,
        content:  pdfBuffer,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[send-email]", error);
    const message = error instanceof Error ? error.message : "이메일 발송 실패";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
