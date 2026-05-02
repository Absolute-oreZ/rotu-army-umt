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
    eyebrow: string;
    title: string;
    intro: string;
  };
};

const en: Dictionary = {
  metadata: {
    siteName: "ROTU ARMY UMT",
    title: "ROTU ARMY UMT",
    description:
      "Official web experience for ROTU ARMY UMT, PALAPES Darat Universiti Malaysia Terengganu.",
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
    eyebrow: "PALAPES Darat UMT",
    title: "ROTU Army UMT",
    intro:
      "A disciplined university training community built around leadership, service, resilience, and field experience.",
  },
};

export default en;
