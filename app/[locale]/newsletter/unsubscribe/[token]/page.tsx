import type { Metadata } from "next";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNewsletterUnsubscribeStatus, unsubscribeNewsletterSubscriptionFormAction } from "@/lib/newsletter";
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

  const status = await getNewsletterUnsubscribeStatus(token);
  const result = status.status;

  const contentByStatus = {
    already_unsubscribed: {
      statusDescription: newsletter.unsubscribePageAlreadyDescription,
      statusTitle: newsletter.unsubscribePageAlreadyTitle,
      showForm: false,
    },
    pending_unsubscribe: {
      statusDescription: "Click the button below to unsubscribe from our newsletter.",
      statusTitle: "Unsubscribe from newsletter",
      showForm: true,
    },
    unsubscribed: {
      statusDescription: newsletter.unsubscribePageSuccessDescription,
      statusTitle: newsletter.unsubscribePageSuccessTitle,
      showForm: false,
    },
    invalid: {
      statusDescription: newsletter.unsubscribePageInvalidDescription,
      statusTitle: newsletter.unsubscribePageInvalidTitle,
      showForm: false,
    },
  } as const;

  const content = contentByStatus[result] ?? contentByStatus.invalid;

  return (
    <NewsletterStatusPage
      actionHref={content.showForm ? `/${locale}/newsletter/unsubscribe/${token}` : undefined}
      actionLabel={content.showForm ? "Unsubscribe" : newsletter.backToSiteLabel}
      eyebrow={newsletter.unsubscribePageEyebrow}
      imageSrc="/images/unsubscribe-newsletter.png"
      imageAlt="Newsletter unsubscribe"
      statusDescription={content.statusDescription}
      statusTitle={content.statusTitle}
      title={newsletter.unsubscribePageTitle}
      showForm={content.showForm}
      formAction={content.showForm ? unsubscribeNewsletterSubscriptionFormAction : undefined}
      formToken={content.showForm ? token : null}
    />
  );
}