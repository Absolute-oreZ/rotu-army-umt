import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const dictionary = await getDictionary(locale);

  return (
    <main className="flex min-h-dvh flex-1 items-center bg-background px-6 py-24 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {dictionary.home.eyebrow}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          {dictionary.home.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {dictionary.home.intro}
        </p>
      </section>
    </main>
  );
}
