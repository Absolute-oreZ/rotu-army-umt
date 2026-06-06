"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorStrings } from "@/lib/i18n/error-strings";
import { localeFromPathname } from "@/lib/i18n/config";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = localeFromPathname(window.location.pathname);
  const strings = errorStrings[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <AlertTriangle className="mb-6 h-16 w-16 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {strings.title}
        </h1>
        <p className="mb-6 text-muted-foreground">{strings.description}</p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            {strings.tryAgain}
          </Button>
          <Link
            href={`/${locale}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Home className="mr-2 h-4 w-4" />
            {strings.goHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
