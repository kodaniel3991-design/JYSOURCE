"use client";

import { useState, useMemo } from "react";

export function useSortableGrid<T extends object>(items: T[]) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""), "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return { sortedItems, sortKey, sortDir, toggleSort };
}
