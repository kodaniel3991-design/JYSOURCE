-- 기존 PurchasePrice 테이블이 있을 때, 구매단가.xls 시트 컬럼을 반영하기 위한 ALTER
-- (이미 컬럼이 있으면 에러가 날 수 있으므로, 필요 시 해당 문만 제거 후 실행)

USE JYSource;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchasePrice')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'SupplierCode')
        ALTER TABLE dbo.PurchasePrice ADD SupplierCode NVARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ItemMaterialName')
        ALTER TABLE dbo.PurchasePrice ADD ItemMaterialName NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'IsTempPrice')
        ALTER TABLE dbo.PurchasePrice ADD IsTempPrice BIT NOT NULL DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ValidDate')
        ALTER TABLE dbo.PurchasePrice ADD ValidDate DATE NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'CurrencyCode')
        ALTER TABLE dbo.PurchasePrice ADD CurrencyCode NVARCHAR(10) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'WarehouseCode')
        ALTER TABLE dbo.PurchasePrice ADD WarehouseCode NVARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'StorageLocationCode')
        ALTER TABLE dbo.PurchasePrice ADD StorageLocationCode NVARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ItemType')
        ALTER TABLE dbo.PurchasePrice ADD ItemType NVARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingMethod')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingMethod NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'MaterialSupplyType')
        ALTER TABLE dbo.PurchasePrice ADD MaterialSupplyType NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingReceiptItemCode')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingReceiptItemCode NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingReceiptItemName')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingReceiptItemName NVARCHAR(200) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingOrderIssue')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingOrderIssue BIT NOT NULL DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'PriceNotUsed')
        ALTER TABLE dbo.PurchasePrice ADD PriceNotUsed BIT NOT NULL DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'Unit')
        ALTER TABLE dbo.PurchasePrice ADD Unit NVARCHAR(20) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'WorkOrderNo')
        ALTER TABLE dbo.PurchasePrice ADD WorkOrderNo NVARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingStartProcess')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingStartProcess NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ProcessTypeBefore')
        ALTER TABLE dbo.PurchasePrice ADD ProcessTypeBefore NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ProcessNameBefore')
        ALTER TABLE dbo.PurchasePrice ADD ProcessNameBefore NVARCHAR(200) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'OutsourcingEndProcess')
        ALTER TABLE dbo.PurchasePrice ADD OutsourcingEndProcess NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ProcessTypeAfter')
        ALTER TABLE dbo.PurchasePrice ADD ProcessTypeAfter NVARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'ProcessNameAfter')
        ALTER TABLE dbo.PurchasePrice ADD ProcessNameAfter NVARCHAR(200) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchasePrice') AND name = 'UnitPricePerKg')
        ALTER TABLE dbo.PurchasePrice ADD UnitPricePerKg DECIMAL(18,4) NULL;

    PRINT 'PurchasePrice ALTER OK';
END
ELSE
    PRINT 'PurchasePrice table not found. Run create-tables.sql first.';
