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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader
        locale={locale}
        dictionary={{
          common: dictionary.common,
          navigation: dictionary.navigation,
        }}
      />
      {children}
    </div>
  );
}
