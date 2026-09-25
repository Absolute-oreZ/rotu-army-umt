"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  themeCookieMaxAge,
  themeStorageKey,
  isTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeListeners = new Set<() => void>();

function emitThemeChange() {
  for (const listener of themeListeners) {
    listener();
  }
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getStoredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(themeStorageKey) ?? undefined;

  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  const cookieTheme = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${themeStorageKey}=`))
    ?.split("=")[1];

  if (isTheme(cookieTheme)) {
    return cookieTheme;
  }

  return "system";
}

function persistTheme(theme: Theme) {
  window.localStorage.setItem(themeStorageKey, theme);
  document.cookie = `${themeStorageKey}=${theme}; Max-Age=${themeCookieMaxAge}; Path=/; SameSite=Lax`;
}

function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
}

function subscribeToStoredTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);

  return () => {
    themeListeners.delete(onStoreChange);
  };
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function ThemeProvider({
  children,
  initialTheme = "system",
}: Readonly<{
  children: React.ReactNode;
  initialTheme?: Theme;
}>) {
  const getServerTheme = useCallback(() => initialTheme, [initialTheme]);
  const getServerSystemTheme = useCallback(() => "light" as ResolvedTheme, []);

  const theme = useSyncExternalStore(
    subscribeToStoredTheme,
    getStoredTheme,
    getServerTheme,
  );
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerSystemTheme,
  );
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  const setTheme = useCallback((nextTheme: Theme) => {
    persistTheme(nextTheme);
    emitThemeChange();
  }, []);

  useLayoutEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
