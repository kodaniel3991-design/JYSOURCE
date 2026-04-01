-- PurchaseOrder 테이블에 누락된 컬럼 추가
-- 이미 존재하는 컬럼은 건너뜀

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'SupplierContactPerson')
  ALTER TABLE dbo.PurchaseOrder ADD SupplierContactPerson NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'AdvancePayment')
  ALTER TABLE dbo.PurchaseOrder ADD AdvancePayment NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'ImportType')
  ALTER TABLE dbo.PurchaseOrder ADD ImportType NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'BusinessPlace')
  ALTER TABLE dbo.PurchaseOrder ADD BusinessPlace NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'PackagingStatus')
  ALTER TABLE dbo.PurchaseOrder ADD PackagingStatus NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'InspectionCondition')
  ALTER TABLE dbo.PurchaseOrder ADD InspectionCondition NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'DeliveryCondition')
  ALTER TABLE dbo.PurchaseOrder ADD DeliveryCondition NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'OtherCondition')
  ALTER TABLE dbo.PurchaseOrder ADD OtherCondition NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'SupplierQuotationNo')
  ALTER TABLE dbo.PurchaseOrder ADD SupplierQuotationNo NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'VatRate')
  ALTER TABLE dbo.PurchaseOrder ADD VatRate NVARCHAR(10) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'Notes')
  ALTER TABLE dbo.PurchaseOrder ADD Notes NVARCHAR(2000) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrder') AND name = 'UpdatedAt')
  ALTER TABLE dbo.PurchaseOrder ADD UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE();

-- PurchaseOrderItem 테이블에 누락된 컬럼 추가

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'SpecNo')
  ALTER TABLE dbo.PurchaseOrderItem ADD SpecNo INT NOT NULL DEFAULT 1;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'Material')
  ALTER TABLE dbo.PurchaseOrderItem ADD Material NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'Specification')
  ALTER TABLE dbo.PurchaseOrderItem ADD Specification NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'Warehouse')
  ALTER TABLE dbo.PurchaseOrderItem ADD Warehouse NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'ReceivedQty')
  ALTER TABLE dbo.PurchaseOrderItem ADD ReceivedQty DECIMAL(18,3) NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'IsProvisionalPrice')
  ALTER TABLE dbo.PurchaseOrderItem ADD IsProvisionalPrice BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PurchaseOrderItem') AND name = 'DueDate')
  ALTER TABLE dbo.PurchaseOrderItem ADD DueDate DATE NULL;
