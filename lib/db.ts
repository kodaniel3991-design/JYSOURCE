import * as sql from "mssql";

declare global {
  // eslint-disable-next-line no-var
  var _mssqlPool: sql.ConnectionPool | undefined;
}

function getConfig(): sql.config {
  return {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER ?? "localhost",
    port: process.env.MSSQL_PORT ? Number(process.env.MSSQL_PORT) : 1433,
    database: process.env.MSSQL_DATABASE ?? "JYSource",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getDbPool() {
  const pool = global._mssqlPool;

  // 풀이 없거나 연결이 끊어진 경우 새로 생성
  if (!pool || !pool.connected) {
    if (pool) {
      try { await pool.close(); } catch { /* ignore */ }
    }
    global._mssqlPool = await new sql.ConnectionPool(getConfig()).connect();
  }

  return global._mssqlPool!;
}

export { sql };
