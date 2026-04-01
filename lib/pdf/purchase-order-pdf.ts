import PDFDocument from "pdfkit";
import fs from "fs";

export interface PoItemForPdf {
  ItemCode: unknown;
  ItemName: unknown;
  Quantity: unknown;
  UnitPrice: unknown;
  Amount: unknown;
}

export interface PurchaseOrderPdfOptions {
  poNumber: string;
  orderDate: string;
  businessPlace: string;
  supplierName: string;
  senderName: string;
  senderEmail: string;
  vatRate: number;
  notes?: string;
  items: PoItemForPdf[];
}

const FONT_REGULAR = "C:\\Windows\\Fonts\\malgun.ttf";
const FONT_BOLD    = "C:\\Windows\\Fonts\\malgunbd.ttf";

export function generatePurchaseOrderPdf(opts: PurchaseOrderPdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: `구매발주서 ${opts.poNumber}`, Author: opts.senderName },
    });

    const hasBold = fs.existsSync(FONT_BOLD);
    if (fs.existsSync(FONT_REGULAR)) {
      doc.registerFont("KR",     FONT_REGULAR);
      if (hasBold) doc.registerFont("KR-Bold", FONT_BOLD);
      doc.font("KR");
    }

    const chunks: Buffer[] = [];
    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W    = doc.page.width  - 100; // usable width
    const L    = 50;                    // left margin
    const fmt  = (n: number) => n.toLocaleString("ko-KR");
    const bold = (size: number) => { doc.font(hasBold ? "KR-Bold" : "KR").fontSize(size); return doc; };
    const reg  = (size: number) => { doc.font("KR").fontSize(size); return doc; };

    // ── 제목 ──────────────────────────────────────────────────────────────
    const titleH = 36;
    doc.rect(L, 50, W, titleH).fillColor("#1e293b").fill();
    bold(16).fillColor("#ffffff").text("구  매  발  주  서", L, 60, { align: "center", width: W });

    // ── 기본정보 ──────────────────────────────────────────────────────────
    let y = 50 + titleH + 12;

    const infoRows: [string, string, string, string][] = [
      ["발 주 번 호", opts.poNumber,       "거 래 처", opts.supplierName],
      ["발 주 일 자", opts.orderDate,       "발 주 자", opts.senderName],
      ["사 업 장",   opts.businessPlace || "-", "",    ""],
    ];

    infoRows.forEach((row) => {
      const [l1, v1, l2, v2] = row;
      reg(8).fillColor("#64748b").text(l1, L + 6,         y, { width: 58 });
      reg(8).fillColor("#0f172a").text(v1, L + 68,        y, { width: W / 2 - 74, lineBreak: false });
      if (l2) {
        reg(8).fillColor("#64748b").text(l2, L + W / 2 + 6,  y, { width: 58 });
        reg(8).fillColor("#0f172a").text(v2, L + W / 2 + 68, y, { width: W / 2 - 74, lineBreak: false });
      }
      y += 16;
    });

    y += 6;
    doc.moveTo(L, y).lineTo(L + W, y).strokeColor("#334155").lineWidth(1).stroke();
    y += 12;

    // ── 품목 테이블 ───────────────────────────────────────────────────────
    bold(9).fillColor("#1e293b").text("■ 발주 품목", L, y);
    y += 16;

    // 컬럼 정의: [header, width, align]
    const cols: [string, number, "left" | "center" | "right"][] = [
      ["No.",    28,  "center"],
      ["품목코드", 88,  "left"],
      ["품목명",  152, "left"],
      ["수량",    52,  "right"],
      ["단가",    80,  "right"],
      ["금액",    80,  "right"],
    ];

    // 헤더 행
    const rowH  = 18;
    doc.rect(L, y, W, rowH).fillColor("#334155").fill();
    let cx = L;
    cols.forEach(([h, w, align]) => {
      bold(8).fillColor("#ffffff").text(h, cx + 4, y + 4, { width: w - 8, align, lineBreak: false });
      cx += w;
    });
    y += rowH;

    // 데이터 행
    opts.items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
      doc.rect(L, y, W, rowH).fillColor(bg).fill();
      doc.rect(L, y, W, rowH).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

      const cells = [
        String(idx + 1),
        String(item.ItemCode ?? ""),
        String(item.ItemName ?? ""),
        fmt(Number(item.Quantity  ?? 0)),
        fmt(Number(item.UnitPrice ?? 0)),
        fmt(Number(item.Amount    ?? 0)),
      ];

      cx = L;
      cols.forEach(([, w, align], i) => {
        reg(8).fillColor("#1e293b").text(cells[i], cx + 4, y + 4, { width: w - 8, align, lineBreak: false });
        cx += w;
      });

      // 세로 구분선
      cx = L;
      cols.forEach(([, w], i) => {
        cx += w;
        if (i < cols.length - 1) {
          doc.moveTo(cx, y).lineTo(cx, y + rowH).strokeColor("#cbd5e1").lineWidth(0.3).stroke();
        }
      });

      y += rowH;
    });

    // 테이블 외곽선
    doc.rect(L, y - rowH * opts.items.length - rowH, W, rowH * (opts.items.length + 1))
      .strokeColor("#334155").lineWidth(1).stroke();

    y += 10;

    // ── 금액 합계 ─────────────────────────────────────────────────────────
    const supplyTotal = opts.items.reduce((s, i) => s + Number(i.Amount ?? 0), 0);
    const vatTotal    = Math.round(supplyTotal * opts.vatRate / 100);
    const grandTotal  = supplyTotal + vatTotal;

    const sumW = 200;
    const sumX = L + W - sumW;

    const sumRows: [string, string, boolean][] = [
      [`공  급  가  액`,                   `${fmt(supplyTotal)} 원`, false],
      [`부 가 세 (${opts.vatRate}%)`,      `${fmt(vatTotal)} 원`,   false],
      [`합        계`,                      `${fmt(grandTotal)} 원`, true],
    ];

    sumRows.forEach(([label, value, isTotal]) => {
      const bg = isTotal ? "#1e293b" : "#f1f5f9";
      const fg = isTotal ? "#ffffff" : "#0f172a";
      doc.rect(sumX, y, sumW, rowH).fillColor(bg).fill();
      doc.rect(sumX, y, sumW, rowH).strokeColor("#334155").lineWidth(0.5).stroke();
      (isTotal ? bold(9) : reg(9)).fillColor(fg).text(label, sumX + 8, y + 4, { width: 108, lineBreak: false });
      (isTotal ? bold(9) : reg(9)).fillColor(fg).text(value, sumX + 116, y + 4, { width: 76, align: "right", lineBreak: false });
      y += rowH;
    });

    if (opts.notes) {
      y += 8;
      reg(9).fillColor("#334155").text(`■ 비고: ${opts.notes}`, L, y);
      y += 14;
    }

    // ── 하단 ──────────────────────────────────────────────────────────────
    y += 20;
    doc.moveTo(L, y).lineTo(L + W, y).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
    y += 8;
    reg(8).fillColor("#94a3b8").text(
      `${opts.senderName}  ·  ${opts.senderEmail}`,
      L, y, { align: "center", width: W },
    );

    doc.end();
  });
}
