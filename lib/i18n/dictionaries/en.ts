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
  };
  home: {
    eyebrow: string;
    title: string;
    intro: string;
  };
};

const en: Dictionary = {
  metadata: {
    siteName: "ROTU Army UMT",
    title: "ROTU Army UMT",
    description:
      "Official web experience for ROTU Army UMT, PALAPES Darat Universiti Malaysia Terengganu.",
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
  },
  home: {
    eyebrow: "PALAPES Darat UMT",
    title: "ROTU Army UMT",
    intro:
      "A disciplined university training community built around leadership, service, resilience, and field experience.",
  },
};

export default en;
