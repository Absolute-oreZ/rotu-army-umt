import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getContactPageContent } from "@/lib/public/content";
import { NewsletterForm } from "@/components/public/newsletter-form";
import SpotlightCard from "@/components/ui/spotlight-card";
import {
  LucideIcon,
  Mail,
  Phone,
  Info,
  MessageSquare,
  HelpCircle,
  UserRound,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  Phone,
  Info,
  MessageSquare,
  HelpCircle,
  UserRound,
};

function getIcon(key: string) {
  const Icon = ICON_MAP[key] || Info;
  return <Icon className="h-6 w-6" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params as { locale: Locale };

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.contactPage.title,
    description: dictionary.contactPage.description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}/contact`]),
      ),
    },
    openGraph: {
      title: dictionary.contactPage.title,
      description: dictionary.contactPage.description,
      type: "website",
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      url: `/${locale}/contact`,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };

  const [dictionary, content] = await Promise.all([
    getDictionary(locale),
    getContactPageContent(locale),
  ]);

  const d = dictionary.contactPage;

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="flex flex-1 flex-col gap-8">
            <section className="flex flex-col gap-4 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                {d.eyebrow}
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {d.title}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {d.description}
              </p>
            </section>

            <section className="flex flex-col gap-4 md:flex-row md:flex-wrap">
              {content.contactReasons.map((reason) => (
                <SpotlightCard
                  key={reason.id}
                  spotlightColor="rgba(0,0,0,0.12)"
                  className="flex min-w-65 flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center text-muted-foreground shrink-0">
                    {getIcon(reason.iconKey)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground leading-tight">
                      {reason.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </section>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-5 lg:w-95">
            <section className="flex flex-col gap-2 flex-1 min-h-0">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
                {d.locationTitle}
              </h2>
              <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border">
                <iframe
                  src={content.googleMapLocationUrl}
                  className="h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {d.newsletterTitle}
              </h2>

              <NewsletterForm
                locale={locale}
                subtitle={d.newsletterSubTitle}
                description={d.newsletterDescription}
                emailLabel={d.newsletterEmailLabel}
                emailPlaceholder={d.newsletterEmailPlaceholder}
                loadingLabel={d.newsletterLoadingLabel}
                localeLabel={d.newsletterLocaleLabel}
                localeOptions={d.newsletterLocaleOptions}
                subscribeButton={d.newsletterSubscribeButton}
                errorMessage={d.newsletterErrorMessage}
                successMessage={d.newsletterSuccess}
              />
            </section>

            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {d.socialTitle}
              </span>

              <div className="flex items-center gap-4">
                {[
                  {
                    url: content.facebookUrl,
                    src: "/icons/facebook.svg",
                    label: "Facebook",
                  },
                  {
                    url: content.instagramUrl,
                    src: "/icons/instagram.svg",
                    label: "Instagram",
                  },
                  {
                    url: content.youtubeUrl,
                    src: "/icons/youtube.svg",
                    label: "YouTube",
                  },
                  {
                    url: content.xUrl,
                    src: "/icons/x.svg",
                    label: "X",
                  },
                  {
                    url: content.tiktokUrl,
                    src: "/icons/tiktok.svg",
                    label: d.socialTikTokLabel,
                  },
                ]
                  .filter((s) => s.url)
                  .map((s) => (
                    <Link
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="p-2 rounded-lg border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-foreground active:scale-95 flex items-center justify-center"
                    >
                      <div
                        className="h-5 w-5 bg-current"
                        style={{
                          maskImage: `url(${s.src})`,
                          WebkitMaskImage: `url(${s.src})`,
                          maskSize: "contain",
                          WebkitMaskSize: "contain",
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                          WebkitMaskPosition: "center",
                        }}
                      />
                    </Link>
                  ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
