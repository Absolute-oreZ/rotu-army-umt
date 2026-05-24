import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntakeDetailClient } from "@/components/public/intake-detail-client";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedIntakeDetail } from "@/lib/public/content";

const PATCH_EXPLANATION_ORDER = ["ANIMAL", "COLOR", "PHILOSOPHY"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = await getDictionary(locale);
  const intake = await getPublishedIntakeDetail(locale, slug);

  if (!intake) {
    notFound();
  }

  const title = intake.seoTitle ?? intake.displayName;
  const description =
    intake.seoDescription ??
    intake.summary ??
    dictionary.intakesPage.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/intakes/${slug}`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}/intakes/${slug}`]),
      ),
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      url: `/${locale}/intakes/${slug}`,
    },
  };
}

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;

  const [dictionary, intake] = await Promise.all([
    getDictionary(locale),
    getPublishedIntakeDetail(locale, slug),
  ]);

  if (!intake) {
    notFound();
  }

  const orderedPatchExplanations = PATCH_EXPLANATION_ORDER.map((key) => {
    const item = intake.patchExplanations.find((entry) => entry.key === key);
    const value = item?.translations[locale] ?? item?.translations.en;
    return value ? { key, value } : null;
  }).filter(
    (
      item,
    ): item is {
      key: (typeof PATCH_EXPLANATION_ORDER)[number];
      value: string;
    } => item !== null,
  );

  const galleryPhotos = intake.displayPhotos;

  const heroImage =
    intake.coverPhotoPath ??
    intake.patchPhotoPath ??
    galleryPhotos[0]?.photoPath ??
    "/images/default-hero-image.jpg";

  const patchHero =
    intake.patchPhotoPath ??
    intake.coverPhotoPath ??
    galleryPhotos[0]?.photoPath ??
    "/images/default-hero-image.jpg";

  const uniformPhotos = [
    {
      label: dictionary.intakeDetailPage.innerLabel,
      src: intake.innerPhotoPath,
    },
    {
      label: dictionary.intakeDetailPage.tshirtLabel,
      src: intake.tshirtPhotoPath,
    },
  ].filter((item): item is { label: string; src: string } => item.src !== null);

  const summary = intake.summary ?? dictionary.intakesPage.description;

  return (
    <main className="bg-background text-foreground">
      <IntakeDetailClient
        dictionary={{
          ...dictionary.intakesPage,
          ...dictionary.intakeDetailPage,
          backLabel: dictionary.navigation.intakes,
        }}
        intake={intake}
        locale={locale}
        orderedPatchExplanations={orderedPatchExplanations}
        heroImage={heroImage}
        patchHero={patchHero}
        uniformPhotos={uniformPhotos}
        summary={summary}
      />
    </main>
  );
}