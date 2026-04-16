import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import type { PurchasePriceRecord } from "@/types/purchase-price";

const codeLabel = (code: string | null, name: string | null): string | undefined => {
  if (!code) return undefined;
  return name ? `${code} - ${name}` : code;
};

function rowToRecord(r: {
  Id: number;
  ItemCode: string;
  ItemName: string;
  ItemSpec: string | null;
  SupplierName: string;
  SupplierCode: string | null;
  ApplyDate: Date | string;
  ExpireDate: Date | string | null;
  UnitPrice: number;
  DevUnitPrice: number | null;
  DiscountRate: number | null;
  Currency: string | null;
  Remarks: string | null;
  BusinessUnit: string | null;
  BusinessUnitName: string | null;
  Warehouse: string | null;
  WarehouseName: string | null;
  StorageLocation: string | null;
  StorageLocationName: string | null;
}): PurchasePriceRecord {
  const toDateStr = (v: Date | string | null) => {
    if (v == null) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  };
  return {
    id: String(r.Id),
    itemCode: r.ItemCode ?? "",
    itemName: r.ItemName ?? "",
    itemSpec: r.ItemSpec ?? "",
    supplierCode: r.SupplierCode ?? "",
    supplierName: r.SupplierName ?? "",
    applyDate: toDateStr(r.ApplyDate),
    unitPrice: Number(r.UnitPrice) ?? 0,
    expireDate: toDateStr(r.ExpireDate),
    currency: r.Currency ?? "KRW",
    currencyCode: r.Currency ?? "KRW",
    remarks: r.Remarks ?? undefined,
    businessUnit: codeLabel(r.BusinessUnit, r.BusinessUnitName),
    warehouse: codeLabel(r.Warehouse, r.WarehouseName),
    storageLocation: codeLabel(r.StorageLocation, r.StorageLocationName),
    devUnitPrice: r.DevUnitPrice != null ? Number(r.DevUnitPrice) : undefined,
    discountRate: r.DiscountRate != null ? Number(r.DiscountRate) : undefined,
  };
}

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        pp.Id, pp.ItemCode, pp.ItemName, pp.ItemSpec, pp.SupplierName,
        pp.ApplyDate, pp.ExpireDate, pp.UnitPrice, pp.DevUnitPrice, pp.DiscountRate,
        pp.Currency, pp.Remarks,
        ISNULL(
          (SELECT TOP 1 PurchaserNo FROM dbo.Purchaser WHERE PurchaserName = pp.SupplierName),
          ''
        ) AS SupplierCode,
        im.BusinessUnit, f.FactoryName    AS BusinessUnitName,
        im.Warehouse,    wh.Name          AS WarehouseName,
        im.StorageLocation,
        sl.Name                           AS StorageLocationName
      FROM dbo.PurchasePrice pp
      LEFT JOIN dbo.ItemMaster  im ON im.ItemNo       = pp.ItemCode
      LEFT JOIN dbo.Factory     f  ON f.FactoryCode   = im.BusinessUnit
      LEFT JOIN dbo.CommonCode  wh ON wh.Category     = 'warehouse'
                                  AND wh.Code         = im.Warehouse
      LEFT JOIN dbo.CommonCode  sl ON sl.Category     = CONCAT('storage-location-', im.Warehouse)
                                  AND sl.Code         = im.StorageLocation
      ORDER BY pp.UpdatedAt DESC, pp.Id DESC
    `);

    const items: PurchasePriceRecord[] = (result.recordset ?? []).map(
      (r: Record<string, unknown>) =>
        rowToRecord({
          Id: r.Id as number,
          ItemCode: r.ItemCode as string,
          ItemName: r.ItemName as string,
          ItemSpec: r.ItemSpec as string | null,
          SupplierName: r.SupplierName as string,
          SupplierCode: r.SupplierCode as string | null,
          ApplyDate: r.ApplyDate as Date | string,
          ExpireDate: r.ExpireDate as Date | string | null,
          UnitPrice: r.UnitPrice as number,
          DevUnitPrice: r.DevUnitPrice as number | null,
          DiscountRate: r.DiscountRate as number | null,
          Currency: r.Currency as string | null,
          Remarks: r.Remarks as string | null,
          BusinessUnit: r.BusinessUnit as string | null,
          BusinessUnitName: r.BusinessUnitName as string | null,
          Warehouse: r.Warehouse as string | null,
          WarehouseName: r.WarehouseName as string | null,
          StorageLocation: r.StorageLocation as string | null,
          StorageLocationName: r.StorageLocationName as string | null,
        })
    );

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[purchase-prices][GET]", error);
    return NextResponse.json(
      { ok: false, message: "구매단가 조회 중 오류가 발생했습니다.", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemCode, itemName, itemSpec, supplierName,
      applyDate, expireDate, unitPrice, devUnitPrice, discountRate,
      currency, currencyCode, remarks,
    } = body;

    if (!itemCode?.trim() || !supplierName?.trim() || !applyDate) {
      return NextResponse.json({ ok: false, message: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input("ItemCode",     sql.NVarChar(50),  itemCode.trim())
      .input("ItemName",     sql.NVarChar(200), itemName?.trim() ?? "")
      .input("ItemSpec",     sql.NVarChar(200), itemSpec?.trim() || null)
      .input("SupplierName", sql.NVarChar(200), supplierName.trim())
      .input("ApplyDate",    sql.Date,          applyDate)
      .input("ExpireDate",   sql.Date,          expireDate || null)
      .input("UnitPrice",    sql.Decimal(18,4), Number(unitPrice))
      .input("DevUnitPrice", sql.Decimal(18,4), devUnitPrice != null ? Number(devUnitPrice) : null)
      .input("DiscountRate", sql.Decimal(5,2),  discountRate != null ? Number(discountRate) : null)
      .input("Currency",     sql.NVarChar(10),  currencyCode ?? currency ?? "KRW")
      .input("Remarks",      sql.NVarChar(500), remarks?.trim() || null)
      .query(`
        INSERT INTO dbo.PurchasePrice
          (ItemCode, ItemName, ItemSpec, SupplierName, ApplyDate, ExpireDate,
           UnitPrice, DevUnitPrice, DiscountRate, Currency, Remarks)
        OUTPUT INSERTED.Id
        VALUES
          (@ItemCode, @ItemName, @ItemSpec, @SupplierName, @ApplyDate, @ExpireDate,
           @UnitPrice, @DevUnitPrice, @DiscountRate, @Currency, @Remarks)
      `);

    const newId = result.recordset[0]?.Id;
    return NextResponse.json({ ok: true, id: String(newId) });
  } catch (error) {
    console.error("[purchase-prices][POST]", error);
    return NextResponse.json({ ok: false, message: "등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
