import { useState, useEffect } from "react";
import type { PurchaserRecord } from "@/types/purchaser";
import { apiPath } from "@/lib/api-path";

// 모듈 레벨 캐시 — 앱 수명 동안 한 번만 fetch
let _cache: PurchaserRecord[] | null = null;
let _promise: Promise<PurchaserRecord[]> | null = null;

function loadSuppliers(): Promise<PurchaserRecord[]> {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = fetch(apiPath("/api/purchasers"))
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data): PurchaserRecord[] => {
        if (!data.ok) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.items.map((x: any): PurchaserRecord => ({
          id:                  String(x.Id),
          purchaserNo:         x.PurchaserNo          ?? "",
          purchaserName:       x.PurchaserName        ?? "",
          phoneNo:             x.PhoneNo              ?? "",
          faxNo:               x.FaxNo                ?? "",
          contactPerson:       x.ContactPerson        ?? "",
          contactDept:         x.ContactDept          ?? "",
          transactionType:     x.TransactionType      ?? "",
          representativeName:  x.RepresentativeName   ?? "",
          businessNo:          x.BusinessNo           ?? "",
          postalCode:          x.PostalCode           ?? "",
          address:             x.Address              ?? "",
          suspensionDate:      x.SuspensionDate       ?? "",
          suspensionReason:    x.SuspensionReason     ?? "",
          registrant:          x.Registrant           ?? "",
          modifier:            x.Modifier             ?? "",
        }));
      })
      .then((list) => { _cache = list; return list; })
      .catch(() => []);
  }
  return _promise;
}

/** 구매처 목록 로드 (앱 전체에서 1회 fetch, 이후 캐시 반환) */
export function useSupplierList() {
  const [list, setList] = useState<PurchaserRecord[]>(_cache ?? []);

  useEffect(() => {
    if (_cache) { setList(_cache); return; }
    loadSuppliers().then(setList);
  }, []);

  return list;
}

/**
 * 구매처코드 입력 시 정확히 1건이 매칭되면 구매처명을 자동 세팅.
 * @param code       현재 구매처코드 입력값
 * @param setName    구매처명 setState
 */
export function useSupplierAutoFill(
  code: string,
  setName: (name: string) => void
) {
  const list = useSupplierList();

  useEffect(() => {
    const kw = code.trim().toLowerCase();
    if (!kw) { setName(""); return; }
    const matches = list.filter((p) => p.purchaserNo.toLowerCase() === kw);
    if (matches.length === 1) {
      setName(matches[0].purchaserName);
    } else {
      setName("");
    }
  // setName은 안정적인 setState이므로 deps에서 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, list]);
}
