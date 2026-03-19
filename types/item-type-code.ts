/** 품목형태코드 관리 */

export interface ItemTypeCodeRecord {
  id: string;
  itemTypeCode: string;       // 형태코드
  itemTypeName: string;       // 품목형태명
  procurementType: string;    // 조달구분
  salesAccount: string;       // 매출계정
  salesAccountName: string;   // 매출계정명
  salesCounterAccount: string;     // 매출상대계정
  salesCounterAccountName: string; // 매출상대계정명
  purchaseAccount: string;         // 매입계정
  purchaseAccountName: string;     // 매입계정명
  purchaseCounterAccount: string;       // 매입상대계정
  purchaseCounterAccountName: string;   // 매입상대계정명
}
