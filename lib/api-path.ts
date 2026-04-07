/**
 * 클라이언트 fetch에서 basePath를 자동으로 붙여준다.
 * - next dev  → NEXT_PUBLIC_BASE_PATH="" (빈값, 로컬 정상 동작)
 * - next build → .env.production.local에서 NEXT_PUBLIC_BASE_PATH=/jys 적용
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
