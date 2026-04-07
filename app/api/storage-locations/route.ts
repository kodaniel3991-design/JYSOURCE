import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseCode = searchParams.get("warehouseCode") ?? "";

    const pool = await getDbPool();
    const req = pool.request();

    if (warehouseCode) {
      req.input("Category", sql.NVarChar(50), `storage-location-${warehouseCode}`);
      const result = await req.query(`
        SELECT
          @Category AS WarehouseCode,
          Code      AS StorageLocationCode,
          Name      AS StorageLocationName
        FROM dbo.CommonCode
        WHERE Category = @Category
        ORDER BY SortOrder, Code
      `);
      // WarehouseCode 컬럼값을 실제 창고코드로 교체
      const items = result.recordset.map((r: Record<string, string>) => ({
        WarehouseCode: warehouseCode,
        StorageLocationCode: r.StorageLocationCode,
        StorageLocationName: r.StorageLocationName,
      }));
      return NextResponse.json({ ok: true, items });
    } else {
      const result = await req.query(`
        SELECT Category, Code AS StorageLocationCode, Name AS StorageLocationName
        FROM dbo.CommonCode
        WHERE Category LIKE 'storage-location-%'
        ORDER BY Category, SortOrder, Code
      `);
      const items = result.recordset.map((r: Record<string, string>) => ({
        WarehouseCode: r.Category.replace("storage-location-", ""),
        StorageLocationCode: r.StorageLocationCode,
        StorageLocationName: r.StorageLocationName,
      }));
      return NextResponse.json({ ok: true, items });
    }
  } catch (error) {
    console.error("[storage-locations][GET]", error);
    return NextResponse.json({ ok: false, message: "저장위치 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
