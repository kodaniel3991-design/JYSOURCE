import { useCallback, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]), select:not([disabled])';

/**
 * 컨테이너 내 입력 필드에서 Enter 키를 누르면 다음 필드로 포커스를 이동합니다.
 * 반환된 콜백 ref를 폼 컨테이너 요소의 ref prop에 부착하세요.
 * (Sheet처럼 open 시점에 마운트되는 요소에도 정상 동작합니다.)
 */
export function useEnterNavigation<T extends HTMLElement = HTMLDivElement>() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const callbackRef = useCallback((container: T | null) => {
    // 이전 리스너 제거
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (!["input", "select"].includes(tag)) return;

      e.preventDefault();

      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      const idx = elements.indexOf(target);
      if (idx === -1) return;

      const next = elements[idx + 1];
      if (next) {
        next.focus();
        if (next instanceof HTMLInputElement) next.select();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    cleanupRef.current = () => container.removeEventListener("keydown", handleKeyDown);
  }, []);

  return callbackRef;
}
