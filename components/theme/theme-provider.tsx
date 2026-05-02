"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const resolvedTheme = resolveTheme(theme);

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
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

export function ThemeProvider({
  children,
  initialTheme = "system",
}: Readonly<{
  children: React.ReactNode;
  initialTheme?: Theme;
}>) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    initialTheme === "dark" ? "dark" : "light",
  );

  const setTheme = useCallback((nextTheme: Theme) => {
    persistTheme(nextTheme);
    applyTheme(nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(resolveTheme(nextTheme));
  }, []);

  useEffect(() => {
    const storedTheme = getStoredTheme();

    if (storedTheme !== theme) {
      setThemeState(storedTheme);
      setResolvedTheme(resolveTheme(storedTheme));
      persistTheme(storedTheme);
      applyTheme(storedTheme);
      return;
    }

    persistTheme(theme);
    applyTheme(theme);
    setResolvedTheme(resolveTheme(theme));
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemThemeChange() {
      if (theme === "system") {
        applyTheme("system");
        setResolvedTheme(resolveTheme("system"));
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
