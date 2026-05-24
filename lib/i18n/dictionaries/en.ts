export type Dictionary = {
  metadata: {
    siteName: string;
    title: string;
    description: string;
  };
  navigation: {
    about: string;
    intakes: string;
    events: string;
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
    eyebrow: string;
    intro: string;
    intakeNoLabel: string;
    summaryFallback: string;
    taglineFallback: string;
    viewDetails: string;
    cardImageAlt: string;
    emptyTitle: string;
    emptyDescription: string;
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
};

const en: Dictionary = {
  metadata: {
    siteName: "ROTU ARMY UMT",
    title: "ROTU ARMY UMT",
    description: "Official web experience for ROTU ARMY UMT, PALAPES Darat Universiti Malaysia Terengganu.",
  },
  navigation: {
    about: "About Us",
    intakes: "Our Intakes",
    events: "Our Stories",
    contact: "Contact Us",
  },
  common: {
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    menu: "Menu",
    closeMenu: "Close menu",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    primaryNavigation: "Primary navigation",
  },
  home: {
    title: "ROTU Army UMT",
    intro: "A disciplined university training community built around leadership, service, resilience, and field experience.",
    primaryCta: "Explore intakes",
    secondaryCta: "Contact us",
    heroImageAlt: "ROTU Army UMT visual placeholder",
    statsTitle: "Strength at a glance",
    statsIntro: "Live figures from current ROTU Army UMT records.",
    intakeCountLabel: "Intakes",
    officerCountLabel: "Officers",
    instructorCountLabel: "Instructors",
    cadetCountLabel: "Cadets",
    faqTitle: "Frequently asked questions",
    faqIntro: "Key answers for students considering ROTU/PALAPES.",
    faqEmpty: "FAQ content is not available yet.",
    seeAlsoTitle: "See also",
    seeAlsoIntro: "Related Malaysian Armed Forces references.",
    seeAlsoEmpty: "See-also links are not available yet.",
    seeAlsoExplore: "Explore more",
    testimonials: {
      title: "Voices of Experience",
      intro: "Hear from the cadets and officers who have walked the path.",
    },
    joinTheRanks: {
      eyebrow: "Simple Process",
      title: "Join the Ranks",
      intro: "Your journey to leadership and discipline starts here. Follow these steps to become a part of ROTU Army UMT.",
      steps: [
        {
          title: "Online Application",
          description: "Submit your biodata and initial documents through our official portal.",
        },
        {
          title: "Document Review",
          description: "Our administration verifies your academic and personal records.",
        },
        {
          title: "Physical Assessment",
          description: "Undergo BMI checks and physical fitness tests to ensure readiness.",
        },
        {
          title: "Final Selection",
          description: "Complete the final interview and finalize your enrollment.",
        },
      ],
    },
  },
  intakesPage: {
    title: "Our Intakes",
    description: "Explore ROTU Army UMT intakes, each with its own identity, training character, and intake story.",
    eyebrow: "Intake Directory",
    intro: "Each intake reflects a distinct training cycle. Explore the currently published intakes and continue to individual details.",
    intakeNoLabel: "Intake",
    summaryFallback: "Detailed summary for this intake will be published soon.",
    taglineFallback: "Training cycle information in progress.",
    viewDetails: "View details",
    cardImageAlt: "Intake visual",
    emptyTitle: "No published intakes yet",
    emptyDescription: "Published intake records will appear here once they are made available by the team.",
  },
  intakeDetailPage: {
    detailEyebrow: "Intake Detail",
    startYearLabel: "Start year",
    galleryTitle: "Intake gallery",
    galleryIntro: "Visual records associated with this intake.",
    patchTitle: "Patch explanations",
    patchIntro: "Meaning behind the intake patch and symbols.",
    cadetsTitle: "Active cadets",
    cadetsIntro: "Cadets currently linked to this intake.",
    noGalleryPhotos: "No gallery photos have been published yet.",
    noPatchExplanations: "Patch explanations are not available yet.",
    noCadets: "No active cadets have been published yet.",
    quoteFallback: "Quote not available yet.",
    uniformTitle: "Uniform visuals",
    uniformIntro: "Inner and tshirt visuals linked to this intake.",
    innerLabel: "Inner",
    tshirtLabel: "T-shirt",
    noUniformPhotos: "Uniform visuals are not available yet.",
    summaryTab: "Summary",
    patchTab: "Patch",
    uniformTab: "Inner & Tshirt",
    patchLanguagesTitle: "Patch explanations",
  },
};

export default en;