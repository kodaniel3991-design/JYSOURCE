import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        im.ItemId, im.ItemNo, im.ItemName, im.Specification, im.Form, im.Type, im.Unit,
        im.SupplierItemNo, im.DrawingNo, im.SupplierCode,
        ISNULL(p.PurchaserName, im.SupplierName) AS SupplierName,
        im.ItemStatusCategory, im.SalesUnitCode, im.UnitConversion,
        im.ItemWeight, im.WorkingItemNo, im.ItemSelection, im.Owner,
        im.ItemUserCategoryCode, im.Material, im.VehicleModel,
        im.ItemUsageClassificationCode, im.BusinessUnit, im.PackQty,
        im.PurchaseUnitPrice, im.CurrencyCode, im.LastReceiptDate,
        im.Warehouse, im.StorageLocation, im.UpdatedBy, im.UpdatedAt,
        im.ValueCategoryCode, im.MaterialOrderPolicyCode,
        im.ProcurementLeadTime, im.StandardLotSize, im.MinLotSize, im.MaxLotSize,
        im.SafetyStock, im.ReorderPoint, im.AvgDefectRate, im.InventoryCountCycle,
        im.LastReceiptUnitPrice, im.SalesUnitPrice, im.StandardCost, im.InternalUnitPrice,
        im.DrawingSize, im.ManufacturerName, im.BuyerCode, im.SalesRepCode, im.RequirementRepCode,
        im.ProductId, im.UnitProductionQty, im.HsCode, im.HNoDiameter, im.LNoSpecificGravity,
        im.YieldRate, im.CustomerWarehouse, im.DeliveryContainer, im.ReceiptContainer,
        im.RegisteredAt, im.RevisionDate
      FROM dbo.ItemMaster im
      LEFT JOIN dbo.Purchaser p ON p.PurchaserNo = im.SupplierCode
      ORDER BY im.UpdatedAt DESC
    `);
    return NextResponse.json({ ok: true, items: result.recordset });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const it = body;

    if (!it.itemNo || !it.itemName) {
      return NextResponse.json({ ok: false, message: "품목번호와 품목명은 필수입니다." }, { status: 400 });
    }

    const pool = await getDbPool();

    const dup = await pool.request()
      .input("ItemNo", sql.NVarChar(50), it.itemNo)
      .query("SELECT 1 AS cnt FROM dbo.ItemMaster WHERE ItemNo = @ItemNo");
    if (dup.recordset.length > 0) {
      return NextResponse.json(
        { ok: false, message: `이미 존재하는 품목번호입니다. (${it.itemNo})` },
        { status: 409 }
      );
    }

    const req = pool.request();

    // Basic
    req.input("ItemNo", sql.NVarChar(50), it.itemNo);
    req.input("ItemName", sql.NVarChar(200), it.itemName);
    req.input("Specification", sql.NVarChar(200), it.specification || null);
    req.input("DrawingNo", sql.NVarChar(100), it.drawingNo || null);
    req.input("ItemStatusCategory", sql.NVarChar(20), it.itemStatusCategory ?? "ACTIVE");
    req.input("UpdatedBy", sql.NVarChar(100), it.updatedBy ?? "system");

    // Classification
    req.input("Form", sql.NVarChar(50), it.form || null);
    req.input("Type", sql.NVarChar(50), it.type || null);
    req.input("VehicleModel", sql.NVarChar(100), it.vehicleModel || null);
    req.input("ItemUserCategoryCode", sql.NVarChar(50), it.itemUserCategoryCode || null);
    req.input("ItemUsageClassificationCode", sql.NVarChar(50), it.itemUsageClassificationCode || null);
    req.input("Material", sql.NVarChar(100), it.material || null);
    req.input("ManufacturerName", sql.NVarChar(200), it.manufacturerName || null);
    req.input("ProductId", sql.NVarChar(100), it.productId || null);
    req.input("ValueCategoryCode", sql.NVarChar(50), it.valueCategoryCode || null);

    // Procurement
    req.input("SupplierCode", sql.NVarChar(50), it.supplierCode || null);
    req.input("SupplierName", sql.NVarChar(200), it.supplierName || null);
    req.input("SupplierItemNo", sql.NVarChar(100), it.supplierItemNo || null);
    req.input("BuyerCode", sql.NVarChar(50), it.buyerCode || null);
    req.input("SalesRepCode", sql.NVarChar(50), it.salesRepCode || null);
    req.input("RequirementRepCode", sql.NVarChar(50), it.requirementRepCode || null);
    req.input("PurchaseUnitPrice", sql.Decimal(18, 4), it.purchaseUnitPrice || null);
    req.input("SalesUnitPrice", sql.Decimal(18, 4), it.salesUnitPrice || null);
    req.input("CurrencyCode", sql.NVarChar(10), it.currencyCode || null);
    req.input("MaterialOrderPolicyCode", sql.NVarChar(50), it.materialOrderPolicyCode || null);
    req.input("LastReceiptUnitPrice", sql.Decimal(18, 4), it.lastReceiptUnitPrice || null);
    req.input("StandardCost", sql.Decimal(18, 4), it.standardCost || null);
    req.input("InternalUnitPrice", sql.Decimal(18, 4), it.internalUnitPrice || null);
    req.input("BusinessUnit", sql.NVarChar(50), it.businessUnit || null);

    // Inventory
    req.input("Warehouse", sql.NVarChar(50), it.warehouse || null);
    req.input("StorageLocation", sql.NVarChar(50), it.storageLocation || null);
    req.input("UnitProductionQty", sql.Decimal(18, 4), it.unitProductionQty || null);
    req.input("MinLotSize", sql.Int, it.minLotSize || null);
    req.input("StandardLotSize", sql.Int, it.standardLotSize || null);
    req.input("SafetyStock", sql.Int, it.safetyStock || null);
    req.input("AvgDefectRate", sql.Decimal(18, 4), it.avgDefectRate || null);
    req.input("ProcurementLeadTime", sql.Int, it.procurementLeadTime || null);
    req.input("ReorderPoint", sql.Int, it.reorderPoint || null);
    req.input("InventoryCountCycle", sql.Int, it.inventoryCountCycle || null);
    req.input("DeliveryContainer", sql.NVarChar(100), it.deliveryContainer || null);
    req.input("ReceiptContainer", sql.NVarChar(100), it.receiptContainer || null);

    // Technical
    req.input("Unit", sql.NVarChar(20), it.unit ?? "EA");
    req.input("SalesUnitCode", sql.NVarChar(20), it.salesUnitCode ?? "EA");
    req.input("UnitConversion", sql.NVarChar(50), it.unitConversion || null);
    req.input("ItemWeight", sql.Decimal(18, 3), it.itemWeight || null);
    req.input("DrawingSize", sql.NVarChar(50), it.drawingSize || null);
    req.input("PackQty", sql.Int, it.packQty || null);
    req.input("CustomerWarehouse", sql.NVarChar(100), it.customerWarehouse || null);
    req.input("HNoDiameter", sql.NVarChar(50), it.hNoDiameter || null);
    req.input("LNoSpecificGravity", sql.NVarChar(50), it.lNoSpecificGravity || null);
    req.input("HsCode", sql.NVarChar(50), it.hsCode || null);

    // Others
    req.input("WorkingItemNo", sql.NVarChar(50), it.workingItemNo || null);
    req.input("ItemSelection", sql.NVarChar(50), it.itemSelection || null);

    const result = await req.query(`
      INSERT INTO dbo.ItemMaster (
        ItemNo, ItemName, Specification, DrawingNo, ItemStatusCategory, UpdatedBy,
        Form, Type, VehicleModel, ItemUserCategoryCode, ItemUsageClassificationCode,
        Material, ManufacturerName, ProductId, ValueCategoryCode,
        SupplierCode, SupplierName, SupplierItemNo, BuyerCode, SalesRepCode, RequirementRepCode,
        PurchaseUnitPrice, SalesUnitPrice, CurrencyCode, MaterialOrderPolicyCode,
        LastReceiptUnitPrice, StandardCost, InternalUnitPrice, BusinessUnit,
        Warehouse, StorageLocation, UnitProductionQty, MinLotSize, StandardLotSize,
        SafetyStock, AvgDefectRate, ProcurementLeadTime, ReorderPoint, InventoryCountCycle,
        DeliveryContainer, ReceiptContainer,
        Unit, SalesUnitCode, UnitConversion, ItemWeight, DrawingSize, PackQty,
        CustomerWarehouse, HNoDiameter, LNoSpecificGravity, HsCode,
        WorkingItemNo, ItemSelection
      ) OUTPUT INSERTED.ItemId
      VALUES (
        @ItemNo, @ItemName, @Specification, @DrawingNo, @ItemStatusCategory, @UpdatedBy,
        @Form, @Type, @VehicleModel, @ItemUserCategoryCode, @ItemUsageClassificationCode,
        @Material, @ManufacturerName, @ProductId, @ValueCategoryCode,
        @SupplierCode, @SupplierName, @SupplierItemNo, @BuyerCode, @SalesRepCode, @RequirementRepCode,
        @PurchaseUnitPrice, @SalesUnitPrice, @CurrencyCode, @MaterialOrderPolicyCode,
        @LastReceiptUnitPrice, @StandardCost, @InternalUnitPrice, @BusinessUnit,
        @Warehouse, @StorageLocation, @UnitProductionQty, @MinLotSize, @StandardLotSize,
        @SafetyStock, @AvgDefectRate, @ProcurementLeadTime, @ReorderPoint, @InventoryCountCycle,
        @DeliveryContainer, @ReceiptContainer,
        @Unit, @SalesUnitCode, @UnitConversion, @ItemWeight, @DrawingSize, @PackQty,
        @CustomerWarehouse, @HNoDiameter, @LNoSpecificGravity, @HsCode,
        @WorkingItemNo, @ItemSelection
      )
    `);

    return NextResponse.json({ ok: true, id: result.recordset[0].ItemId });
  } catch (error: any) {
    console.error(error);
    if (error.number === 2601 || error.number === 2627) {
      return NextResponse.json(
        { ok: false, message: `이미 사용 중인 품목번호입니다. (${error.originalError?.info?.message ?? ""})` },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, message: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
