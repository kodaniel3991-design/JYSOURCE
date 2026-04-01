-- 구매입고이력 테이블 생성
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ReceiptHistory') AND type = 'U')
BEGIN
  CREATE TABLE dbo.ReceiptHistory (
    Id              INT            IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderId INT            NOT NULL,
    ReceiptNo       NVARCHAR(30)   NOT NULL,
    ProcessedAt     DATETIME2      NOT NULL DEFAULT GETDATE(),
    Type            NVARCHAR(10)   NOT NULL, -- '입고' | '반품'
    ItemCode        NVARCHAR(50)   NOT NULL,
    ItemName        NVARCHAR(200)  NULL,
    Qty             DECIMAL(18,3)  NOT NULL DEFAULT 0,
    ReceiptDate     DATE           NULL,
    Warehouse       NVARCHAR(20)   NULL,
    LotNo           NVARCHAR(100)  NULL,
    Note            NVARCHAR(500)  NULL,
    CONSTRAINT FK_ReceiptHistory_PurchaseOrder
      FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrder(Id) ON DELETE CASCADE
  );
END
