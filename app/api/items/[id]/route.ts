import { NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const it = body;

    const pool = await getDbPool();
    const req = pool.request();
    req.input("ItemId", sql.Int, id);

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

    await req.query(`
      UPDATE dbo.ItemMaster SET
        ItemNo = @ItemNo, ItemName = @ItemName, Specification = @Specification,
        DrawingNo = @DrawingNo, ItemStatusCategory = @ItemStatusCategory, UpdatedBy = @UpdatedBy,
        Form = @Form, Type = @Type, VehicleModel = @VehicleModel,
        ItemUserCategoryCode = @ItemUserCategoryCode,
        ItemUsageClassificationCode = @ItemUsageClassificationCode,
        Material = @Material, ManufacturerName = @ManufacturerName,
        ProductId = @ProductId, ValueCategoryCode = @ValueCategoryCode,
        SupplierCode = @SupplierCode, SupplierName = @SupplierName,
        SupplierItemNo = @SupplierItemNo, BuyerCode = @BuyerCode,
        SalesRepCode = @SalesRepCode, RequirementRepCode = @RequirementRepCode,
        PurchaseUnitPrice = @PurchaseUnitPrice, SalesUnitPrice = @SalesUnitPrice,
        CurrencyCode = @CurrencyCode, MaterialOrderPolicyCode = @MaterialOrderPolicyCode,
        LastReceiptUnitPrice = @LastReceiptUnitPrice, StandardCost = @StandardCost,
        InternalUnitPrice = @InternalUnitPrice, BusinessUnit = @BusinessUnit,
        Warehouse = @Warehouse, StorageLocation = @StorageLocation,
        UnitProductionQty = @UnitProductionQty, MinLotSize = @MinLotSize,
        StandardLotSize = @StandardLotSize, SafetyStock = @SafetyStock,
        AvgDefectRate = @AvgDefectRate, ProcurementLeadTime = @ProcurementLeadTime,
        ReorderPoint = @ReorderPoint, InventoryCountCycle = @InventoryCountCycle,
        DeliveryContainer = @DeliveryContainer, ReceiptContainer = @ReceiptContainer,
        Unit = @Unit, SalesUnitCode = @SalesUnitCode, UnitConversion = @UnitConversion,
        ItemWeight = @ItemWeight, DrawingSize = @DrawingSize, PackQty = @PackQty,
        CustomerWarehouse = @CustomerWarehouse, HNoDiameter = @HNoDiameter,
        LNoSpecificGravity = @LNoSpecificGravity, HsCode = @HsCode,
        WorkingItemNo = @WorkingItemNo, ItemSelection = @ItemSelection,
        UpdatedAt = sysutcdatetime()
      WHERE ItemId = @ItemId
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const pool = await getDbPool();
    const req = pool.request();
    req.input("ItemId", sql.Int, id);
    await req.query(`DELETE FROM dbo.ItemMaster WHERE ItemId = @ItemId`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
