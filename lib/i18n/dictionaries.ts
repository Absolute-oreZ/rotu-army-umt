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
    skipToContent: string;
    language: string;
    theme: string;
    switchToLight: string;
    switchToDark: string;
    menu: string;
    closeMenu: string;
    primaryNavigation: string;
    viewStory: string;
    externalLink: string;
  };
  recordMarkers: {
    home: string;
    intakes: string;
    stories: string;
    intakesRegister: string;
    storiesIndex: string;
    storyYears: string;
    recordsCountOne: string;
    recordsCountOther: string;
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
    bestCadets: {
      eyebrow: string;
      title: string;
      intro: string;
      registerLabel: string;
      quoteLabel: string;
      exploreMore: string;
      exploreMoreLabel: string;
      portraitAlt: string;
      intakeLabel: string;
    };
    joinTheRanks: {
      eyebrow: string;
      title: string;
      intro: string;
      stepAlt: string;
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
    coverImageAlt: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyActionLabel: string;
  };
  intakeDetailPage: {
    detailEyebrow: string;
    cadetsTitle: string;
    noGalleryPhotos: string;
    noPatchExplanations: string;
    noCadets: string;
    quoteFallback: string;
    noUniformPhotos: string;
    innerLabel: string;
    tshirtLabel: string;
    summaryTab: string;
    patchTab: string;
    uniformTab: string;
    patchLabels: {
      ANIMAL: string;
      COLOR: string;
      PHILOSOPHY: string;
    };
    alt: {
      displayPhoto: string;
      patch: string;
      cover: string;
      expanded: string;
      uniform: string;
    };
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
    watchVideo: string;
    closeVideoLabel: string;
    similarStoriesLabel: string;
    carousel: {
      label: string;
      goToPhoto: string;
    };
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
    social: {
      title: string;
      tiktokLabel: string;
    };
    location: {
      title: string;
      mapTitle: string;
    };
    newsletter: {
      title: string;
      subtitle: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      loadingLabel: string;
      languageLabel: string;
      languageOptions: {
        en: string;
        ms: string;
        zh: string;
        ta: string;
      };
      submitLabel: string;
      success: string;
      errorUnexpected: string;
      errorRequired: string;
      errorInvalidEmail: string;
      errorDuplicate: string;
      errorRateLimited: string;
      errorUnavailable: string;
      errorSecurityFailed: string;
      errorSecurityNotReady: string;
      errorSendFailed: string;
    };
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
    confirmationPagePendingTitle: string;
    confirmationPagePendingDescription: string;
    confirmationPageInvalidTitle: string;
    confirmationPageInvalidDescription: string;
    confirmationPageActionLabel: string;
    confirmationPageImageAlt: string;
    unsubscribePageEyebrow: string;
    unsubscribePageTitle: string;
    unsubscribePageSuccessTitle: string;
    unsubscribePageSuccessDescription: string;
    unsubscribePageAlreadyTitle: string;
    unsubscribePageAlreadyDescription: string;
    unsubscribePagePendingTitle: string;
    unsubscribePagePendingDescription: string;
    unsubscribePageInvalidTitle: string;
    unsubscribePageInvalidDescription: string;
    unsubscribePageActionLabel: string;
    unsubscribePageImageAlt: string;
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
