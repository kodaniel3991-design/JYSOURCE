"use client";

import { useState, useEffect, useRef } from "react";
import { getPageState, setPageState } from "@/lib/page-state-cache";

/**
 * useState와 동일하게 사용하되, 상태 변경 시 페이지 캐시에도 저장합니다.
 * 페이지 재마운트(탭 전환 후 복귀) 시 캐시에서 초기값을 복원합니다.
 *
 * @param cacheKey  페이지+필드를 구분하는 고유 키 (예: "po-list/search")
 * @param defaultValue  캐시가 없을 때 사용할 초기값
 */
export function useCachedState<T>(
  cacheKey: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(
    () => getPageState<T>(cacheKey) ?? defaultValue
  );

  // 최신 cacheKey를 ref로 유지 (클로저 stale 방지)
  const keyRef = useRef(cacheKey);
  keyRef.current = cacheKey;

  const setState: React.Dispatch<React.SetStateAction<T>> = (action) => {
    setStateRaw((prev) => {
      const next =
        typeof action === "function"
          ? (action as (prev: T) => T)(prev)
          : action;
      setPageState(keyRef.current, next);
      return next;
    });
  };

  return [state, setState];
}
