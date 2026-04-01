"use client";

import { useCallback, useEffect, useState } from "react";

export type FavoriteItem = { href: string; label: string };

const FAVORITES_KEY = "menu_favorites";

function loadFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const isFavorite = useCallback(
    (href: string) => favorites.some((f) => f.href === href),
    [favorites]
  );

  const toggle = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.href === item.href);
      const next = exists
        ? prev.filter((f) => f.href !== item.href)
        : [...prev, item];
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggle };
}
