-- AppUser 테이블에 사용자 추가 정보 컬럼 추가
-- 실행 전 백업 권장

ALTER TABLE dbo.AppUser
ADD
    UserId      NVARCHAR(50)  NULL,   -- 사용자명 (실명)
    Email       NVARCHAR(100) NULL,   -- 이메일
    PhoneNo     NVARCHAR(20)  NULL,   -- 전화번호
    HireDate    DATE          NULL,   -- 입사일자
    Position    NVARCHAR(50)  NULL,   -- 직책
    EmployeeNo  NVARCHAR(20)  NULL;   -- 사번
