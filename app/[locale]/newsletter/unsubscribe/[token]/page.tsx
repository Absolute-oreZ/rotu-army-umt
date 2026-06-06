import type { Metadata } from "next";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { unsubscribeNewsletterSubscription } from "@/lib/newsletter";
import { NewsletterStatusPage } from "@/components/public/newsletter-status-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params as { locale: Locale; token: string };

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.newsletter.unsubscribePageTitle,
    robots: {
      follow: false,
      index: false,
    },
  };
}

export default async function NewsletterUnsubscribePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params as { locale: Locale; token: string };

  const dictionary = await getDictionary(locale);
  const newsletter = dictionary.newsletter;
  const result = await unsubscribeNewsletterSubscription(token);

  const contentByStatus = {
    already_unsubscribed: {
      statusDescription: newsletter.unsubscribePageAlreadyDescription,
      statusTitle: newsletter.unsubscribePageAlreadyTitle,
    },
    invalid: {
      statusDescription: newsletter.unsubscribePageInvalidDescription,
      statusTitle: newsletter.unsubscribePageInvalidTitle,
    },
    unsubscribed: {
      statusDescription: newsletter.unsubscribePageSuccessDescription,
      statusTitle: newsletter.unsubscribePageSuccessTitle,
    },
  } as const;

  const content = contentByStatus[result];

  return (
    <NewsletterStatusPage
      actionHref={`/${locale}`}
      actionLabel={newsletter.backToSiteLabel}
      eyebrow={newsletter.unsubscribePageEyebrow}
      imageSrc="/images/unsubscribe-newsletter.png"
      imageAlt="Newsletter unsubscribe"
      statusDescription={content.statusDescription}
      statusTitle={content.statusTitle}
      title={newsletter.unsubscribePageTitle}
    />
  );
}