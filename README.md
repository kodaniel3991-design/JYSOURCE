# Procurement Hub

글로벌 B2B SaaS 스타일의 구매관리 프론트엔드 (자동차 부품 제조업 구매오더 중심).

## 기술 스택

- **Next.js 14.2** (App Router)
- **React 18** + **TypeScript 5.6**
- **Tailwind CSS 3.4** + 커스텀 UI 컴포넌트 (shadcn/ui 스타일)
- **lucide-react 0.460** (아이콘)
- **recharts 2.13** (차트)
- **class-variance-authority** + **clsx** + **tailwind-merge** (스타일 유틸)
- 반응형, 다크모드 확장 가능 구조

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 후 `/dashboard`로 이동합니다.

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/dashboard` | KPI, 월별 구매금액·공급사 비중 차트, 최근 PO, 납기지연 알림 |
| `/purchase-orders` | PO 목록, 필터, 요약 카드, 페이지네이션 |
| `/purchase-orders/[id]` | PO 상세, 품목 테이블, 탭(Overview/Receipt/Changelog) |
| `/purchase-orders/create` | 4단계 Wizard (Supplier → Items → Pricing → Review) |
| `/purchase-orders/performance` | 오더 실적 현황 |
| `/purchase-orders/performance/closing` | 오더 마감 현황 |
| `/purchase-orders/performance/receipts` | 입고 실적 현황 |
| `/items` | 품목 목록, 등록/수정 시트 (분류·기술·조달·재고·연락처 탭) |
| `/model-codes` | 모델 코드 목록, 등록/수정 |
| `/suppliers` | 공급사 목록, 필터, 우측 상세 패널 |
| `/purchasers` | 구매 담당자 목록, 등록/수정 |
| `/purchase-prices` | 구매 단가 목록, 등록/수정 |
| `/analytics` | KPI, 월별/공급사/카테고리 차트, 분석 테이블 |
| `/settings` | 설정 메인 |
| `/settings/common-codes` | 공통코드 관리 |
| `/settings/display` | 화면 표시 설정 |

## 폴더 구조

```
app/
  (dashboard)/           # 대시보드 레이아웃 (사이드바 + 헤더)
    layout.tsx
    error.tsx
    dashboard/page.tsx
    purchase-orders/
      page.tsx
      create/page.tsx
      [id]/page.tsx, po-detail-client.tsx
      performance/
        page.tsx
        closing/page.tsx
        receipts/page.tsx
    items/page.tsx
    model-codes/page.tsx
    suppliers/page.tsx
    purchasers/page.tsx
    purchase-prices/page.tsx
    analytics/page.tsx
    settings/
      page.tsx
      common-codes/page.tsx
      display/page.tsx

components/
  layout/                # app-sidebar, app-header
  common/                # page-header, kpi-card, status-badge, filter-bar,
                         # data-table, master-list-grid, search-panel,
                         # crud-actions, data-grid-toolbar
  ui/                    # button, card, input, badge, select, table,
                         # tabs, label, textarea, separator, sheet, checkbox
  charts/                # line-spend-chart, supplier-pie-chart, bar-spend-chart
  dashboard/             # dashboard-kpi-cards, dashboard-summary-widgets,
                         # delay-alert-card, monthly-spend-chart,
                         # recent-po-table, supplier-spend-chart
  purchase/              # po-summary-cards, po-items-table, po-stepper
  items/                 # item-register-sheet, item-register-tabs,
                         # item-register-header/footer/basic-info,
                         # item-copy-helper
    forms/               # item-classification-form, item-technical-form,
                         # item-procurement-form, item-inventory-form,
                         # item-contacts-form
  suppliers/             # supplier-detail-sheet
  purchasers/            # purchaser-register-sheet
  purchase-prices/       # purchase-price-sheet
  model-codes/           # model-code-register-sheet
  theme/                 # theme-provider

lib/
  utils.ts               # cn(), formatCurrency(), formatDate()
  mock-data.ts           # purchaseOrders, suppliers, dashboardData, analyticsData
  item-register-options.ts  # 품목 등록 폼 옵션 정의

types/
  purchase.ts
  supplier.ts
  purchaser.ts
  analytics.ts
  item-register.ts
  model-code.ts
  purchase-price.ts
```

## 더미 데이터

- `lib/mock-data.ts`: PO, 공급사, 대시보드, 분석용 더미 데이터
- 백엔드 연동 시 해당 모듈을 API 호출로 교체하면 됨

## 실행 방법 (개발 vs 서버)

**개발 모드** (로컬 개발, 핫 리로드):
```bash
npm run dev
```
→ 기본 포트 3000. 브라우저에서 http://localhost:3000 접속.

**서버(프로덕션)에서 실행** (빌드 후 서버로 서비스):
```bash
npm run build
npm run start
```
→ 빌드 결과가 `.next`에 생성된 뒤, `next start`로 서버가 뜹니다. 기본 포트 3000.

**포트 지정 (PowerShell):**
```powershell
$env:PORT=3007; npm run start
```
**포트 지정 (CMD):**
```cmd
set PORT=3007 && npm run start
```

## 개발 시 오류 예방 (localhost 확인 전 권장)

페이지를 신규 생성·수정한 뒤 localhost에서 확인할 때 오류가 반복되면 아래 순서를 권장합니다.

### 1. localhost 확인 전에 한 번 실행

```bash
npm run typecheck
```

- 타입/구문 오류를 빌드 전에 잡습니다. 에러가 나오면 수정 후 다시 확인합니다.

또는 더 확실히 하려면:

```bash
npm run build
```

- 빌드가 성공해야 서버 실행 시 500이 날 가능성이 줄어듭니다.

### 2. 오류가 날 때 한 번에 캐시 삭제 후 재실행

```bash
npm run dev:clean
```

- `.next` 폴더를 지운 뒤 `next dev`를 실행합니다.
- 스타일이 안 먹히거나, 500·이상 동작이 나올 때 사용합니다.

### 3. 오류 원인 정리

| 현상 | 원인 | 대응 |
|------|------|------|
| 500 Internal Server Error | 서버 렌더 시 해당 페이지/컴포넌트에서 예외 발생 | 터미널 로그 확인 → `npm run build`로 에러 위치 확인 → `npm run dev:clean` 후 재시도 |
| 스타일이 전혀 안 보임 | 오래된 `.next` 캐시 또는 CSS 미적용 | `npm run dev:clean` 후 브라우저 강력 새로고침(Ctrl+Shift+R) |
| 새 페이지/수정 후만 깨짐 | 해당 라우트가 `mock-data` 등 무거운 모듈을 직접 import 해서 SSR 시 실패 | 해당 페이지는 `"use client"` + 필요 시 `dynamic(..., { ssr: false })`로 무거운 부분만 클라이언트 로드 |
| 빌드 시 `PageNotFoundError: /_document` | `.next` 캐시 꼬임 | `npm run dev:clean` 후 다시 `npm run build` |
| 빌드는 되는데 실행 시 에러 | 컴포넌트에 없는 prop 사용(예: `className`, `onCheckedChange`) | 터미널/브라우저 콘솔 스택 확인 후 UI 컴포넌트 정의와 사용처 맞추기 |

- **대시보드 라우트**는 `(dashboard)/error.tsx`가 있어서, 런타임 오류 시 "다시 시도" / "캐시 삭제 후 재시도" 안내가 나옵니다.

### 4. 수동 캐시 삭제 (dev:clean 대신)

**PowerShell:**
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

**CMD:**
```cmd
rmdir /s /q .next
npm run dev
```

서버가 뜨는 포트는 터미널에 표시됩니다 (예: `http://localhost:3007`). 포트가 사용 중이면 다음 포트로 자동 할당됩니다.
