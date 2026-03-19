const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'TestSa@123',
  server: '127.0.0.1',
  port: 1434,
  database: 'JYSource',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const modelCodes = [
  { code: 'AR1',         name: 'AR1' },
  { code: 'AR2',         name: 'AR2' },
  { code: 'B98',         name: 'B98' },
  { code: 'EX(SM5,SM7)', name: 'EX(SM5,SM7)' },
  { code: 'H45',         name: 'H45' },
  { code: 'HJB',         name: 'HJB' },
  { code: 'HZG',         name: 'HZG' },
  { code: 'KPQ(SM5)',    name: 'KPQ(SM5)' },
  { code: 'L38',         name: 'L38' },
  { code: 'L43',         name: 'L43' },
  { code: 'L43 RHD',     name: 'L43 RHD' },
  { code: 'L47',         name: 'L47' },
  { code: 'LFD',         name: 'LFD' },
  { code: 'LJL',         name: 'LJL' },
  { code: 'LM 공통',      name: 'LM(38/43)' },
  { code: 'N61G',        name: 'N61G' },
  { code: 'P32R',        name: 'P32R' },
  { code: 'P417',        name: 'P417' },
  { code: 'QM3',         name: 'QM3' },
  { code: 'SM3',         name: 'SM3' },
  { code: 'SX2',         name: 'SX2' },
  { code: 'TK1',         name: 'TK1' },
  { code: 'X81C',        name: 'X81C' },
];

async function main() {
  const pool = await sql.connect(config);
  console.log('Connected. Inserting model codes...\n');

  let inserted = 0;
  let skipped = 0;

  for (const { code, name } of modelCodes) {
    const result = await pool.request()
      .input('ModelCode', sql.NVarChar(50), code)
      .input('ModelName', sql.NVarChar(200), name)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.ModelCode WHERE ModelCode = @ModelCode)
        BEGIN
          INSERT INTO dbo.ModelCode (ModelCode, ModelName) VALUES (@ModelCode, @ModelName)
          SELECT 1 AS inserted
        END
        ELSE
          SELECT 0 AS inserted
      `);

    const ok = result.recordset[0]?.inserted;
    if (ok) {
      console.log(`  ✓ 등록: ${code}`);
      inserted++;
    } else {
      console.log(`  - 건너뜀(중복): ${code}`);
      skipped++;
    }
  }

  console.log(`\n완료: 신규 ${inserted}건 등록, ${skipped}건 건너뜀`);
  await pool.close();
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
