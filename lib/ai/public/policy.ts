import type { Locale } from "@/lib/i18n/config";
export { isAllowedOfficialUrl } from "@/lib/ai/public/web-policy";

export { OFFICIAL_WEB_DOMAINS } from "@/lib/ai/public/web-policy";

const PRIVATE_PATTERNS = [
  /\b(my|another|other|this)\s+(cadet'?s?\s+)?(ic|identity card|phone|email|address|cgpa|gpa|result|payment|bank account|attendance|health|application status)\b/i,
  /\b(army number|matric number|student id|personal record|private data)\b/i,
  /\b(nombor ic|kad pengenalan|nombor telefon|emel peribadi|alamat rumah|keputusan akademik|status permohonan|bayaran kadet)\b/i,
  /(?:身份证|身份号码|电话号码|住址|个人资料|成绩|付款记录|申请状态)/u,
  /(?:அடையாள அட்டை|தொலைபேசி எண்|தனிப்பட்ட தகவல்|மதிப்பெண்|கட்டண விவரம்|விண்ணப்ப நிலை)/u,
];

const HARMFUL_OPERATIONAL_PATTERNS = [
  /\b(how to|steps to|instructions for).{0,40}\b(operate|fire|aim|maintain|assemble)\b.{0,30}\b(weapon|rifle|firearm)\b/i,
  /\b(tactical|operational)\s+(weapons?|deployment|firing)\s+(procedure|instruction|manual)/i,
];

const CURRENT_PATTERNS = [
  /\b(current|currently|latest|today|this year|this intake|deadline|closing date|open now|upcoming|schedule|when is|202[0-9])\b/i,
  /\b(semasa|terkini|tahun ini|pengambilan ini|tarikh tutup|jadual|akan datang|dibuka sekarang)\b/i,
  /(?:目前|最新|今年|本届|截止日期|时间表|即将举行)/u,
  /(?:தற்போதைய|சமீபத்திய|இந்த ஆண்டு|இந்த சேர்க்கை|கடைசி தேதி|அட்டவணை|விரைவில்)/u,
];

export type PublicIntent =
  | "PRIVATE_INFORMATION"
  | "HIGH_RISK"
  | "ROTU_UMT"
  | "MALAYSIAN_MILITARY"
  | "MIXED_ALLOWED"
  | "OUT_OF_SCOPE";

export function classifyPublicIntent(question: string): PublicIntent {
  if (PRIVATE_PATTERNS.some((pattern) => pattern.test(question)))
    return "PRIVATE_INFORMATION";
  if (HARMFUL_OPERATIONAL_PATTERNS.some((pattern) => pattern.test(question)))
    return "HIGH_RISK";
  const rotu =
    /\b(rotu|palapes|umt|cadet|cadets|intake|joining|training|programme|program)\b/i.test(
      question,
    );
  const military =
    /\b(malaysian army|armed forces|military|tentera|angkatan tentera|tentera darat|tentera laut|tentera udara)\b/i.test(
      question,
    ) ||
    /(?:马来西亚军队|武装部队|军队|மலேசிய இராணுவம்|ஆயுதப்படை|இராணுவம்)/u.test(
      question,
    );
  if (rotu && military) return "MIXED_ALLOWED";
  if (rotu) return "ROTU_UMT";
  if (military) return "MALAYSIAN_MILITARY";
  return "OUT_OF_SCOPE";
}

export function needsCurrentWebEvidence(question: string) {
  return CURRENT_PATTERNS.some((pattern) => pattern.test(question));
}

export function refusalFor(locale: Locale, intent: PublicIntent) {
  if (intent === "PRIVATE_INFORMATION") {
    return {
      en: "I can only help with public ROTU Army UMT information. I can’t access or disclose anyone’s private cadet, application, academic, health, attendance, or payment information.",
      ms: "Saya hanya boleh membantu dengan maklumat ROTU Army UMT yang diterbitkan secara umum. Saya tidak boleh mengakses atau mendedahkan maklumat peribadi kadet, permohonan, akademik, kesihatan, kehadiran atau bayaran.",
      zh: "我只能协助查询已公开的 ROTU Army UMT 信息，无法访问或披露任何学员的私人资料、申请、学业、健康、出勤或付款信息。",
      ta: "பொதுவாக வெளியிடப்பட்ட ROTU Army UMT தகவல்களில் மட்டுமே உதவ முடியும். எந்தவொரு கேடட்டின் தனிப்பட்ட, விண்ணப்ப, கல்வி, சுகாதார, வருகை அல்லது கட்டணத் தகவலையும் அணுகவோ வெளியிடவோ முடியாது.",
    }[locale];
  }
  if (intent === "HIGH_RISK") {
    return {
      en: "I can discuss public ROTU Army UMT information at a general level, but I can’t provide detailed weapon operation or tactical instructions.",
      ms: "Saya boleh menerangkan maklumat umum ROTU Army UMT yang diterbitkan, tetapi tidak boleh memberikan arahan terperinci tentang penggunaan senjata atau taktik.",
      zh: "我可以介绍已公开的 ROTU Army UMT 一般信息，但不能提供武器操作或战术方面的详细指示。",
      ta: "பொதுவான ROTU Army UMT தகவலை விளக்க முடியும்; ஆயுதச் செயல்பாடு அல்லது தந்திரோபாயங்கள் குறித்த விரிவான வழிமுறைகளை வழங்க முடியாது.",
    }[locale];
  }
  return null;
}

export function noEvidenceReply(locale: Locale) {
  return {
    en: "I couldn’t find enough published information to answer that reliably. Please check the current official ROTU Army UMT notice or contact the programme team.",
    ms: "Saya tidak menemui maklumat terbitan yang mencukupi untuk menjawab dengan yakin. Sila rujuk notis rasmi ROTU Army UMT yang terkini atau hubungi pihak program.",
    zh: "我没有找到足够的已发布资料来可靠地回答。请查阅 ROTU Army UMT 最新官方通知，或联系项目团队。",
    ta: "நம்பகமாக பதிலளிக்க போதுமான வெளியிடப்பட்ட தகவல் கிடைக்கவில்லை. தற்போதைய ROTU Army UMT அதிகாரப்பூர்வ அறிவிப்பைப் பார்க்கவும் அல்லது திட்டக் குழுவைத் தொடர்பு கொள்ளவும்.",
  }[locale];
}
