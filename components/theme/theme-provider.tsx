"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "jypurch-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((next: Theme) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const actual: "light" | "dark" =
      next === "system" ? getSystemTheme() : next;

    if (actual === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    setResolvedTheme(actual);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? "system";
    applyTheme(initial);
  }, [applyTheme]);

  // 시스템 테마 연동 (system 모드일 때만)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const handleSetTheme = useCallback(
    (next: Theme) => {
      applyTheme(next);
    },
    [applyTheme]
  );

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme: handleSetTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

