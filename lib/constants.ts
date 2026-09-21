export const GENDER_OPTIONS = ["MALE", "FEMALE"] as const;
export const RELIGION_OPTIONS = ["ISLAM", "CHRISTIAN", "HINDU", "BUDDHIST", "OTHER"] as const;
export const RACE_OPTIONS = ["MALAY", "CHINESE", "INDIAN", "OTHER"] as const;

export const MIN_AGE = 18;
export const MAX_AGE = 24;
export const DEFAULT_AGE = 21;

export const PROGRAM_TOTAL_YEARS = 3;
export const SESSIONS_PER_YEAR = 2;

export const SESSION_START_MONTH_DAY: Record<number, { month: number; day: number; yearOffset: number }> = {
  1: { month: 10, day: 1, yearOffset: 0 },
  2: { month: 4, day: 1, yearOffset: 1 },
};

export const BANKS = [
  "MAYBANK",
  "CIMB",
  "RHB",
  "BANK_ISLAM",
  "BSN",
  "PUBLIC_BANK",
  "HONG_LEONG",
  "AMBANK",
  "AFFIN",
  "OCBC",
  "UOB",
  "OTHER",
] as const;

export const CADET_RANKS = [
  "SENIOR_UNDER_OFFICER",
  "JUNIOR_UNDER_OFFICER",
  "SERGEANT_CADET",
  "KOPERAL_CADET",
  "PK",
  "PKW",
] as const;

export const DEFAULT_HERO_IMAGE_PATH = "hero-images/default-hero-image.jpg";
export const DEFAULT_RED_BG_PHOTO_PATH = "placeholder/default-red-bg.jpg";
export const DEFAULT_BLUE_BG_PHOTO_PATH = "placeholder/default-blue-bg.jpg";
export const DEFAULT_CADET_DISPLAY_PHOTO_PATH = "placeholder/default-display.jpg";
export const DEFAULT_EVENT_COVER_PHOTO = "placeholder/event-cover-photo.jpg";
export const DEFAULT_EVENT_VIDEO_PATH = "placeholder/event-video.mp4";
export const DEFAULT_EVENT_DISPLAY_PHOTOS = [
  "placeholder/event-photo-1.jpg",
  "placeholder/event-photo-2.jpg",
  "placeholder/event-photo-3.jpg",
] as const;

export const DEFAULT_PLATOONS = [
  {
    platoonNo: 1,
    displayName: "Platoon Alpha",
    slug: "platoon-alpha",
    status: "PUBLISHED",
    color: "#e63946",
    tagLine: "First Platoon",
    flagPhotoPath: DEFAULT_RED_BG_PHOTO_PATH,
  },
  {
    platoonNo: 2,
    displayName: "Platoon Bravo",
    slug: "platoon-bravo",
    status: "PUBLISHED",
    color: "#457b9d",
    tagLine: "Second Platoon",
    flagPhotoPath: DEFAULT_RED_BG_PHOTO_PATH,
  },
  {
    platoonNo: 3,
    displayName: "Platoon Charlie",
    slug: "platoon-charlie",
    status: "PUBLISHED",
    color: "#2a9d8f",
    tagLine: "Third Platoon",
    flagPhotoPath: DEFAULT_RED_BG_PHOTO_PATH,
  },
] as const;

export const DEFAULT_GOOGLE_MAP_LOCATION_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.0307093423557!2d103.0855613748609!3d5.412293794566897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31b7bd9170fb4525%3A0x95ae1a9651800784!2sMarkas%20PALAPES%20Darat%20UMT!5e0!3m2!1sen!2smy!4v1766609697968!5m2!1sen!2smy";
export const DEFAULT_OFFICIAL_EMAIL = "";
export const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/palapesdaratumt_2019";
export const DEFAULT_FACEBOOK_URL = "https://facebook.com/palapesumt.darat";
export const DEFAULT_YOUTUBE_URL = "";
export const DEFAULT_TIKTOK_URL = "";
export const DEFAULT_X_URL = "";

export const DEFAULT_ADMIN = {
  authUserId: "87e52cc6-e1c5-47d7-9fa4-e7919dff109b",
  personalEmail: "yongchunhao2003@gmail.com",
  fullName: "YONG CHUN HAO",
  role: "OFFICER",
} as const;

export const DEFAULT_TESTIMONIAL_ARMY_NOS = [4001, 4002, 4003];

export const DEFAULT_TESTIMONIAL_ENTRIES = [
  {
    authorName: "Ahmad Fauzi",
    authorRank: "SJN Cadet",
    authorImagePath: "images/testimonials/testimonial-1.jpg",
    translations: {
      en: "Joining ROTU was the best decision of my university life. It taught me discipline and leadership like nowhere else.",
      ms: "Menyertai ROTU adalah keputusan terbaik dalam kehidupan universiti saya. Ia mengajar saya disiplin dan kepimpinan yang tidak dapat diperolehi di tempat lain.",
      zh: "加入 ROTU 是我大学生活最正确的决定。它教会了我其他地方无法学到的纪律和领导力。",
      ta: "ROTU-வில் சேர்ந்தது எனது பல்கலைக்கழக வாழ்க்கையின் சிறந்த முடிவாகும். இது எனக்கு வேறு எங்கும் கிடைக்காத ஒழுக்கத்தையும் தலைமைத்துவத்தையும் கற்றுக்கொடுத்தது.",
    },
  },
  {
    authorName: "Siti Aminah",
    authorRank: "KPL Cadet",
    authorImagePath: "images/testimonials/testimonial-2.jpg",
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
    authorImagePath: "images/testimonials/testimonial-3.jpg",
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
      answer: "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) is a Malaysian university program that trains students to become reserve officers in the Malaysian Armed Forces.",
    },
    ms: {
      question: "Apakah ROTU/PALAPES?",
      answer: "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) ialah program universiti di Malaysia yang melatih pelajar untuk menjadi pegawai simpanan dalam Angkatan Tentera Malaysia.",
    },
    zh: {
      question: "什么是 ROTU/PALAPES？",
      answer: "ROTU/PALAPES（后备军官训练队）是马来西亚的大学项目，旨在培训学生成为马来西亚武装部队的后备军官。",
    },
    ta: {
      question: "ROTU/PALAPES என்பது என்ன?",
      answer: "ROTU/PALAPES (Pasukan Latihan Pegawai Simpanan) என்பது மலேசிய பல்கலைக்கழக திட்டமாகும்; இது மாணவர்களை மலேசிய ஆயுதப்படையின் காப்பு அதிகாரிகளாக உருவாக்க பயிற்சி அளிக்கிறது.",
    },
  },
  {
    en: {
      question: "Who is eligible to join ROTU/PALAPES?",
      answer: "Malaysian university students who meet age, academic, and medical requirements can apply to join ROTU/PALAPES.",
    },
    ms: {
      question: "Siapa yang layak menyertai ROTU/PALAPES?",
      answer: "Pelajar universiti di Malaysia yang memenuhi syarat umur, akademik, dan kesihatan boleh memohon untuk menyertai ROTU/PALAPES.",
    },
    zh: {
      question: "谁有资格加入 ROTU/PALAPES？",
      answer: "符合年龄、学术及体检要求的马来西亚大学生，均可申请加入 ROTU/PALAPES。",
    },
    ta: {
      question: "ROTU/PALAPES-இல் சேர யார் தகுதியானவர்?",
      answer: "வயது, கல்வி மற்றும் மருத்துவத் தேவைகளை பூர்த்தி செய்யும் மலேசிய பல்கலைக்கழக மாணவர்கள் ROTU/PALAPES-இல் சேர விண்ணப்பிக்கலாம்.",
    },
  },
  {
    en: {
      question: "What benefits do members get from ROTU/PALAPES?",
      answer: "Members receive military training, leadership skills, adventure activities, and a pathway to serve as commissioned officers after graduation.",
    },
    ms: {
      question: "Apakah manfaat yang diperoleh ahli daripada ROTU/PALAPES?",
      answer: "Ahli menerima latihan ketenteraan, kemahiran kepimpinan, aktiviti lasak, serta laluan untuk berkhidmat sebagai pegawai bertauliah selepas tamat pengajian.",
    },
    zh: {
      question: "成员可从 ROTU/PALAPES 获得哪些好处？",
      answer: "成员可获得军事训练、领导能力培养、历险活动经验，并在毕业后有机会以委任军官身份服役。",
    },
    ta: {
      question: "ROTU/PALAPES மூலம் உறுப்பினர்கள் பெறும் நன்மைகள் என்ன?",
      answer: "உறுப்பினர்கள் இராணுவப் பயிற்சி, தலைமைய்த்திறன், சவால் செயல்பாடுகள் மற்றும் பட்டம் பெற்ற பின் ஆணையமளிக்கப்பட்ட அதிகாரியாக சேவை செய்யும் வாய்ப்பைப் பெறுகின்றனர்.",
    },
  },
  {
    en: {
      question: "How long is the ROTU/PALAPES training program?",
      answer: "The training program typically lasts throughout the university course, with periodic camps and practical training sessions each year.",
    },
    ms: {
      question: "Berapa lamakah tempoh program latihan ROTU/PALAPES?",
      answer: "Program latihan biasanya berlangsung sepanjang tempoh pengajian universiti, dengan kem berkala dan sesi latihan praktikal setiap tahun.",
    },
    zh: {
      question: "ROTU/PALAPES 训练计划为期多久？",
      answer: "该训练计划通常贯穿整个大学学习阶段，并在每年安排定期营训和实操训练。",
    },
    ta: {
      question: "ROTU/PALAPES பயிற்சி திட்டம் எவ்வளவு காலம் நடைபெறும்?",
      answer: "இந்தப் பயிற்சி திட்டம் பொதுவாக பல்கலைக்கழக படிப்பு முழுவதும் நீடிக்கும்; ஒவ்வொரு ஆண்டும் காலகட்ட முகாம்கள் மற்றும் நடைமுறைப் பயிற்சி அமர்வுகள் இடம்பெறும்.",
    },
  },
  {
    en: {
      question: "Do ROTU/PALAPES members have a military obligation after graduation?",
      answer: "Yes, graduates may serve as reserve officers in the Malaysian Armed Forces, usually for a few years as per the terms of the program.",
    },
    ms: {
      question: "Adakah ahli ROTU/PALAPES mempunyai kewajipan ketenteraan selepas tamat pengajian?",
      answer: "Ya, graduan boleh berkhidmat sebagai pegawai simpanan dalam Angkatan Tentera Malaysia, lazimnya untuk beberapa tahun mengikut syarat program.",
    },
    zh: {
      question: "ROTU/PALAPES 成员毕业后是否有军事义务？",
      answer: "是的，毕业生可按项目条款在马来西亚武装部队担任后备军官，通常服务若干年。",
    },
    ta: {
      question: "ROTU/PALAPES உறுப்பினர்களுக்கு பட்டப்படிப்பு முடிந்த பின் இராணுவப் பொறுப்பு உள்ளதா?",
      answer: "ஆம், பட்டதாரிகள் திட்டத்தின் விதிமுறைகளின்படி மலேசிய ஆயுதப்படையின் காப்பு அதிகாரிகளாக சில ஆண்டுகள் சேவை செய்ய வேண்டி இருக்கலாம்.",
    },
  },
] as const;

export const DEFAULT_SEE_MORE_LINKS = [
  {
    title: "Angkatan Tentera Malaysia",
    link: "https://www.mafhq.mil.my/",
    imagePath: "placeholder/see-also-atm.svg",
  },
  {
    title: "Tentera Udara Malaysia",
    link: "https://airforce.mil.my/",
    imagePath: "placeholder/see-also-airforce.jpeg",
  },
  {
    title: "Tentera Laut Malaysia",
    link: "https://www.navy.mil.my/",
    imagePath: "placeholder/see-also-navy.jpg",
  },
  {
    title: "Tentera Darat Malaysia",
    link: "https://army.mil.my/",
    imagePath: "placeholder/see-also-army.jpg",
  },
] as const;

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

export const LONG_EN_EVENT_SUMMARY = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec tincidunt luctus, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl. Integer tincidunt, sapien sed facilisis efficitur, risus nibh viverra massa, sed suscipit sapien ipsum vel nisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec malesuada, lorem non pellentesque suscipit, risus risus consequat turpis, sed aliquet massa lorem vel erat.

Suspendisse potenti. Praesent non est nec augue tristique tincidunt. Curabitur sed eros vitae velit tempus volutpat. Vivamus posuere velit sed orci tristique, non vulputate leo interdum. Integer posuere, nibh sit amet scelerisque malesuada, sapien lorem malesuada est, nec facilisis lorem elit sed massa. In hac habitasse platea dictumst. Etiam vulputate lorem sit amet augue tincidunt, nec tempus velit fermentum.

Aliquam erat volutpat. Quisque tincidunt mauris vel turpis cursus, a feugiat lorem aliquet. Sed nec sapien eget lorem malesuada luctus. Mauris vulputate sem vel sapien accumsan, sed pulvinar mauris hendrerit. Cras vel neque vitae justo aliquet sodales. Proin vitae massa ac elit suscipit bibendum. Fusce malesuada nisi vel magna faucibus, sed dictum odio gravida.`;

export const LONG_MS_EVENT_SUMMARY = `Program ini memberi penekanan kepada pembangunan kepimpinan, disiplin diri, ketahanan mental, dan semangat kerja berpasukan dalam kalangan kadet PALAPES. Sepanjang program berlangsung, peserta akan menjalani pelbagai aktiviti latihan termasuk latihan lapangan, kawad kaki, pengurusan organisasi, komunikasi taktikal, serta aktiviti lasak yang bertujuan meningkatkan keyakinan diri.

Selain itu, program ini turut memupuk nilai tanggungjawab, integriti, dan kemampuan membuat keputusan dalam situasi mencabar. Para peserta didedahkan kepada pengalaman sebenar dalam pengendalian operasi berkumpulan dan pengurusan masa secara sistematik. Aktiviti yang dijalankan juga membantu meningkatkan kecergasan fizikal dan daya tahan emosi.

Melalui penyertaan dalam program ini, kadet dapat membina hubungan yang lebih erat sesama ahli serta memperkukuhkan semangat patriotisme dan cintakan negara. Program ini juga menjadi platform penting dalam melahirkan bakal pemimpin muda yang berwibawa, berdisiplin, dan mampu menghadapi cabaran masa depan dengan lebih yakin dan profesional.`;

export const LONG_ZH_EVENT_SUMMARY = `该活动旨在培养学员的领导能力、团队合作精神、纪律意识以及身体素质。参与者将在活动期间接受多种形式的训练，包括野外训练、体能挑战、战术活动以及团队协作任务。这些活动不仅能够增强学员的自信心，也能够提高他们在高压环境下解决问题的能力。

此外，活动也强调责任感、沟通技巧以及组织管理能力的重要性。学员们将通过实际操作与团队合作学习如何有效地完成任务，并在过程中建立更深厚的友谊与集体精神。整个活动过程将帮助参与者培养坚韧不拔的精神以及积极向上的态度。

通过参与该项目，学员能够获得宝贵的实践经验，同时进一步提升个人综合素质。该活动不仅是一次训练机会，更是培养未来青年领袖的重要平台。`;

export const LONG_TA_EVENT_SUMMARY = `இந்த திட்டம் PALAPES கேடட்டுகளின் தலைமைத்திறன், ஒழுக்கம், உடல் வலிமை மற்றும் குழு ஒருங்கிணைப்பை மேம்படுத்தும் நோக்கில் உருவாக்கப்பட்டுள்ளது. இதில் பங்கேற்பாளர்கள் களப்பயிற்சி, உடற்பயிற்சி, ஒழுங்கு பயிற்சி மற்றும் பல்வேறு குழு நடவடிக்கைகளில் ஈடுபடுவர். இந்த அனுபவங்கள் அவர்களின் தன்னம்பிக்கையையும் மனவலிமையையும் அதிகரிக்கும்.

மேலும், திட்டம் பொறுப்புணர்வு, ஒத்துழைப்பு மற்றும் சவாலான சூழ்நிலைகளில் முடிவெடுக்கும் திறனை வளர்க்க உதவுகிறது. செயல்முறை அடிப்படையிலான பயிற்சிகள் மூலம் பங்கேற்பாளர்கள் நேர மேலாண்மை மற்றும் குழு வழிநடத்தல் திறன்களை கற்றுக்கொள்வார்கள். இதன் மூலம் நாட்டுப்பற்று மற்றும் ஒற்றுமை உணர்வும் வலுப்பெறும்.

இந்த திட்டம் எதிர்கால இளைஞர் தலைவர்களை உருவாக்கும் முக்கியமான தளமாக செயல்படுகிறது. இதில் கலந்து கொள்வதன் மூலம் மாணவர்கள் வாழ்க்கைத் திறன்கள், ஒழுக்கம் மற்றும் தலைமைத்திறனை நடைமுறை அனுபவத்துடன் வளர்த்துக்கொள்ள முடியும்.`;

export const DEFAULT_CONTACT_REASONS = [
  {
    iconKey: "Mail",
    sortOrder: 1,
    translations: {
      en: { title: "General Inquiries", description: "Have a general question about our program? Reach out to us via email." },
      ms: { title: "Pertanyaan Umum", description: "Mempunyai soalan umum tentang program kami? Hubungi kami melalui e-mel." },
      zh: { title: "一般查询", description: "对我们的计划有任何疑问？请通过电子邮件与我们联系。" },
      ta: { title: "பொதுவான விசாரணைகள்", description: "எங்கள் திட்டத்தைப் பற்றி பொதுவான கேள்விகள் உள்ளதா? மின்னஞ்சல் மூலம் எங்களைத் தொடர்பு கொள்ளவும்." },
    },
  },
  {
    iconKey: "Phone",
    sortOrder: 2,
    translations: {
      en: { title: "Admissions Support", description: "Need help with your application process? Our team is here to guide you." },
      ms: { title: "Sokongan Kemasukan", description: "Memerlukan bantuan dengan proses permohonan anda? Pasukan kami sedia membantu." },
      zh: { title: "招生支持", description: "在申请过程中需要帮助？我们的团队将引导您。" },
      ta: { title: "சேர்க்கை ஆதரவு", description: "விண்ணப்ப செயல்முறையில் உதவி தேவையா? எங்கள் குழு உங்களுக்கு வழிகாட்ட இங்கே உள்ளது." },
    },
  },
  {
    iconKey: "HelpCircle",
    sortOrder: 3,
    translations: {
      en: { title: "Officer Consultation", description: "Looking for specific guidance from our officers? Schedule a consultation." },
      ms: { title: "Konsultasi Pegawai", description: "Mencari bimbingan khusus daripada pegawai kami? Jadualkan sesi konsultasi." },
      zh: { title: "军官咨询", description: "寻找我们军官的具体指导？请预约咨询。" },
      ta: { title: "அதிகாரி ஆலோசனை", description: "எங்கள் அதிகாரிகளிடம் குறிப்பிட்ட வழிகாட்டுதல்களை தேடுகிறீர்களா? ஒரு ஆலோசனை அமர்வை ஒதுக்கவும்." },
    },
  },
] as const;