import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PublicHeader } from "@/components/public/public-header";

type PublicShellProps = Readonly<{
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}>;

export function PublicShell({ children, dictionary, locale }: PublicShellProps) {
  return (
    <div className="public-site flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">
        {dictionary.common.skipToContent}
      </a>
      <PublicHeader
        locale={locale}
        siteName={dictionary.metadata.siteName}
        dictionary={{
          common: dictionary.common,
          navigation: dictionary.navigation,
        }}
      />
      {children}
    </div>
  );
}
