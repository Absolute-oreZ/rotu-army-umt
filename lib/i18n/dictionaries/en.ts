import type { Dictionary } from "../dictionaries";

const en: Dictionary = {
  metadata: {
    siteName: "ROTU Army UMT",
    title: "ROTU Army UMT",
    description:
      "The official website of ROTU Army UMT, PALAPES Darat, Universiti Malaysia Terengganu.",
  },
  navigation: {
    about: "About Us",
    intakes: "Our Intakes",
    stories: "Our Stories",
    contact: "Contact Us",
  },
  common: {
    skipToContent: "Skip to main content",
    language: "Language",
    theme: "Theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    menu: "Menu",
    closeMenu: "Close menu",
    primaryNavigation: "Primary navigation",
    viewStory: "View story",
    externalLink: "Opens in a new tab",
  },
  recordMarkers: {
    home: "About Us / field record 01",
    intakes: "Public record / intakes",
    stories: "Public record / stories",
    intakesRegister: "Published register",
    storiesIndex: "Archive index",
    storyYears: "Jump to a year",
    recordsCountOne: "{count} record",
    recordsCountOther: "{count} records",
  },
  home: {
    title: "ROTU Army UMT",
    intro: "A disciplined university training community built around leadership, service, resilience, and field experience.",
    primaryCta: "Explore intakes",
    secondaryCta: "Contact us",
    heroImageAlt: "ROTU Army UMT members on a training field",
    statsTitle: "Strength at a glance",
    statsIntro: "Current figures from ROTU Army UMT records.",
    intakeCountLabel: "Intakes",
    officerCountLabel: "Officers",
    instructorCountLabel: "Instructors",
    cadetCountLabel: "Cadets",
    faqTitle: "Frequently asked questions",
    faqIntro: "Key answers for students considering ROTU/PALAPES.",
    faqEmpty: "No questions have been published yet. Please check back later.",
    seeAlsoTitle: "See also",
    seeAlsoIntro: "Related Malaysian Armed Forces references.",
    seeAlsoEmpty: "No related links have been published yet.",
    bestCadets: {
      eyebrow: "Honours register",
      title: "Best Cadets",
      intro:
        "A record of the cadets recognised for this distinction, and the experiences behind the recognition.",
      registerLabel: "More recipients",
      quoteLabel: "In their own words",
      exploreMore: "Read the related story",
      exploreMoreLabel: "Read the related story for {name}",
      portraitAlt: "Portrait of {name}",
      intakeLabel: "Intake",
    },
    joinTheRanks: {
      eyebrow: "Simple process",
      title: "Join the Ranks",
      intro:
        "Your journey to leadership and discipline starts here. Follow these steps to become a part of ROTU Army UMT.",
      stepAlt: "Illustration for step {number}: {title}",
      steps: [
        {
          title: "Online Application",
          description:
            "Submit your biodata and initial documents through our official portal.",
        },
        {
          title: "Document Review",
          description:
            "Our administration verifies your academic and personal records.",
        },
        {
          title: "Physical Assessment",
          description:
            "Undergo BMI checks and physical fitness tests to ensure readiness.",
        },
        {
          title: "Final Selection",
          description:
            "Complete the final interview and finalise your enrolment.",
        },
      ],
    },
  },
  intakesPage: {
    title: "Our Intakes",
    description:
      "Explore ROTU Army UMT intakes, each with its own identity, training character, and intake story.",
    intakeNoLabel: "Intake",
    summaryFallback: "A detailed summary for this intake will be published soon.",
    taglineFallback: "Training cycle information in progress.",
    viewDetails: "View details",
    coverImageAlt: "Cover photo of {intake}",
    emptyTitle: "No published intakes yet",
    emptyDescription:
      "Published intake records will appear here as soon as the team releases them.",
    emptyActionLabel: "Back to home",
  },
  intakeDetailPage: {
    detailEyebrow: "Intake detail",
    cadetsTitle: "Active cadets",
    noGalleryPhotos: "No photos have been published for this intake yet.",
    noPatchExplanations: "Patch explanations are not available yet.",
    noCadets: "No active cadets have been published for this intake yet.",
    quoteFallback: "No quote provided.",
    noUniformPhotos: "Uniform visuals are not available yet.",
    innerLabel: "Inner",
    tshirtLabel: "T-shirt",
    summaryTab: "Summary",
    patchTab: "Patch",
    uniformTab: "Inner & T-shirt",
    patchLabels: {
      ANIMAL: "Animal",
      COLOR: "Colour",
      PHILOSOPHY: "Philosophy",
    },
    alt: {
      displayPhoto: "Display photo {number} of {intake}",
      patch: "Patch of {intake}",
      cover: "Cover photo of {intake}",
      expanded: "Enlarged display photo of {intake}",
      uniform: "{intake} {item}",
    },
  },
  storiesPage: {
    title: "Our Stories",
    description:
      "Browse published ROTU Army UMT stories by year and open each one to read the full record.",
    emptyTitle: "No published stories yet",
    emptyDescription:
      "Published stories will appear here as soon as the team releases them.",
    emptyActionLabel: "Back to home",
  },
  storyDetailPage: {
    backLabel: "Back to stories",
    detailLabel: "Story detail",
    dateLabel: "Date",
    locationLabel: "Location",
    participantsLabel: "Participants",
    tagsLabel: "Tags",
    watchVideo: "Watch video",
    closeVideoLabel: "Close video",
    similarStoriesLabel: "Related stories",
    carousel: {
      label: "Photo gallery",
      goToPhoto: "Go to photo {number}",
    },
  },
  storyTagPage: {
    backLabel: "Back to stories",
    archiveLabel: "Tag archive",
    description: "Browse published ROTU Army UMT stories filed under this tag.",
    emptyTitle: "No related stories yet",
    emptyDescription:
      "Published stories for this tag will appear here as soon as they are available.",
    emptyActionLabel: "Back to all stories",
  },
  contactPage: {
    eyebrow: "Get in touch",
    title: "We are here to help",
    description:
      "Not sure who to ask? Browse the reasons below to find the right team, or reach us directly through our official channels.",
    social: {
      title: "Follow us",
      tiktokLabel: "TikTok",
    },
    location: {
      title: "Find us",
      mapTitle: "Map showing the ROTU Army UMT location",
    },
    newsletter: {
      title: "Official updates",
      subtitle: "Newsletter",
      description:
        "Receive announcements about intakes, training, and activities. Confirm your subscription by email to start receiving them.",
      emailLabel: "Email address",
      emailPlaceholder: "email@example.com",
      loadingLabel: "Sending…",
      languageLabel: "Preferred language",
      languageOptions: {
        en: "English",
        ms: "Bahasa Melayu",
        zh: "Chinese",
        ta: "Tamil",
      },
      submitLabel: "Subscribe",
      success: "Almost there — check your inbox to confirm your subscription.",
      errorUnexpected: "Something went wrong. Please try again.",
      errorRequired: "Enter your email address to subscribe.",
      errorInvalidEmail:
        "Enter a valid email address, for example name@example.com.",
      errorDuplicate: "This email address is already subscribed to our newsletter.",
      errorRateLimited:
        "Too many subscription attempts. Please wait a few minutes and try again.",
      errorUnavailable:
        "We cannot accept subscriptions right now. Please try again later.",
      errorSecurityFailed: "Security check failed. Please try again.",
      errorSecurityNotReady:
        "Security check is still loading. Please wait a moment and try again.",
      errorSendFailed:
        "We could not send the confirmation email right now. Please try again.",
    },
  },
  newsletter: {
    emailSubject: "Confirm your ROTU Army UMT subscription",
    emailGreeting: "Hello from ROTU Army UMT,",
    emailIntro: "Thank you for joining our newsletter. Confirm your subscription to start receiving official updates and announcements.",
    emailButton: "Confirm subscription",
    emailFallback: "If the button does not work, copy this link:",
    emailFooter: "If you did not request this subscription, you can ignore this email.",
    emailUnsubscribeLabel: "Unsubscribe",
    confirmationPageEyebrow: "Newsletter",
    confirmationPageTitle: "Confirm your subscription",
    confirmationPageSuccessTitle: "Subscription confirmed",
    confirmationPageSuccessDescription:
      "Your newsletter subscription is now active.",
    confirmationPageAlreadyTitle: "Subscription already confirmed",
    confirmationPageAlreadyDescription:
      "This confirmation link has already been used, and your subscription is already active.",
    confirmationPagePendingTitle: "Confirm your subscription",
    confirmationPagePendingDescription:
      "Select the button below to confirm your subscription and start receiving official updates.",
    confirmationPageInvalidTitle: "Confirmation link is invalid",
    confirmationPageInvalidDescription:
      "This confirmation link is invalid or has expired. If you are not subscribed yet, request a new confirmation email from the contact page.",
    confirmationPageActionLabel: "Confirm subscription",
    confirmationPageImageAlt: "Newsletter subscription illustration",
    unsubscribePageEyebrow: "Newsletter",
    unsubscribePageTitle: "Unsubscribe from the newsletter",
    unsubscribePageSuccessTitle: "Unsubscribe confirmed",
    unsubscribePageSuccessDescription:
      "You will no longer receive newsletter updates from ROTU Army UMT.",
    unsubscribePageAlreadyTitle: "You are already unsubscribed",
    unsubscribePageAlreadyDescription:
      "This unsubscribe link has already been used.",
    unsubscribePagePendingTitle: "Unsubscribe from the newsletter",
    unsubscribePagePendingDescription:
      "Select the button below to stop receiving newsletter updates from ROTU Army UMT.",
    unsubscribePageInvalidTitle: "Unsubscribe link is invalid",
    unsubscribePageInvalidDescription:
      "This unsubscribe link is invalid or has expired.",
    unsubscribePageActionLabel: "Unsubscribe",
    unsubscribePageImageAlt: "Newsletter unsubscribe illustration",
    backToSiteLabel: "Back to home",
  },
  notFoundPage: {
    eyebrow: "404",
    title: "Page not found",
    description: "The page you are looking for does not exist or has been moved.",
    backHomeLabel: "Back to home",
    imageAlt: "Page not found illustration",
  },
};

export default en;
