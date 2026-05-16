export const DEFAULT_HERO_IMAGE_URL = "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/hero-images/default-hero-image.jpg";
export const DEFAULT_INSTAGRAM_URL = "https://www.insztagram.com/palapesdaratumt_2019";
export const DEFAULT_FACEBOOK_URL = "https://facebook.com/palapesumt.darat";
export const DEFAULT_RED_BG_PHOTO_URL = "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/placeholder/default-red-bg.jpg";
export const DEFAULT_BLUE_BG_PHOTO_URL = "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/placeholder/default-blue-bg.jpg";
export const DEFAULT_CADET_DISPLAY_PHOTO_URL = "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/placeholder/default-display.jpg";

export const PROGRAM_TOTAL_YEARS = 3;
export const SESSIONS_PER_YEAR = 2;

export const SESSION_START_MONTH_DAY: Record<number, { month: number; day: number; yearOffset: number }> = {
  1: { month: 10, day: 1, yearOffset: 0 },
  2: { month: 4,  day: 1, yearOffset: 1 },
};

export const DEFAULT_CADET_QUOTES = [
  "Discipline builds destiny.",
  "Pressure creates leaders.",
  "Train hard, stay ready.",
  "Silence before strength.",
  "Every step counts.",
  "Leadership is earned, not given.",
  "Strength through hardship.",
  "Stay sharp, stay ready.",
  "Mind over muscle.",
  "Unity builds power.",
];

export const DEFAULT_ADMIN = {
  authUserId: "dc331c53-9100-45c2-bef2-62e48efbe238",
  email: "s65505@ocean.umt.edu.my",
  fullName: "YONG CHUN HAO",
  role: "OFFICER",
} as const;

export const DEFAULT_TESTIMONIAL_ARMY_NOS = [4001, 4002, 4003];

export const DEFAULT_TESTIMONIAL_ENTRIES = [
  {
    authorName: "Ahmad Fauzi",
    authorRank: "SJN Cadet",
    authorImageUrl: "/images/testimonials/testimonial-1.jpg",
    translations: {
      en: "Joining ROTU was the best decision of my university life. It taught me discipline and leadership like nowhere else.",
      ms: "Menyertai ROTU adalah keputusan terbaik dalam kehidupan universiti saya. Ia mengajar saya disiplin dan kepimpinan yang tidak dapat diperolehi di tempat lain.",
      zh: "加入 ROTU 是我大学生活最正确的决定。它教会了我其他地方无法学到的纪律和领导力。",
      ta: "ROTU-வில் சேர்ந்தது எனது பல்கலைக்கழக வாழ்க்கையின் சிறந்த முடிவாகும். இது எனக்கு வேறு எங்கும் கிடைக்காத ஒழுக்கத்தையும் தலைமைத்துவத்தையும் கற்றுக்கொடுத்தது。",
    },
  },
  {
    authorName: "Siti Aminah",
    authorRank: "KPL Cadet",
    authorImageUrl: "/images/testimonials/testimonial-2.jpg",
    translations: {
      en: "The physical challenges were tough, but the camaraderie and support from my peers made every moment worth it.",
      ms: "Cabaran fizikal memang sukar, tetapi semangat setiakawan dan sokongan daripada rakan sebaya menjadikan setiap saat berbaloi.",
      zh: "体能挑战虽然艰辛，但来自同伴的友谊和支持让每一刻都变得非常有意义。",
      ta: "உடல் ரீதியான சவால்கள் கடினமாக இருந்தன, ஆனால் எனது தோழமையின் ஆதரவு ஒவ்வொரு தருணத்தையும் அர்த்தமுள்ளதாக்கியது.",
    },
  },
  {
    authorName: "Wei Lun",
    authorRank: "SJN Cadet",
    authorImageUrl: "/images/testimonials/testimonial-3.jpg",
    translations: {
      en: "I've grown so much as a person. The training prepares you for the real world, not just military service.",
      ms: "Saya telah berkembang pesat sebagai seorang insan. Latihan ini menyediakan anda untuk dunia sebenar, bukan sekadar perkhidmatan tentera.",
      zh: "我在个人成长方面取得了巨大进步。这里的训练不仅是为了军队，更是为了应对现实世界的挑战。",
      ta: "ஒரு மனிதனாக நான் மிகவும் வளர்ந்திருக்கிறேன். இந்தப் பயிற்சி இராணுவ சேவைக்கு மட்டுமல்ல, நிஜ உலகிற்கு நம்மைத் தயார்படுத்துகிறது.",
    },
  },
] as const;

export const DEFAULT_FAQ_ENTRIES = [
  {
    en: {
      question: "What is ROTU/PALAPES?",
      answer:
        "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) is a Malaysian university program that trains students to become reserve officers in the Malaysian Armed Forces.",
    },
    ms: {
      question: "Apakah ROTU/PALAPES?",
      answer:
        "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) ialah program universiti di Malaysia yang melatih pelajar untuk menjadi pegawai simpanan dalam Angkatan Tentera Malaysia.",
    },
    zh: {
      question: "什么是 ROTU/PALAPES？",
      answer:
        "ROTU/PALAPES（后备军官训练队）是马来西亚的大学项目，旨在培训学生成为马来西亚武装部队的后备军官。",
    },
    ta: {
      question: "ROTU/PALAPES என்பது என்ன?",
      answer:
        "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) என்பது மலேசிய பல்கலைக்கழக திட்டமாகும்; இது மாணவர்களை மலேசிய ஆயுதப்படையின் காப்பு அதிகாரிகளாக உருவாக்க பயிற்சி அளிக்கிறது.",
    },
  },
  {
    en: {
      question: "Who is eligible to join ROTU/PALAPES?",
      answer:
        "Malaysian university students who meet age, academic, and medical requirements can apply to join ROTU/PALAPES.",
    },
    ms: {
      question: "Siapa yang layak menyertai ROTU/PALAPES?",
      answer:
        "Pelajar universiti di Malaysia yang memenuhi syarat umur, akademik, dan kesihatan boleh memohon untuk menyertai ROTU/PALAPES.",
    },
    zh: {
      question: "谁有资格加入 ROTU/PALAPES？",
      answer:
        "符合年龄、学术及体检要求的马来西亚大学生，均可申请加入 ROTU/PALAPES。",
    },
    ta: {
      question: "ROTU/PALAPES-இல் சேர யார் தகுதியானவர்?",
      answer:
        "வயது, கல்வி மற்றும் மருத்துவத் தேவைகளை பூர்த்தி செய்யும் மலேசிய பல்கலைக்கழக மாணவர்கள் ROTU/PALAPES-இல் சேர விண்ணப்பிக்கலாம்.",
    },
  },
  {
    en: {
      question: "What benefits do members get from ROTU/PALAPES?",
      answer:
        "Members receive military training, leadership skills, adventure activities, and a pathway to serve as commissioned officers after graduation.",
    },
    ms: {
      question: "Apakah manfaat yang diperoleh ahli daripada ROTU/PALAPES?",
      answer:
        "Ahli menerima latihan ketenteraan, kemahiran kepimpinan, aktiviti lasak, serta laluan untuk berkhidmat sebagai pegawai bertauliah selepas tamat pengajian.",
    },
    zh: {
      question: "成员可从 ROTU/PALAPES 获得哪些好处？",
      answer:
        "成员可获得军事训练、领导能力培养、历险活动经验，并在毕业后有机会以委任军官身份服役。",
    },
    ta: {
      question: "ROTU/PALAPES மூலம் உறுப்பினர்கள் பெறும் நன்மைகள் என்ன?",
      answer:
        "உறுப்பினர்கள் இராணுவப் பயிற்சி, தலைமைய்த்திறன், சவால் செயல்பாடுகள் மற்றும் பட்டம் பெற்ற பின் ஆணையமளிக்கப்பட்ட அதிகாரியாக சேவை செய்யும் வாய்ப்பைப் பெறுகின்றனர்.",
    },
  },
  {
    en: {
      question: "How long is the ROTU/PALAPES training program?",
      answer:
        "The training program typically lasts throughout the university course, with periodic camps and practical training sessions each year.",
    },
    ms: {
      question: "Berapa lamakah tempoh program latihan ROTU/PALAPES?",
      answer:
        "Program latihan biasanya berlangsung sepanjang tempoh pengajian universiti, dengan kem berkala dan sesi latihan praktikal setiap tahun.",
    },
    zh: {
      question: "ROTU/PALAPES 训练计划为期多久？",
      answer:
        "该训练计划通常贯穿整个大学学习阶段，并在每年安排定期营训和实操训练。",
    },
    ta: {
      question: "ROTU/PALAPES பயிற்சி திட்டம் எவ்வளவு காலம் நடைபெறும்?",
      answer:
        "இந்தப் பயிற்சி திட்டம் பொதுவாக பல்கலைக்கழக படிப்பு முழுவதும் நீடிக்கும்; ஒவ்வொரு ஆண்டும் காலகட்ட முகாம்கள் மற்றும் நடைமுறைப் பயிற்சி அமர்வுகள் இடம்பெறும்.",
    },
  },
  {
    en: {
      question: "Do ROTU/PALAPES members have a military obligation after graduation?",
      answer:
        "Yes, graduates may serve as reserve officers in the Malaysian Armed Forces, usually for a few years as per the terms of the program.",
    },
    ms: {
      question: "Adakah ahli ROTU/PALAPES mempunyai kewajipan ketenteraan selepas tamat pengajian?",
      answer:
        "Ya, graduan boleh berkhidmat sebagai pegawai simpanan dalam Angkatan Tentera Malaysia, lazimnya untuk beberapa tahun mengikut syarat program.",
    },
    zh: {
      question: "ROTU/PALAPES 成员毕业后是否有军事义务？",
      answer:
        "是的，毕业生可按项目条款在马来西亚武装部队担任后备军官，通常服务若干年。",
    },
    ta: {
      question: "ROTU/PALAPES உறுப்பினர்களுக்கு பட்டப்படிப்பு முடிந்த பின் இராணுவப் பொறுப்பு உள்ளதா?",
      answer:
        "ஆம், பட்டதாரிகள் திட்டத்தின் விதிமுறைகளின்படி மலேசிய ஆயுதப்படையின் காப்பு அதிகாரிகளாக சில ஆண்டுகள் சேவை செய்ய வேண்டி இருக்கலாம்.",
    },
  },
] as const;

export const DEFAULT_SEE_MORE_LINKS = [
  {
    title: "Angakatan Tentera Malaysia",
    link: "https://www.mafhq.mil.my/",
    imageUrl: "/images/see-also-atm.svg",
  },
  {
    title: "Tentera Udara Malaysia",
    link: "https://airforce.mil.my/",
    imageUrl: "/images/see-also-airforce.jpeg",
  },
  {
    title: "Tentera Laut Malaysia",
    link: "https://www.navy.mil.my/",
    imageUrl: "/images/see-also-navy.jpg",
  },
  {
    title: "Tentera Darat Malaysia",
    link: "https://army.mil.my/",
    imageUrl: "/images/see-also-army.jpg",
  },
] as const;

export const DEFAULT_MEMBERS = [
  // =========================
  // OFFICERS
  // =========================
  {
    name: "Ahmad Firdaus",
    rank: "MAJOR",
    email: "major.firdaus@example.com",
    armyNo: 2001,
    displayName: "Firdaus",
    gender: "MALE",
    role: "OFFICER",
    religion: "ISLAM",
    race: "MALAY",
    address: "Kuala Lumpur",
    redBgPhotoPath: DEFAULT_RED_BG_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Nur Aisyah",
    rank: "CAPTAIN",
    email: "capt.aisyah@example.com",
    armyNo: 2002,
    displayName: "Aisyah",
    gender: "FEMALE",
    role: "OFFICER",
    religion: "ISLAM",
    race: "MALAY",
    address: "Selangor",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Daniel Tan",
    rank: "LIEUTENANT",
    email: "lt.daniel@example.com",
    armyNo: 2003,
    displayName: "Daniel",
    gender: "MALE",
    role: "OFFICER",
    religion: "CHRISTIAN",
    race: "CHINESE",
    address: "Penang",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Hafiz Rahman",
    rank: "SECOND_LIEUTENANT",
    email: "2lt.hafiz@example.com",
    armyNo: 2004,
    displayName: "Hafiz",
    gender: "MALE",
    role: "OFFICER",
    religion: "ISLAM",
    race: "MALAY",
    address: "Johor",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Suresh Kumar",
    rank: "SECOND_LIEUTENANT",
    email: "2lt.suresh@example.com",
    armyNo: 2005,
    displayName: "Suresh",
    gender: "MALE",
    role: "OFFICER",
    religion: "HINDU",
    race: "INDIAN",
    address: "Perak",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Lim Jia Hui",
    rank: "SECOND_LIEUTENANT",
    email: "2lt.jiahui@example.com",
    armyNo: 2006,
    displayName: "Jia Hui",
    gender: "FEMALE",
    role: "OFFICER",
    religion: "BUDDHIST",
    race: "CHINESE",
    address: "Melaka",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },
  {
    name: "Farhana Aziz",
    rank: "SECOND_LIEUTENANT",
    email: "2lt.farhana@example.com",
    armyNo: 2007,
    displayName: "Farhana",
    gender: "FEMALE",
    role: "OFFICER",
    religion: "ISLAM",
    race: "MALAY",
    address: "Kelantan",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },

  // =========================
  // INSTRUCTORS
  // =========================
  {
    name: "Razak",
    rank: "WARRANT_OFFICER",
    email: "wo.razak@example.com",
    armyNo: 3001,
    displayName: "Razak",
    gender: "MALE",
    role: "INSTRUCTOR",
    religion: "ISLAM",
    race: "MALAY",
    address: "Negeri Sembilan",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },

  ...Array.from({ length: 3 }, (_, i) => ({
    name: ["Amirul", "Brandon Lee", "Kavin Raj"][i],
    rank: "SERGEANT",
    email: `sergeant${i + 1}@example.com`,
    armyNo: 3002 + i,
    displayName: ["Amirul", "Brandon", "Kavin"][i],
    gender: "MALE" as const,
    role: "INSTRUCTOR",
    religion: ["ISLAM", "CHRISTIAN", "HINDU"][i],
    race: ["MALAY", "CHINESE", "INDIAN"][i],
    address: ["Sabah", "Sarawak", "Perlis"][i],
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    name: ["Izzat", "Melissa Ong", "Harith"][i],
    rank: "KOPERAL",
    email: `koperal${i + 1}@example.com`,
    armyNo: 3005 + i,
    displayName: ["Izzat", "Melissa", "Harith"][i],
    gender: (i === 1 ? "FEMALE" : "MALE") as "FEMALE" | "MALE",
    role: "INSTRUCTOR",
    religion: ["ISLAM", "CHRISTIAN", "ISLAM"][i],
    race: ["MALAY", "CHINESE", "MALAY"][i],
    address: ["Kedah", "Johor", "Selangor"][i],
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    name: ["Zulhilmi", "Jason Yap", "Devi Priya"][i],
    rank: "LANS_KOPERAL",
    email: `lanskoperal${i + 1}@example.com`,
    armyNo: 3008 + i,
    displayName: ["Zulhilmi", "Jason", "Devi"][i],
    gender: (i === 2 ? "FEMALE" : "MALE") as "FEMALE" | "MALE",
    role: "INSTRUCTOR",
    religion: ["ISLAM", "BUDDHIST", "HINDU"][i],
    race: ["MALAY", "CHINESE", "INDIAN"][i],
    address: ["Terengganu", "Penang", "Perak"][i],
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  // SUO
  {
    name: "Hakimi",
    rank: "SENIOR_UNDER_OFFICER",
    email: "suo.hakimi@example.com",
    armyNo: 4001,
    displayName: "Hakimi",
    gender: "MALE",
    role: "CADET",
    religion: "ISLAM",
    race: "MALAY",
    address: "Kuala Lumpur",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  },

  // JUO
  ...Array.from({ length: 4 }, (_, i) => ({
    name: ["Sarah", "Azri", "Kavitha", "Benjamin"][i],
    rank: "JUNIOR_UNDER_OFFICER",
    email: `juo${i + 1}@example.com`,
    armyNo: 4002 + i,
    displayName: ["Sarah", "Azri", "Kavitha", "Benjamin"][i],
    gender: (i % 2 === 0 ? "FEMALE" : "MALE") as "FEMALE" | "MALE",
    role: "CADET",
    religion: ["CHRISTIAN", "ISLAM", "HINDU", "CHRISTIAN"][i],
    race: ["CHINESE", "MALAY", "INDIAN", "CHINESE"][i],
    address: ["Johor", "Selangor", "Perak", "Sabah"][i],
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  // SERGEANT CADETS
  ...Array.from({ length: 9 }, (_, i) => ({
    name: `Sergeant Cadet ${i + 1}`,
    rank: "SERGEANT_CADET",
    email: `sgtcadet${i + 1}@example.com`,
    armyNo: 4100 + i,
    displayName: `Sgt Cadet ${i + 1}`,
    gender: (i % 2 === 0 ? "MALE" : "FEMALE") as "MALE" | "FEMALE",
    role: "CADET",
    religion: "ISLAM",
    race: "MALAY",
    address: "Malaysia",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  // KOPERAL CADETS
  ...Array.from({ length: 18 }, (_, i) => ({
    name: `Koperal Cadet ${i + 1}`,
    rank: "KOPERAL_CADET",
    email: `kplcadet${i + 1}@example.com`,
    armyNo: 4200 + i,
    displayName: `Kpl Cadet ${i + 1}`,
    gender: (i % 2 === 0 ? "MALE" : "FEMALE") as "MALE" | "FEMALE",
    role: "CADET",
    religion: "ISLAM",
    race: "MALAY",
    address: "Malaysia",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  // PK
  ...Array.from({ length: 5 }, (_, i) => ({
    name: `PK Member ${i + 1}`,
    rank: "PK",
    email: `pk${i + 1}@example.com`,
    armyNo: 4300 + i,
    displayName: `PK ${i + 1}`,
    gender: (i % 2 === 0 ? "MALE" : "FEMALE") as "MALE" | "FEMALE",
    role: "CADET",
    religion: "ISLAM",
    race: "MALAY",
    address: "Malaysia",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),

  // PKW
  ...Array.from({ length: 5 }, (_, i) => ({
    name: `PKW Member ${i + 1}`,
    rank: "PKW",
    email: `pkw${i + 1}@example.com`,
    armyNo: 4400 + i,
    displayName: `PKW ${i + 1}`,
    gender: "FEMALE" as const,
    role: "CADET",
    religion: "ISLAM",
    race: "MALAY",
    address: "Malaysia",
    redBgPhotoPath: DEFAULT_CADET_DISPLAY_PHOTO_URL,
    blueBgPhotoPath: DEFAULT_BLUE_BG_PHOTO_URL,
  })),
];

export const DEFAULT_CADETS_INFO = DEFAULT_MEMBERS.filter((m) => m.role === "CADET");

export const DEFAULT_INTAKES = [
  {
    intakeNo: "1/43",
    displayName: "Natus Vincere",
    slug: "natus-vincere",
    startYear: 2022,
    color: "#e8e84f",
    tagLine: "You Choose You Get",
    coverPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/cover/1772553232433-pn2rsavrvb-photo_2026-03-03_23-17-29.jpg",
    patchPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/patch/photo_2025-08-12_09-46-31.jpg",
    innerPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/inner/1772553232908-hprv1opjma8-489374817_18092673943571295_392734238668008862_n.jpg",
    tshirtPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/tshirt/1772553233100-t6adjay5ae-420124908_17986793711615418_6074924214528914305_n.jpg",
    displayPhotos: [
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/display/photo_2025-04-11_12-10-20.jpg",
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/1/display/photo_2025-09-03_18-25-25.jpg",
    ],
    translations: {
      en: {
        summary:
          "Alpha Wolves was the pioneering intake known for resilience, teamwork, and leadership excellence.",
        seoTitle: "Alpha Wolves Intake",
        seoDescription:
          "Learn more about Alpha Wolves, the first intake focused on discipline and leadership.",
      },
      ms: {
        summary:
          "Alpha Wolves merupakan pengambilan perintis yang terkenal dengan ketahanan, kerja berpasukan dan kepimpinan.",
        seoTitle: "Pengambilan Alpha Wolves",
        seoDescription:
          "Ketahui lebih lanjut mengenai Alpha Wolves yang menekankan disiplin dan kepimpinan.",
      },
      zh: {
        summary:
          "Alpha Wolves 是以坚韧、团队合作和领导力闻名的先锋队伍。",
        seoTitle: "Alpha Wolves 招生",
        seoDescription:
          "了解更多关于 Alpha Wolves 的纪律与领导精神。",
      },
      ta: {
        summary:
          "Alpha Wolves என்பது ஒற்றுமை மற்றும் தலைமைத்துவத்திற்காக அறியப்பட்ட முதல் அணியாகும்.",
        seoTitle: "Alpha Wolves சேர்க்கை",
        seoDescription:
          "Alpha Wolves அணியின் ஒழுக்கம் மற்றும் தலைமைப்பண்புகளை அறிக.",
      },
    },
    patchExplanations: {
      ANIMAL: {
        en: "The wolf symbolizes loyalty and unity.",
        ms: "Serigala melambangkan kesetiaan dan perpaduan.",
        zh: "狼象征忠诚与团结。",
        ta: "ஓநாய் விசுவாசத்தையும் ஒற்றுமையையும் குறிக்கிறது。",
      },
      COLOR: {
        en: "Red represents courage and sacrifice.",
        ms: "Merah melambangkan keberanian dan pengorbanan.",
        zh: "红色象征勇气与牺牲。",
        ta: "சிவப்பு தைரியத்தையும் தியாகத்தையும் குறிக்கிறது。",
      },
      PHILOSOPHY: {
        en: "Move as one, succeed as one.",
        ms: "Bergerak sebagai satu, berjaya sebagai satu.",
        zh: "团结一致，共同成功。",
        ta: "ஒன்றுபட்டு செயல்பட்டு வெற்றியடைவோம்。",
      },
    },
  },
  {
    intakeNo: "2/44",
    displayName: "Sinac",
    slug: "sinac",
    startYear: 2023,
    color: "#b80416",
    tagLine: "Middle is middle",
    coverPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/cover/1772732852560-xszm9j7w47a-photo_2025-08-12_09-46-29.jpg",
    patchPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/patch/photo_2025-08-12_09-46-29.jpg",
    innerPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/inner/1772642387601-f1g5p00l0o8-420124908_17986793711615418_6074924214528914305_n.jpg",
    tshirtPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/tshirt/1772683766655-qhc1lap4log-489374817_18092673943571295_392734238668008862_n.jpg",
    displayPhotos: [
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/display/1772730368051-cfj0shfals-WhatsApp%20Image%202025-12-26%20at%2001.40.11.jpeg",
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/2/display/1772730368358-hz8l88zsrll-beret+hackle.jpeg",
    ],
    translations: {
      en: {
        summary:
          "Iron Eagles became known for strategic thinking and aerial-inspired discipline.",
        seoTitle: "Iron Eagles Intake",
        seoDescription:
          "Discover the legacy of Iron Eagles and their pursuit of excellence.",
      },
      ms: {
        summary:
          "Iron Eagles terkenal dengan pemikiran strategik dan disiplin tinggi.",
        seoTitle: "Pengambilan Iron Eagles",
        seoDescription:
          "Kenali legasi Iron Eagles dan usaha mereka mencapai kecemerlangan.",
      },
      zh: {
        summary:
          "Iron Eagles 以战略思维和高纪律性闻名。",
        seoTitle: "Iron Eagles 招生",
        seoDescription:
          "探索 Iron Eagles 的卓越精神与传统。",
      },
      ta: {
        summary:
          "Iron Eagles அணியினர் திட்டமிடல் மற்றும் ஒழுக்கத்திற்காக அறியப்பட்டனர்.",
        seoTitle: "Iron Eagles சேர்க்கை",
        seoDescription:
          "Iron Eagles அணியின் பாரம்பரியம் மற்றும் சாதனைகளை அறிக。",
      },
    },
    patchExplanations: {
      ANIMAL: {
        en: "The eagle symbolizes vision and determination.",
        ms: "Helang melambangkan visi dan keazaman.",
        zh: "鹰象征远见与决心。",
        ta: "கழுகு பார்வையையும் உறுதியையும் குறிக்கிறது。",
      },
      COLOR: {
        en: "Blue reflects integrity and calm leadership.",
        ms: "Biru mencerminkan integriti dan kepimpinan tenang.",
        zh: "蓝色代表诚信与冷静领导。",
        ta: "நீலம் நேர்மையையும் அமைதியான தலைமைத்துவத்தையும் குறிக்கிறது。",
      },
      PHILOSOPHY: {
        en: "Aim high, stay grounded.",
        ms: "Sasar tinggi, tetap berpijak di bumi nyata.",
        zh: "志存高远，脚踏实地。",
        ta: "உயரத்தை நோக்கி பறந்து நிலைத்திருக்கவும்。",
      },
    },
  },
  {
    intakeNo: "3/45",
    displayName: "Venomancer",
    slug: "vernomancer",
    startYear: 2024,
    color: "#065c07",
    tagLine: "Silent But Fearless",
    coverPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/cover/1772684792124-wkotlzpimg-beret+hackle.jpeg",
    patchPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/patch/photo_2025-08-12_09-46-26.jpg",
    innerPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/inner/1772684792124-zu4jtdp35p-489374817_18092673943571295_392734238668008862_n.jpg",
    tshirtPhotoPath:
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/tshirt/1772684792124-lww791zrgf-420124908_17986793711615418_6074924214528914305_n.jpg",
    displayPhotos: [
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/display/1772684792394-bryyz23mwc-420124908_17986793711615418_6074924214528914305_n.jpg",
      "https://uiifoirxbqkdzppbvour.supabase.co/storage/v1/object/public/rotu-army-umt/intakes/3/display/1772684792954-fn88t411ya-photo_2026-03-03_23-17-29.jpg",
    ],
    translations: {
      en: {
        summary:
          "Shadow Panthers are recognized for stealth, adaptability, and mental resilience.",
        seoTitle: "Shadow Panthers Intake",
        seoDescription:
          "Explore the elite Shadow Panthers intake and their fearless philosophy.",
      },
      ms: {
        summary:
          "Shadow Panthers dikenali kerana ketangkasan, adaptasi dan daya tahan mental.",
        seoTitle: "Pengambilan Shadow Panthers",
        seoDescription:
          "Terokai falsafah berani Shadow Panthers.",
      },
      zh: {
        summary:
          "Shadow Panthers 以敏捷、适应能力和心理韧性著称。",
        seoTitle: "Shadow Panthers 招生",
        seoDescription:
          "探索 Shadow Panthers 无畏精神。",
      },
      ta: {
        summary:
          "Shadow Panthers அணியினர் தன்னம்பிக்கை மற்றும் மன உறுதியால் அறியப்படுகின்றனர்.",
        seoTitle: "Shadow Panthers சேர்க்கை",
        seoDescription:
          "Shadow Panthers அணியின் அச்சமற்ற தத்துவத்தை அறிக。",
      },
    },
    patchExplanations: {
      ANIMAL: {
        en: "The panther symbolizes stealth and confidence.",
        ms: "Harimau kumbang melambangkan ketangkasan dan keyakinan.",
        zh: "黑豹象征敏捷与自信。",
        ta: "பாந்தர் அமைதியையும் தன்னம்பிக்கையையும் குறிக்கிறது。",
      },
      COLOR: {
        en: "Black signifies strength and mystery.",
        ms: "Hitam menandakan kekuatan dan misteri.",
        zh: "黑色象征力量与神秘。",
        ta: "கருப்பு வலிமையையும் மர்மத்தையும் குறிக்கிறது。",
      },
      PHILOSOPHY: {
        en: "Strike with precision and purpose.",
        ms: "Bertindak dengan tepat dan bermatlamat.",
        zh: "精准出击，目标明确。",
        ta: "துல்லியத்துடனும் நோக்கத்துடனும் செயல்படு。",
      },
    },
  },
] as const;

export const DEFAULT_STUDY_PROGRAMS = [
  { slug: "ekonomi-sumber-alam", name: "EKONOMI (SUMBER ALAM)" },
  { slug: "kaunseling", name: "KAUNSELING" },
  { slug: "matematik-kewangan", name: "MATEMATIK KEWANGAN" },
  { slug: "nanofizik", name: "NANOFIZIK" },
  { slug: "pengurusan-maritim", name: "PENGURUSAN MARITIM" },
  { slug: "pengurusan-operasi-maritim", name: "PENGURUSAN OPERASI MARITIM" },
  { slug: "pengurusan-pemasaran", name: "PENGURUSAN PEMASARAN" },
  { slug: "pengurusan-pengajian-polisi", name: "PENGURUSAN (PENGAJIAN POLISI)" },
  { slug: "perakaunan", name: "PERAKAUNAN" },
  { slug: "perkhidmatan-makanan-dan-pemakanan", name: "PERKHIDMATAN MAKANAN DAN PEMAKANAN" },
  { slug: "sains-analitik-data", name: "SAINS (ANALITIK DATA)" },
  { slug: "sains-sains-biologi", name: "SAINS (SAINS BIOLOGI)" },
  { slug: "sains-biologi-marin", name: "SAINS (BIOLOGI MARIN)" },
  { slug: "sains-gunaan-elektronik-dan-instrumentasi", name: "SAINS GUNAAN (ELEKTRONIK DAN INSTRUMENTASI)" },
  { slug: "sains-gunaan-pemuliharaan-dan-pengurusan-biodiversiti", name: "SAINS GUNAAN (PEMULIHARAAN DAN PENGURUSAN BIODIVERSITI)" },
  { slug: "sains-gunaan-teknologi-maritim", name: "SAINS GUNAAN (TEKNOLOGI MARITIM)" },
  { slug: "sains-kimia", name: "SAINS KIMIA" },
  { slug: "sains-kimia-analisis-dan-persekitaran", name: "SAINS (KIMIA ANALISIS DAN PERSEKITARAN)" },
  { slug: "sains-komputer-informatik-maritim", name: "SAINS KOMPUTER (INFORMATIK MARITIM)" },
  { slug: "sains-komputer-kejuruteraan-perisian", name: "SAINS KOMPUTER (KEJURUTERAAN PERISIAN)" },
  { slug: "sains-komputer-komputeran-mudah-alih", name: "SAINS KOMPUTER (KOMPUTERAN MUDAH ALIH)" },
  { slug: "sains-makanan-teknologi-makanan", name: "SAINS MAKANAN (TEKNOLOGI MAKANAN)" },
  { slug: "sains-marin", name: "SAINS MARIN" },
  { slug: "sains-matematik-gunaan", name: "SAINS (MATEMATIK GUNAAN)" },
  { slug: "sains-sains-nautikal-dan-pengangkutan-maritim", name: "SAINS (SAINS NAUTIKAL DAN PENGANGKUTAN MARITIM)" },
  { slug: "teknologi-alam-sekitar", name: "TEKNOLOGI (ALAM SEKITAR)" },
] as const;