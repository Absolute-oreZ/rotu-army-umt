import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { localeFromPathname } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function RootNotFound() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);
  const dictionary = await getDictionary(locale);
  const d = dictionary.notFoundPage;

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <div className="relative h-48 w-48 sm:h-56 sm:w-56">
          <Image
            src="/images/not-found.png"
            alt={d.imageAlt}
            fill
            sizes="224px"
            className="object-contain"
            priority
          />
        </div>

        <span className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {d.eyebrow}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {d.title}
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          {d.description}
        </p>

        <div className="mt-8">
          <Link
            href={`/${locale}`}
            className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.24em] text-background transition-colors hover:bg-foreground/90"
          >
            {d.backHomeLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
