import type { Metadata } from "next";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { confirmNewsletterSubscription } from "@/lib/newsletter";
import { NewsletterStatusPage } from "@/components/public/newsletter-status-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params as { locale: Locale; token: string };

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.newsletter.confirmationPageTitle,
    robots: {
      follow: false,
      index: false,
    },
  };
}

export default async function NewsletterConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params as { locale: Locale; token: string };

  const dictionary = await getDictionary(locale);
  const newsletter = dictionary.newsletter;
  const result = await confirmNewsletterSubscription(token);

  const contentByStatus = {
    confirmed: {
      statusDescription: newsletter.confirmationPageSuccessDescription,
      statusTitle: newsletter.confirmationPageSuccessTitle,
    },
    already_confirmed: {
      statusDescription: newsletter.confirmationPageAlreadyDescription,
      statusTitle: newsletter.confirmationPageAlreadyTitle,
    },
    invalid: {
      statusDescription: newsletter.confirmationPageInvalidDescription,
      statusTitle: newsletter.confirmationPageInvalidTitle,
    },
  } as const;

  const content = contentByStatus[result];

  return (
    <NewsletterStatusPage
      actionHref={`/${locale}`}
      actionLabel={newsletter.backToSiteLabel}
      eyebrow={newsletter.confirmationPageEyebrow}
      imageSrc="/images/subscribe-newsletter.png"
      imageAlt="Newsletter subscription confirmed"
      statusDescription={content.statusDescription}
      statusTitle={content.statusTitle}
      title={newsletter.confirmationPageTitle}
    />
  );
}