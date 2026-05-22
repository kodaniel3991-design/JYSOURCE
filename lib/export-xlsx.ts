export type XlsxCellValue = string | number | null | undefined;

export type XlsxRow = {
  cells: XlsxCellValue[];
  rowType?: "header" | "data" | "subtotal" | "total";
};

const HEADER_COLOR   = "9DC3E6";
const SUBTOTAL_COLOR = "FCE4D6";
const TOTAL_COLOR    = "F2C7CE";

export async function downloadXlsx(
  promptFilename: (name: string) => Promise<string | null>,
  defaultName: string,
  xlsxRows: XlsxRow[],
  sheetName = "Sheet1"
): Promise<void> {
  if (xlsxRows.length === 0) return;

  const XLSX = await import("xlsx-js-style");
  const aoa = xlsxRows.map((r) => r.cells.map((v) => v ?? ""));
  const ws = XLSX.utils.aoa_to_sheet(aoa as any);

  const colCount = Math.max(...xlsxRows.map((r) => r.cells.length));

  xlsxRows.forEach((row, ri) => {
    row.cells.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      const cell = ws[addr];
      if (!cell) return;

      const s: any = { alignment: { vertical: "center", wrapText: false } };

      if (row.rowType === "header") {
        s.fill = { patternType: "solid", fgColor: { rgb: HEADER_COLOR } };
        s.font = { bold: true };
        s.alignment = { horizontal: "center", vertical: "center", wrapText: false };
      } else if (row.rowType === "subtotal") {
        s.fill = { patternType: "solid", fgColor: { rgb: SUBTOTAL_COLOR } };
        s.font = { bold: true };
      } else if (row.rowType === "total") {
        s.fill = { patternType: "solid", fgColor: { rgb: TOTAL_COLOR } };
        s.font = { bold: true };
      }

      if (typeof val === "number") s.numFmt = "#,##0";
      cell.s = s;
    });
  });

  ws["!cols"] = Array.from({ length: colCount }, (_, ci) => {
    const maxLen = xlsxRows.reduce((m, row) => {
      const v = row.cells[ci];
      return Math.max(m, v == null ? 0 : String(v).length);
    }, 0);
    return { wch: Math.min(Math.max(maxLen + 2, 8), 35) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const base = defaultName.replace(/\.csv$/i, ".xlsx");
  const _saveName = await promptFilename(base);
  if (!_saveName) return;
  const finalName = /\.xlsx$/i.test(_saveName) ? _saveName : _saveName + ".xlsx";
  (XLSX as any).writeFile(wb, finalName);
}
