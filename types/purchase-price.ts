export interface PurchasePriceRecord {
  id: string;
  /** 1. 품목번호 */
  itemCode: string;
  /** 2. 품목명 */
  itemName: string;
  /** 3. 품목규격 */
  itemSpec: string;
  /** 4. 품목재질명 */
  itemMaterialName?: string;
  /** 5. 구매처번호 */
  supplierCode: string;
  /** 적용일자 */
  applyDate: string;
  /** 7. 구매단가 */
  unitPrice: number;
  /** 8. 가단가 여부 */
  isTempPrice?: boolean;
  /** 9. 창고코드 */
  warehouseCode?: string;
  /** 10. 저장위치코드 */
  storageLocationCode?: string;
  /** 11. 발주정율 */
  orderRate?: number;
  /** 12. 단가사용안함 */
  priceNotUsed?: boolean;
  /** 13. 외주오더발행여부 */
  outsourcingOrderIssue?: boolean;
  /** 14. 외주방법 / 사급구분 */
  outsourcingMethod?: string;
  /** 15. 외주입고품목번호 */
  outsourcingReceiptItemCode?: string;
  /** 16. 작지번호 */
  workOrderNo?: string;
  /** 17. 사업장 */
  plant?: string;
  /** 18. 유효일자 */
  validDate?: string;
  /** 19. 유효일자 조정 */
  validDateAdjust?: boolean;
  /** 20. 통화코드 */
  currencyCode?: string;
  /** 검색/필터용 구매처명 (그리드 외) */
  supplierName?: string;
  /** 레거시: 유효기간 */
  expireDate?: string;
  /** 레거시: 개발단가 */
  devUnitPrice?: number;
  /** 레거시: 할인율 */
  discountRate?: number;
  /** 레거시: 통화 (currencyCode 사용 권장) */
  currency?: string;
  /** 레거시: 비고 */
  remarks?: string;
}
