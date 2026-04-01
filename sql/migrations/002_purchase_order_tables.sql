-- 구매오더 테이블 생성
-- 이미 존재하면 건너뜀

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PurchaseOrder') AND type = 'U')
BEGIN
  CREATE TABLE dbo.PurchaseOrder (
    Id                    INT            IDENTITY(1,1) PRIMARY KEY,
    PoNumber              NVARCHAR(20)   NOT NULL,
    OrderStatus           NVARCHAR(20)   NOT NULL DEFAULT 'draft',
    SupplierCode          NVARCHAR(50)   NULL,
    SupplierName          NVARCHAR(200)  NULL,
    CurrencyCode          NVARCHAR(10)   NULL,
    PaymentType           NVARCHAR(50)   NULL,
    PaymentTerms          NVARCHAR(50)   NULL,
    BuyerCode             NVARCHAR(50)   NULL,
    BuyerName             NVARCHAR(100)  NULL,
    SupplierQuotationNo   NVARCHAR(100)  NULL,
    SupplierContactPerson NVARCHAR(100)  NULL,
    AdvancePayment        NVARCHAR(50)   NULL,
    OrderDate             DATE           NULL,
    VatRate               NVARCHAR(10)   NULL,
    ImportType            NVARCHAR(20)   NULL,
    BusinessPlace         NVARCHAR(20)   NULL,
    PackagingStatus       NVARCHAR(100)  NULL,
    InspectionCondition   NVARCHAR(200)  NULL,
    DeliveryCondition     NVARCHAR(200)  NULL,
    OtherCondition        NVARCHAR(200)  NULL,
    Notes                 NVARCHAR(2000) NULL,
    TotalAmount           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    AssignedTo            NVARCHAR(100)  NULL,
    DueDate               DATE           NULL,
    CreatedAt             DATETIME2      NOT NULL DEFAULT GETDATE(),
    UpdatedAt             DATETIME2      NOT NULL DEFAULT GETDATE()
  );
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PurchaseOrderItem') AND type = 'U')
BEGIN
  CREATE TABLE dbo.PurchaseOrderItem (
    Id                INT            IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderId   INT            NOT NULL,
    SpecNo            INT            NOT NULL DEFAULT 1,
    ItemCode          NVARCHAR(50)   NOT NULL,
    ItemName          NVARCHAR(200)  NULL,
    Material          NVARCHAR(100)  NULL,
    Specification     NVARCHAR(200)  NULL,
    Warehouse         NVARCHAR(20)   NULL,
    Quantity          DECIMAL(18,3)  NOT NULL DEFAULT 0,
    ReceivedQty       DECIMAL(18,3)  NOT NULL DEFAULT 0,
    UnitPrice         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Amount            DECIMAL(18,2)  NOT NULL DEFAULT 0,
    IsProvisionalPrice BIT           NOT NULL DEFAULT 0,
    DueDate           DATE           NULL,
    CONSTRAINT FK_POItem_PurchaseOrder
      FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id) ON DELETE CASCADE
  );
END
