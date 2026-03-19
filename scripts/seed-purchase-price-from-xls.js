/**
 * 구매단가.xls 파일을 읽어 MS SQL PurchasePrice 테이블에 INSERT합니다.
 * 사용: node scripts/seed-purchase-price-from-xls.js [엑셀파일경로]
 * 환경변수: MSSQL_SERVER, MSSQL_USER, MSSQL_PASSWORD, MSSQL_DATABASE (기본 JYSource)
 */
const XLSX = require("xlsx");
const sql = require("mssql");
const path = require("path");

try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (_) {}

const defaultXlsPath = path.join(
  process.env.USERPROFILE || "",
  "OneDrive",
  "바탕 화면",
  "BSP",
  "1. 2026 BSP",
  "6. 진양 자재관리",
  "구매단가.xls"
);

const xlsPath = process.argv[2] || defaultXlsPath;

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER || "localhost",
  port: process.env.MSSQL_PORT ? parseInt(process.env.MSSQL_PORT, 10) : 1433,
  database: process.env.MSSQL_DATABASE || "JYSource",
  options: { encrypt: false, trustServerCertificate: true },
};

function toDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toDateStr(v) {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : null;
}

function toBit(v) {
  if (v == null || v === "") return 0;
  const s = String(v).toUpperCase().trim();
  return s === "Y" || s === "1" || s === "TRUE" ? 1 : 0;
}

function toNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function str(v, maxLen) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : (maxLen ? s.slice(0, maxLen) : s);
}

async function main() {
  console.log("Reading:", xlsPath);
  const wb = XLSX.readFile(xlsPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (rows.length < 2) {
    console.log("No data rows.");
    process.exit(0);
  }

  const dataRows = rows.slice(1);
  console.log("Rows to import:", dataRows.length);

  const pool = await sql.connect(config);

  // 기존 DB 테이블 구조(ItemCode, ItemName, ItemSpec, SupplierName, Plant, ApplyDate, ExpireDate, UnitPrice, DevUnitPrice, DiscountRate, Currency, Remarks)에 맞춤
  const ps = new sql.PreparedStatement(pool);
  ps.input("ItemCode", sql.NVarChar(50));
  ps.input("ItemName", sql.NVarChar(200));
  ps.input("ItemSpec", sql.NVarChar(200));
  ps.input("SupplierName", sql.NVarChar(200));
  ps.input("Plant", sql.NVarChar(100));
  ps.input("ApplyDate", sql.Date);
  ps.input("ExpireDate", sql.Date);
  ps.input("UnitPrice", sql.Decimal(18, 4));
  ps.input("DevUnitPrice", sql.Decimal(18, 4));
  ps.input("DiscountRate", sql.Decimal(5, 2));
  ps.input("Currency", sql.NVarChar(10));
  ps.input("Remarks", sql.NVarChar(500));

  await ps.prepare(`
    INSERT INTO dbo.PurchasePrice (
      ItemCode, ItemName, ItemSpec, SupplierName, Plant, ApplyDate, ExpireDate,
      UnitPrice, DevUnitPrice, DiscountRate, Currency, Remarks
    ) VALUES (
      @ItemCode, @ItemName, @ItemSpec, @SupplierName, @Plant, @ApplyDate, @ExpireDate,
      @UnitPrice, @DevUnitPrice, @DiscountRate, @Currency, @Remarks
    )
  `);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const itemCode = str(r[0], 50);
    const itemName = str(r[1], 200);
    const supplierName = str(r[4], 200);
    const unitPrice = toNum(r[5]);
    const applyDate = toDate(r[7]);
    const expireDate = toDate(r[8]);
    if (!itemCode || !itemName || !supplierName || unitPrice == null) {
      errors++;
      if (errors <= 3) console.warn("Skip row (missing key):", i + 2, r.slice(0, 6));
      continue;
    }
    if (!applyDate || !expireDate) {
      errors++;
      if (errors <= 3) console.warn("Skip row (missing date):", i + 2);
      continue;
    }

    try {
      await ps.execute({
        ItemCode: itemCode,
        ItemName: itemName,
        ItemSpec: str(r[2], 200),
        SupplierName: supplierName,
        Plant: str(r[10], 100) || null,
        ApplyDate: applyDate,
        ExpireDate: expireDate,
        UnitPrice: unitPrice,
        DevUnitPrice: null,
        DiscountRate: 0,
        Currency: str(r[9], 10) || "KRW",
        Remarks: str(r[13], 500),
      });
      inserted++;
      if (inserted % 500 === 0) console.log("Inserted", inserted, "...");
    } catch (err) {
      errors++;
      if (errors <= 5) console.error("Row", i + 2, err.message);
    }
  }

  await ps.unprepare();
  await pool.close();

  console.log("Done. Inserted:", inserted, "Errors:", errors);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
