-- ============================================================
-- 공통코드 테이블 생성 및 초기 데이터 삽입
-- SSMS에서 실행: USE [JYS_DB]; GO
-- ============================================================

-- 1. 분류 테이블
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CommonCodeCategory') AND type = 'U')
CREATE TABLE dbo.CommonCodeCategory (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  CategoryKey NVARCHAR(50)  NOT NULL,
  Label       NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500) NULL,
  SortOrder   INT           NOT NULL DEFAULT 0,
  CONSTRAINT UQ_CommonCodeCategory_Key UNIQUE (CategoryKey)
);

-- 2. 코드 테이블
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CommonCode') AND type = 'U')
CREATE TABLE dbo.CommonCode (
  Id        INT IDENTITY(1,1) PRIMARY KEY,
  Category  NVARCHAR(50)  NOT NULL,
  Code      NVARCHAR(50)  NOT NULL,
  Name      NVARCHAR(200) NOT NULL,
  SortOrder INT           NOT NULL DEFAULT 0,
  CONSTRAINT UQ_CommonCode_Category_Code UNIQUE (Category, Code)
);
GO

-- 3. 초기 분류 삽입
IF NOT EXISTS (SELECT 1 FROM dbo.CommonCodeCategory WHERE CategoryKey = 'plant')
INSERT INTO dbo.CommonCodeCategory (CategoryKey, Label, Description, SortOrder) VALUES
  ('plant',       '사업장 코드', '공장/사업장 구분 코드 (예: 김해공장, 울산공장).', 1),
  ('paymentType', '결제방법',   '계좌이체, L/C, 어음 등 결제 수단.', 2),
  ('paymentTerm', '지급조건',   '현금(30), B2B(15), 어음(45) 등 지급 조건.', 3),
  ('importType',  '수입구분',   '내수 / 수입 등 구매 유형.', 4),
  ('currency',    '통화코드',   'KRW, USD, EUR 등 결제 통화 코드.', 5),
  ('vatRate',     '부가세율',   '0%, 10% 등 부가가치세 적용 세율.', 6),
  ('paymentForm', '지급형태',   '현금30, B2B30, 어음 등 지급 형태 코드.', 7),
  ('warehouse',   '창고코드',   '원부자재창고, 제품재고 등 창고 구분 코드.', 8);

-- 4. 초기 코드 삽입
IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'plant')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('plant', 'gimhae',     '김해공장', 1),
  ('plant', 'ulsan',      '울산공장', 2),
  ('plant', 'pyeongtaek', '평택공장', 3);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'paymentType')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('paymentType', 'transfer', '계좌이체', 1),
  ('paymentType', 'l/c',      'L/C',      2),
  ('paymentType', 'bill',     '어음',     3),
  ('paymentType', 'cash',     '현금',     4),
  ('paymentType', 'credit',   '외상',     5);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'paymentTerm')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('paymentTerm', '11', '현금(30)', 1),
  ('paymentTerm', '12', '현금(60)', 2),
  ('paymentTerm', '13', '현금(90)', 3),
  ('paymentTerm', '21', 'B2B(15)',  4),
  ('paymentTerm', '22', '어음(45)', 5),
  ('paymentTerm', '23', '어음(60)', 6);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'importType')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('importType', 'domestic',  '내수',       1),
  ('importType', 'master_lc', 'MASTER L/C', 2),
  ('importType', 'tt',        'T/T',        3);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'currency')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('currency', 'CNY', 'CNY(중국)',    1),
  ('currency', 'EUR', 'EUR(유럽연합)', 2),
  ('currency', 'JPY', 'JPY(일본)',    3),
  ('currency', 'KRW', 'WON(원)',      4),
  ('currency', 'USD', 'USD(미국)',    5);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'vatRate')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('vatRate', '0',  '0%',  1),
  ('vatRate', '10', '10%', 2);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'paymentForm')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('paymentForm', '10', '현금30', 1),
  ('paymentForm', '11', '현금60', 2),
  ('paymentForm', '12', '현금90', 3),
  ('paymentForm', '20', 'B2B30',  4),
  ('paymentForm', '21', 'B2B60',  5),
  ('paymentForm', '22', 'B2B90',  6),
  ('paymentForm', '23', 'B2B75',  7);

IF NOT EXISTS (SELECT 1 FROM dbo.CommonCode WHERE Category = 'warehouse')
INSERT INTO dbo.CommonCode (Category, Code, Name, SortOrder) VALUES
  ('warehouse', '10', '원부자재창고',  1),
  ('warehouse', '20', '제품재고',      2),
  ('warehouse', '30', '상품재고',      3),
  ('warehouse', '40', 'RSM(IN-LINE)', 4),
  ('warehouse', '90', '반품창고',      5);
GO
