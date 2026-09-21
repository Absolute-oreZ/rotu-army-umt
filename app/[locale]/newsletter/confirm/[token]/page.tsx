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
      showForm: false,
    },
    already_confirmed: {
      statusDescription: newsletter.confirmationPageAlreadyDescription,
      statusTitle: newsletter.confirmationPageAlreadyTitle,
      showForm: false,
    },
    pending_confirmation: {
      statusDescription: "Click the button below to confirm your subscription.",
      statusTitle: "Confirm your subscription",
      showForm: true,
    },
    invalid: {
      statusDescription: newsletter.confirmationPageInvalidDescription,
      statusTitle: newsletter.confirmationPageInvalidTitle,
      showForm: false,
    },
  } as const;

  const content = contentByStatus[result] ?? contentByStatus.invalid;

  return (
    <NewsletterStatusPage
      actionHref={`/${locale}/newsletter/confirm/${token}`}
      actionLabel={content.showForm ? "Confirm subscription" : newsletter.backToSiteLabel}
      eyebrow={newsletter.confirmationPageEyebrow}
      imageSrc="/images/subscribe-newsletter.png"
      imageAlt="Newsletter subscription confirmed"
      statusDescription={content.statusDescription}
      statusTitle={content.statusTitle}
      title={newsletter.confirmationPageTitle}
      showForm={content.showForm}
    />
  );
}