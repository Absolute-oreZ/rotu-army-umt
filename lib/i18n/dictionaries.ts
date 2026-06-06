import type { Locale } from "./config";

export type Dictionary = {
  metadata: {
    siteName: string;
    title: string;
    description: string;
  };
  navigation: {
    about: string;
    intakes: string;
    stories: string;
    contact: string;
  };
  common: {
    language: string;
    theme: string;
    light: string;
    dark: string;
    menu: string;
    closeMenu: string;
    switchToLight: string;
    switchToDark: string;
    primaryNavigation: string;
  };
  home: {
    title: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    heroImageAlt: string;
    statsTitle: string;
    statsIntro: string;
    intakeCountLabel: string;
    officerCountLabel: string;
    instructorCountLabel: string;
    cadetCountLabel: string;
    faqTitle: string;
    faqIntro: string;
    faqEmpty: string;
    seeAlsoTitle: string;
    seeAlsoIntro: string;
    seeAlsoEmpty: string;
    seeAlsoExplore: string;
    testimonials: {
      title: string;
      intro: string;
    };
    joinTheRanks: {
      eyebrow: string;
      title: string;
      intro: string;
      steps: {
        title: string;
        description: string;
      }[];
    };
  };
  intakesPage: {
    title: string;
    description: string;
    intakeNoLabel: string;
    summaryFallback: string;
    taglineFallback: string;
    viewDetails: string;
    cardImageAlt: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyActionLabel: string;
  };
  intakeDetailPage: {
    detailEyebrow: string;
    startYearLabel: string;
    galleryTitle: string;
    galleryIntro: string;
    patchTitle: string;
    patchIntro: string;
    cadetsTitle: string;
    cadetsIntro: string;
    noGalleryPhotos: string;
    noPatchExplanations: string;
    noCadets: string;
    quoteFallback: string;
    uniformTitle: string;
    uniformIntro: string;
    innerLabel: string;
    tshirtLabel: string;
    noUniformPhotos: string;
    summaryTab: string;
    patchTab: string;
    uniformTab: string;
    patchLanguagesTitle: string;
  };
  storiesPage: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyActionLabel: string;
  };
  storyDetailPage: {
    backLabel: string;
    detailLabel: string;
    dateLabel: string;
    locationLabel: string;
    participantsLabel: string;
    tagsLabel: string;
    galleryTitle: string;
    galleryIntro: string;
    noGalleryPhotos: string;
    watchVideo: string;
    noPhotos: string;
    similarStoriesLabel: string;
  };
  storyTagPage: {
    backLabel: string;
    archiveLabel: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyActionLabel: string;
  };
  contactPage: {
    eyebrow: string;
    title: string;
    description: string;
    newsletterTitle: string;
    newsletterSubTitle: string;
    newsletterDescription: string;
    newsletterEmailLabel: string;
    newsletterEmailPlaceholder: string;
    newsletterLoadingLabel: string;
    newsletterLocaleLabel: string;
    newsletterLocaleOptions: {
      en: string;
      ms: string;
      zh: string;
      ta: string;
    };
    newsletterSubscribeButton: string;
    newsletterErrorMessage: string;
    newsletterRequiredError: string;
    newsletterInvalidEmailError: string;
    newsletterDuplicateError: string;
    newsletterSendFailedError: string;
    newsletterSuccess: string;
    socialTitle: string;
    socialTikTokLabel: string;
    locationTitle: string;
  };
  newsletter: {
    emailSubject: string;
    emailGreeting: string;
    emailIntro: string;
    emailButton: string;
    emailFallback: string;
    emailFooter: string;
    emailUnsubscribeLabel: string;
    confirmationPageEyebrow: string;
    confirmationPageTitle: string;
    confirmationPageSuccessTitle: string;
    confirmationPageSuccessDescription: string;
    confirmationPageAlreadyTitle: string;
    confirmationPageAlreadyDescription: string;
    confirmationPageInvalidTitle: string;
    confirmationPageInvalidDescription: string;
    unsubscribePageEyebrow: string;
    unsubscribePageTitle: string;
    unsubscribePageSuccessTitle: string;
    unsubscribePageSuccessDescription: string;
    unsubscribePageAlreadyTitle: string;
    unsubscribePageAlreadyDescription: string;
    unsubscribePageInvalidTitle: string;
    unsubscribePageInvalidDescription: string;
    backToSiteLabel: string;
  };
  notFoundPage: {
    eyebrow: string;
    title: string;
    description: string;
    backHomeLabel: string;
    imageAlt: string;
  };
};

const dictionaries = {
  en: () => import("./dictionaries/en").then((module) => module.default),
  ms: () => import("./dictionaries/ms").then((module) => module.default),
  zh: () => import("./dictionaries/zh").then((module) => module.default),
  ta: () => import("./dictionaries/ta").then((module) => module.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
