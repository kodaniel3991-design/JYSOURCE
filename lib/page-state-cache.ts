/**
 * 페이지 상태를 메모리에 캐시합니다.
 * 모듈 수준 객체이므로 탭 전환(클라이언트 라우팅) 간에 유지됩니다.
 * 브라우저 새로고침 시에는 초기화됩니다.
 */
const cache: Record<string, unknown> = {};

export function getPageState<T>(key: string): T | undefined {
  return cache[key] as T | undefined;
}

export function setPageState<T>(key: string, state: T): void {
  cache[key] = state;
}
