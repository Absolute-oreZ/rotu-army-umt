"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import {
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type PublicHeaderProps = {
  locale: Locale;
  dictionary: Pick<Dictionary, "common" | "navigation">;
};

const navItems = [
  { key: "about", path: "" },
  { key: "intakes", path: "/intakes" },
  { key: "events", path: "/events" },
  { key: "contact", path: "/contact" },
] as const;

function localizedPath(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function switchLocale(pathname: string, nextLocale: Locale) {
  const parts = pathname.split("/");

  if (locales.includes(parts[1] as Locale)) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}`;
}

export function PublicHeader({ locale, dictionary }: PublicHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const links = navItems.map((item) => {
    const href = localizedPath(locale, item.path);
    const isActive =
      item.path === ""
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);

    return {
      href,
      isActive,
      label: dictionary.navigation[item.key],
    };
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/92 backdrop-blur supports-backdrop-filter:bg-background/78">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={localizedPath(locale, "")}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
            <Image
              src="/icons/logo.png"
              alt=""
              width={36}
              height={36}
              className="size-full object-contain p-0.5"
              priority
            />
          </span>
          <span className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            ROTU Army UMT
          </span>
        </Link>

        <nav
          aria-label={dictionary.common.primaryNavigation}
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.isActive ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-1/2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary after:transition-[left,right] after:duration-200 after:ease-out hover:text-foreground hover:after:left-3 hover:after:right-3",
                link.isActive &&
                  "text-foreground after:left-3 after:right-3",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher
            label={dictionary.common.language}
            locale={locale}
            pathname={pathname}
          />
          <ThemeToggle
            onToggle={() => setTheme(isDark ? "light" : "dark")}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="md:hidden"
          aria-label={
            isMenuOpen ? dictionary.common.closeMenu : dictionary.common.menu
          }
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <nav
              aria-label={dictionary.common.primaryNavigation}
              className="grid gap-1"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-1/2 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-[left,right] after:duration-200 after:ease-out hover:text-foreground hover:after:left-3 hover:after:right-3",
                    link.isActive &&
                      "text-foreground after:left-3 after:right-3",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <LanguageSwitcher
                label={dictionary.common.language}
                locale={locale}
                pathname={pathname}
              />
              <ThemeToggle
                onToggle={() => setTheme(isDark ? "light" : "dark")}
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function LanguageSwitcher({
  label,
  locale,
  pathname,
}: {
  label: string;
  locale: Locale;
  pathname: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex rounded-md border border-border bg-background p-1"
      role="navigation"
    >
      {locales.map((item) => (
        <Link
          key={item}
          href={switchLocale(pathname, item)}
          hrefLang={item}
          aria-current={item === locale ? "true" : undefined}
          className={cn(
            "flex h-7 min-w-8 items-center justify-center rounded-[calc(var(--radius)-0.1rem)] px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            item === locale &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {localeLabels[item]}
        </Link>
      ))}
    </div>
  );
}

function ThemeToggle({
  onToggle,
}: {
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={onToggle}
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
