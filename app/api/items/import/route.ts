import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

type IncomingItem = {
  itemNo: string;
  itemName: string;
  specification?: string;
  form?: string;
  type?: string;
  unit?: string;
  supplierItemNo?: string;
  drawingNo?: string;
  supplierCode?: string;
  supplierName?: string;
  itemStatusCategory?: string;
  salesUnitCode?: string;
  unitConversion?: string;
  itemWeight?: number;
  workingItemNo?: string;
  itemSelection?: string;
  owner?: string;
  itemUserCategoryCode?: string;
  material?: string;
  vehicleModel?: string;
  itemUsageClassificationCode?: string;
  businessUnit?: string;
  packQty?: number;
  registeredAt?: string;
  revisionDate?: string;
  purchaseUnitPrice?: number;
  currencyCode?: string;
  lastReceiptDate?: string;
  warehouse?: string;
  storageLocation?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: IncomingItem[] };
    const items = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "등록할 품목이 없습니다." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    let insertedCount = 0;

    for (const it of items) {
      if (!it.itemNo || !it.itemName) continue;

      const req = pool.request();
      req.input("ItemNo", sql.NVarChar(50), it.itemNo);
      req.input("ItemName", sql.NVarChar(200), it.itemName);
      req.input("Specification", sql.NVarChar(200), it.specification ?? null);
      req.input("Form", sql.NVarChar(50), it.form ?? null);
      req.input("Type", sql.NVarChar(50), it.type ?? null);
      req.input("Unit", sql.NVarChar(20), it.unit ?? "EA");
      req.input("SupplierItemNo", sql.NVarChar(100), it.supplierItemNo ?? null);
      req.input("DrawingNo", sql.NVarChar(100), it.drawingNo ?? null);
      req.input("SupplierCode", sql.NVarChar(50), it.supplierCode ?? null);
      req.input("SupplierName", sql.NVarChar(200), it.supplierName ?? null);
      req.input("ItemStatusCategory", sql.NVarChar(20), it.itemStatusCategory ?? "ACTIVE");
      req.input("SalesUnitCode", sql.NVarChar(20), it.salesUnitCode ?? "EA");
      req.input("UnitConversion", sql.NVarChar(50), it.unitConversion ?? null);
      req.input("ItemWeight", sql.Decimal(18, 3), it.itemWeight ?? null);
      req.input("WorkingItemNo", sql.NVarChar(50), it.workingItemNo ?? null);
      req.input("ItemSelection", sql.NVarChar(50), it.itemSelection ?? null);
      req.input("Owner", sql.NVarChar(50), it.owner ?? null);
      req.input("ItemUserCategoryCode", sql.NVarChar(50), it.itemUserCategoryCode ?? null);
      req.input("Material", sql.NVarChar(100), it.material ?? null);
      req.input("VehicleModel", sql.NVarChar(100), it.vehicleModel ?? null);
      req.input("ItemUsageClassificationCode", sql.NVarChar(50), it.itemUsageClassificationCode ?? null);
      req.input("BusinessUnit", sql.NVarChar(50), it.businessUnit ?? null);
      req.input("PackQty", sql.Int, it.packQty ?? null);
      const toDate = (v?: string) => {
        if (!v || !v.trim()) return null;
        const s = v.trim();
        // Excel numeric serial (e.g. "45678") → convert to JS Date
        if (/^\d{1,6}$/.test(s)) {
          const d = new Date((parseInt(s, 10) - 25569) * 86400 * 1000);
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      };
      req.input("RegisteredAt", sql.DateTime2, toDate(it.registeredAt));
      req.input("RevisionDate", sql.DateTime2, toDate(it.revisionDate));
      req.input("PurchaseUnitPrice", sql.Decimal(18, 4), it.purchaseUnitPrice ?? null);
      req.input("CurrencyCode", sql.NVarChar(10), it.currencyCode ?? null);
      req.input("LastReceiptDate", sql.DateTime2, toDate(it.lastReceiptDate));
      req.input("Warehouse", sql.NVarChar(50), it.warehouse ?? null);
      req.input("StorageLocation", sql.NVarChar(50), it.storageLocation ?? null);

      await req.query(`
IF NOT EXISTS (SELECT 1 FROM dbo.ItemMaster WHERE ItemNo = @ItemNo)
INSERT INTO dbo.ItemMaster (
  ItemNo, ItemName, Specification, Form, Type, Unit,
  SupplierItemNo, DrawingNo, SupplierCode, SupplierName,
  ItemStatusCategory, SalesUnitCode, UnitConversion,
  ItemWeight, WorkingItemNo, ItemSelection, Owner,
  ItemUserCategoryCode, Material, VehicleModel,
  ItemUsageClassificationCode, BusinessUnit, PackQty,
  RegisteredAt, RevisionDate, PurchaseUnitPrice,
  CurrencyCode, LastReceiptDate, Warehouse, StorageLocation,
  UpdatedBy
)
VALUES (
  @ItemNo, @ItemName, @Specification, @Form, @Type, @Unit,
  @SupplierItemNo, @DrawingNo, @SupplierCode, @SupplierName,
  @ItemStatusCategory, @SalesUnitCode, @UnitConversion,
  @ItemWeight, @WorkingItemNo, @ItemSelection, @Owner,
  @ItemUserCategoryCode, @Material, @VehicleModel,
  @ItemUsageClassificationCode, @BusinessUnit, @PackQty,
  @RegisteredAt, @RevisionDate, @PurchaseUnitPrice,
  @CurrencyCode, @LastReceiptDate, @Warehouse, @StorageLocation,
  N'EXCEL 업로드'
);
`);
      insertedCount++;
    }

    return NextResponse.json({ ok: true, count: insertedCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[items/import]", msg);
    return NextResponse.json(
      { ok: false, message: `DB 저장 중 오류가 발생했습니다: ${msg}` },
      { status: 500 }
    );
  }
}
