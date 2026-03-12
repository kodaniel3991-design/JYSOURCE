// 하위 호환성을 위한 배럴 re-export
// 각 페이지는 직접 서브파일을 import하면 번들 크기가 더 줄어듭니다:
//   import { suppliers } from "@/lib/mock/suppliers"
//   import { purchaseOrders } from "@/lib/mock/purchase-orders"
//   etc.

export * from "./mock/suppliers";
export * from "./mock/purchase-orders";
export * from "./mock/po-options";
export * from "./mock/dashboard";
export * from "./mock/analytics";
export * from "./mock/model-codes";
export * from "./mock/purchasers";
export * from "./mock/purchase-prices";
