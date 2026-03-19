/** 구매처 관리 - 선택화면 */

export interface PurchaserRecord {
  id: string;
  purchaserNo: string;
  purchaserName: string;
  phoneNo: string;
  faxNo: string;
  contactPerson: string;
  contactDept: string;
  transactionType: string;
  representativeName: string;
  businessNo: string;
  postalCode: string;
  address: string;
  suspensionDate: string;
  suspensionReason: string;
  registrant: string;
  modifier: string;
  /** E-MAIL */
  email?: string;
  /** 업태명 */
  businessTypeName?: string;
  /** 종목명 */
  businessItemName?: string;
  /** 휴대폰번호 */
  mobileNo?: string;
}
