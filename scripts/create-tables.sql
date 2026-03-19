USE JYSource;

-- 1. ItemMaster
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ItemMaster')
CREATE TABLE dbo.ItemMaster (
    Id                          INT             IDENTITY(1,1) PRIMARY KEY,
    ItemNo                      NVARCHAR(50)    NOT NULL,
    ItemName                    NVARCHAR(200)   NOT NULL,
    Specification               NVARCHAR(200)   NULL,
    Form                        NVARCHAR(50)    NULL,
    Type                        NVARCHAR(50)    NULL,
    Unit                        NVARCHAR(20)    NOT NULL DEFAULT 'EA',
    SupplierItemNo              NVARCHAR(100)   NULL,
    DrawingNo                   NVARCHAR(100)   NULL,
    SupplierCode                NVARCHAR(50)    NULL,
    SupplierName                NVARCHAR(200)   NULL,
    ItemStatusCategory          NVARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    SalesUnitCode               NVARCHAR(20)    NULL,
    UnitConversion              NVARCHAR(50)    NULL,
    ItemWeight                  DECIMAL(18,3)   NULL,
    WorkingItemNo               NVARCHAR(50)    NULL,
    ItemSelection               NVARCHAR(50)    NULL,
    Owner                       NVARCHAR(50)    NULL,
    ItemUserCategoryCode        NVARCHAR(50)    NULL,
    Material                    NVARCHAR(100)   NULL,
    VehicleModel                NVARCHAR(100)   NULL,
    ItemUsageClassificationCode NVARCHAR(50)    NULL,
    BusinessUnit                NVARCHAR(50)    NULL,
    PackQty                     INT             NULL,
    RegisteredAt                DATE            NULL,
    RevisionDate                DATE            NULL,
    PurchaseUnitPrice           DECIMAL(18,4)   NULL,
    CurrencyCode                NVARCHAR(10)    NULL,
    LastReceiptDate             DATE            NULL,
    Warehouse                   NVARCHAR(50)    NULL,
    StorageLocation             NVARCHAR(50)    NULL,
    UpdatedBy                   NVARCHAR(100)   NULL,
    CreatedAt                   DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'ItemMaster OK';

-- 2. Purchaser
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Purchaser')
CREATE TABLE dbo.Purchaser (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    PurchaserNo         NVARCHAR(50)    NOT NULL UNIQUE,
    PurchaserName       NVARCHAR(200)   NOT NULL,
    TransactionType     NVARCHAR(50)    NULL,
    BusinessNo          NVARCHAR(50)    NULL,
    RepresentativeName  NVARCHAR(100)   NULL,
    BusinessTypeName    NVARCHAR(100)   NULL,
    BusinessItemName    NVARCHAR(200)   NULL,
    PostalCode          NVARCHAR(20)    NULL,
    Address             NVARCHAR(500)   NULL,
    PhoneNo             NVARCHAR(50)    NULL,
    FaxNo               NVARCHAR(50)    NULL,
    MobileNo            NVARCHAR(50)    NULL,
    Email               NVARCHAR(200)   NULL,
    ContactPerson       NVARCHAR(100)   NULL,
    ContactDept         NVARCHAR(100)   NULL,
    SuspensionDate      DATE            NULL,
    SuspensionReason    NVARCHAR(200)   NULL,
    Registrant          NVARCHAR(100)   NULL,
    Modifier            NVARCHAR(100)   NULL,
    CreatedAt           DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'Purchaser OK';

-- 3. ModelCode
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ModelCode')
CREATE TABLE dbo.ModelCode (
    Id                      INT             IDENTITY(1,1) PRIMARY KEY,
    ModelCode               NVARCHAR(50)    NOT NULL UNIQUE,
    ModelName               NVARCHAR(200)   NOT NULL,
    PrimaryCustomerCode     NVARCHAR(50)    NULL,
    PrimaryCustomerName     NVARCHAR(200)   NULL,
    CreatedAt               DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'ModelCode OK';

-- 4. PurchasePrice (구매단가.xls 시트 구조 반영)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchasePrice')
CREATE TABLE dbo.PurchasePrice (
    Id                              INT             IDENTITY(1,1) PRIMARY KEY,
    ItemCode                        NVARCHAR(50)    NOT NULL,
    ItemName                        NVARCHAR(200)   NOT NULL,
    ItemSpec                        NVARCHAR(200)   NULL,
    ItemMaterialName                NVARCHAR(100)  NULL,
    SupplierCode                    NVARCHAR(50)   NOT NULL,
    SupplierName                    NVARCHAR(200)   NOT NULL,
    UnitPrice                       DECIMAL(18,4)   NOT NULL,
    IsTempPrice                     BIT             NOT NULL DEFAULT 0,
    ApplyDate                       DATE            NOT NULL,
    ValidDate                       DATE            NULL,
    ExpireDate                      DATE            NULL,
    CurrencyCode                    NVARCHAR(10)    NOT NULL DEFAULT 'KRW',
    WarehouseCode                   NVARCHAR(50)    NULL,
    StorageLocationCode             NVARCHAR(50)    NULL,
    ItemType                        NVARCHAR(50)    NULL,
    Remarks                         NVARCHAR(500)   NULL,
    OutsourcingMethod               NVARCHAR(100)   NULL,
    MaterialSupplyType              NVARCHAR(100)   NULL,
    OutsourcingReceiptItemCode      NVARCHAR(100)   NULL,
    OutsourcingReceiptItemName      NVARCHAR(200)   NULL,
    OutsourcingOrderIssue           BIT             NOT NULL DEFAULT 0,
    PriceNotUsed                    BIT             NOT NULL DEFAULT 0,
    Unit                            NVARCHAR(20)    NULL,
    WorkOrderNo                     NVARCHAR(50)    NULL,
    OutsourcingStartProcess         NVARCHAR(100)   NULL,
    ProcessTypeBefore               NVARCHAR(100)   NULL,
    ProcessNameBefore               NVARCHAR(200)   NULL,
    OutsourcingEndProcess           NVARCHAR(100)   NULL,
    ProcessTypeAfter                NVARCHAR(100)   NULL,
    ProcessNameAfter                NVARCHAR(200)   NULL,
    UnitPricePerKg                  DECIMAL(18,4)   NULL,
    CreatedAt                       DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt                       DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'PurchasePrice OK';

-- 5. Supplier
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Supplier')
CREATE TABLE dbo.Supplier (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    SupplierCode    NVARCHAR(50)    NOT NULL UNIQUE,
    Name            NVARCHAR(200)   NOT NULL,
    Country         NVARCHAR(10)    NULL,
    ContactName     NVARCHAR(100)   NULL,
    ContactEmail    NVARCHAR(200)   NULL,
    ContactPhone    NVARCHAR(50)    NULL,
    Address         NVARCHAR(500)   NULL,
    TotalSpend      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    Grade           NVARCHAR(5)     NULL,
    Status          NVARCHAR(20)    NOT NULL DEFAULT 'active',
    QualityScore    DECIMAL(5,2)    NULL,
    DeliveryScore   DECIMAL(5,2)    NULL,
    PriceScore      DECIMAL(5,2)    NULL,
    OverallScore    DECIMAL(5,2)    NULL,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'Supplier OK';

-- 6. PurchaseOrder
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseOrder')
CREATE TABLE dbo.PurchaseOrder (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    PoNumber            NVARCHAR(50)    NOT NULL UNIQUE,
    SupplierCode        NVARCHAR(50)    NULL,
    SupplierName        NVARCHAR(200)   NULL,
    OrderStatus         NVARCHAR(30)    NOT NULL DEFAULT 'draft',
    CurrencyCode        NVARCHAR(10)    NOT NULL DEFAULT 'KRW',
    PaymentType         NVARCHAR(50)    NULL,
    PaymentTerms        NVARCHAR(100)   NULL,
    BuyerCode           NVARCHAR(50)    NULL,
    BuyerName           NVARCHAR(100)   NULL,
    SupplierQuotationNo NVARCHAR(100)   NULL,
    OrderDate           DATE            NOT NULL DEFAULT GETDATE(),
    DueDate             DATE            NULL,
    VatRate             DECIMAL(5,2)    NULL DEFAULT 10,
    TotalAmount         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    AssignedTo          NVARCHAR(100)   NULL,
    Priority            NVARCHAR(20)    NULL DEFAULT 'normal',
    Notes               NVARCHAR(MAX)   NULL,
    CreatedAt           DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'PurchaseOrder OK';

-- 7. PurchaseOrderItem
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseOrderItem')
CREATE TABLE dbo.PurchaseOrderItem (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderId     INT             NOT NULL,
    ItemCode            NVARCHAR(50)    NOT NULL,
    ItemName            NVARCHAR(200)   NOT NULL,
    Specification       NVARCHAR(200)   NULL,
    Warehouse           NVARCHAR(50)    NULL,
    Quantity            DECIMAL(18,3)   NOT NULL,
    ReceivedQty         DECIMAL(18,3)   NOT NULL DEFAULT 0,
    UnitPrice           DECIMAL(18,4)   NOT NULL,
    Amount              DECIMAL(18,2)   NOT NULL,
    DueDate             DATE            NULL,
    CreatedAt           DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_POItem_PO FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id)
);
PRINT 'PurchaseOrderItem OK';

-- 8. PurchaseReceipt
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseReceipt')
CREATE TABLE dbo.PurchaseReceipt (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderId     INT             NOT NULL,
    PurchaseOrderItemId INT             NULL,
    ItemCode            NVARCHAR(50)    NOT NULL,
    ItemName            NVARCHAR(200)   NOT NULL,
    ReceivedQty         DECIMAL(18,3)   NOT NULL,
    ReceiptDate         DATE            NOT NULL DEFAULT GETDATE(),
    Warehouse           NVARCHAR(50)    NULL,
    StorageLocation     NVARCHAR(50)    NULL,
    InspectionStatus    NVARCHAR(20)    NULL DEFAULT 'pending',
    Notes               NVARCHAR(500)   NULL,
    CreatedAt           DATETIME        NOT NULL DEFAULT GETDATE()
);
PRINT 'PurchaseReceipt OK';

PRINT 'All tables created successfully!';
