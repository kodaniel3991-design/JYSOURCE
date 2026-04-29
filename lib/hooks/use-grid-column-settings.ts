"use client";

import { useState } from "react";

type ColSettings = {
  order: string[];
  widths: Record<string, number>;
};

function parseUsername(): string {
  if (typeof document === "undefined") return "anon";
  try {
    const match = document.cookie.match(/(?:^|;\s*)jys_session=([^;]+)/);
    if (!match) return "anon";
    const decoded = atob(decodeURIComponent(match[1]));
    const pipeIdx = decoded.indexOf("|");
    return pipeIdx >= 0 ? decoded.slice(0, pipeIdx) : "anon";
  } catch {
    return "anon";
  }
}

function loadSettings(storageKey: string, defaultOrder: string[]): ColSettings {
  if (typeof window === "undefined") return { order: defaultOrder, widths: {} };
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as ColSettings;
      const savedOrder = Array.isArray(parsed.order) ? parsed.order : [];
      const validOrder = savedOrder.filter((k) => defaultOrder.includes(k));
      const missing = defaultOrder.filter((k) => !validOrder.includes(k));
      return { order: [...validOrder, ...missing], widths: parsed.widths ?? {} };
    }
  } catch {}
  return { order: defaultOrder, widths: {} };
}

/**
 * 그리드 컬럼 순서·너비를 localStorage에 사용자별로 저장하는 훅.
 * @param pageKey  저장 키 접두어 (예: "receipt-status/detail")
 * @param defaultOrder  기본 컬럼 키 순서
 */
export function useGridColumnSettings(pageKey: string, defaultOrder: string[]) {
  const username = parseUsername();
  const storageKey = `col-settings:${pageKey}:${username}`;

  const [settings, setSettings] = useState<ColSettings>(() =>
    loadSettings(storageKey, defaultOrder)
  );
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const persist = (next: ColSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const reorder = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const order = [...settings.order];
    const from = order.indexOf(fromKey);
    const to = order.indexOf(toKey);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, fromKey);
    persist({ ...settings, order });
  };

  const resize = (key: string, width: number) => {
    persist({ ...settings, widths: { ...settings.widths, [key]: Math.max(40, width) } });
  };

  return {
    colOrder: settings.order,
    colWidths: settings.widths,
    dragKey,
    setDragKey,
    dropTargetKey,
    setDropTargetKey,
    reorder,
    resize,
  };
}
