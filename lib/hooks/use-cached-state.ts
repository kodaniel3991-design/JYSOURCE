"use client";

import { useState, useEffect, useRef } from "react";
import { getPageState, setPageState } from "@/lib/page-state-cache";

/**
 * useState와 동일하게 사용하되, 상태 변경 시 페이지 캐시에도 저장합니다.
 * 페이지 재마운트(탭 전환 후 복귀) 시 캐시에서 초기값을 복원합니다.
 *
 * 하이드레이션 안전: 첫 렌더(SSR + 클라이언트 hydration)는 항상 defaultValue를 사용하고,
 * mount 이후 useEffect에서 캐시 값을 복원합니다.
 *
 * @param cacheKey  페이지+필드를 구분하는 고유 키 (예: "po-list/search")
 * @param defaultValue  캐시가 없을 때 사용할 초기값
 */
export function useCachedState<T>(
  cacheKey: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 첫 렌더는 항상 defaultValue → 서버 HTML과 일치 보장
  const [state, setStateRaw] = useState<T>(defaultValue);

  // 최신 cacheKey를 ref로 유지 (클로저 stale 방지)
  const keyRef = useRef(cacheKey);
  keyRef.current = cacheKey;

  // 마운트 후 캐시 복원 (클라이언트 전용)
  useEffect(() => {
    const cached = getPageState<T>(cacheKey);
    if (cached !== undefined) {
      setStateRaw(cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
