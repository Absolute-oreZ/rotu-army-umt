import { type Locale } from "@/lib/i18n/config";

export type ErrorStrings = {
  title: string;
  description: string;
  tryAgain: string;
  goHome: string;
};

export const errorStrings: Record<Locale, ErrorStrings> = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    tryAgain: "Try again",
    goHome: "Go home",
  },
  ms: {
    title: "Ada masalah berlaku",
    description: "Ralat tidak dijangka berlaku. Sila cuba lagi.",
    tryAgain: "Cuba lagi",
    goHome: "Kembali ke laman utama",
  },
  zh: {
    title: "出现错误",
    description: "发生意外错误，请重试。",
    tryAgain: "重试",
    goHome: "返回首页",
  },
  ta: {
    title: "ஏதோ தவறு நடந்துள்ளது",
    description: "எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    tryAgain: "மீண்டும் முயற்சிக்கவும்",
    goHome: "முகப்புக்கு செல்ல",
  },
};
