import type { Dictionary } from "../dictionaries";

const ms: Dictionary = {
  metadata: {
    siteName: "ROTU ARMY UMT",
    title: "ROTU ARMY UMT",
    description:
      "Laman web rasmi ROTU ARMY UMT, PALAPES Darat, Universiti Malaysia Terengganu.",
  },
  navigation: {
    about: "Tentang Kami",
    intakes: "Ambilan Kami",
    stories: "Cerita Kami",
    contact: "Hubungi Kami",
  },
  common: {
    skipToContent: "Langkau ke kandungan utama",
    language: "Bahasa",
    theme: "Tema",
    switchToLight: "Tukar kepada tema cerah",
    switchToDark: "Tukar kepada tema gelap",
    menu: "Menu",
    closeMenu: "Tutup menu",
    primaryNavigation: "Navigasi utama",
    viewStory: "Lihat cerita",
    externalLink: "Terbuka dalam tab baharu",
  },
  recordMarkers: {
    home: "Tentang Kami / rekod medan 01",
    intakes: "Rekod awam / ambilan",
    stories: "Rekod awam / cerita",
    intakesRegister: "Daftar diterbitkan",
    storiesIndex: "Indeks arkib",
    storyYears: "Terus ke tahun tertentu",
    recordsCountOne: "{count} rekod",
    recordsCountOther: "{count} rekod",
  },
  home: {
    title: "ROTU Army UMT",
    intro: "Komuniti latihan universiti berdisiplin yang dibina atas kepimpinan, khidmat, ketahanan, dan pengalaman lapangan.",
    primaryCta: "Lihat ambilan",
    secondaryCta: "Hubungi kami",
    heroImageAlt: "Ahli ROTU Army UMT di medan latihan",
    statsTitle: "Kekuatan secara ringkas",
    statsIntro: "Angka terkini berdasarkan rekod ROTU Army UMT.",
    intakeCountLabel: "Ambilan",
    officerCountLabel: "Pegawai",
    instructorCountLabel: "Jurulatih",
    cadetCountLabel: "Kadet",
    faqTitle: "Soalan lazim",
    faqIntro: "Jawapan penting untuk pelajar yang ingin menyertai ROTU/PALAPES.",
    faqEmpty: "Tiada soalan telah diterbitkan lagi. Sila kembali sebentar lagi.",
    seeAlsoTitle: "Lihat juga",
    seeAlsoIntro: "Rujukan berkaitan Angkatan Tentera Malaysia.",
    seeAlsoEmpty: "Tiada pautan berkaitan telah diterbitkan lagi.",
    bestCadets: {
      eyebrow: "Daftar penghargaan",
      title: "Kadet Terbaik",
      intro:
        "Rekod kadet yang diiktiraf dengan anugerah ini serta pengalaman di sebalik pengiktirafan tersebut.",
      registerLabel: "Penerima lain",
      quoteLabel: "Dalam kata-kata mereka",
      exploreMore: "Baca cerita berkaitan",
      exploreMoreLabel: "Baca cerita berkaitan untuk {name}",
      portraitAlt: "Potret {name}",
      intakeLabel: "Ambilan",
    },
    joinTheRanks: {
      eyebrow: "Proses ringkas",
      title: "Sertai Kami",
      intro:
        "Perjalanan anda menuju kepimpinan dan disiplin bermula di sini. Ikuti langkah-langkah ini untuk menjadi sebahagian daripada ROTU Army UMT.",
      stepAlt: "Ilustrasi bagi langkah {number}: {title}",
      steps: [
        {
          title: "Permohonan Dalam Talian",
          description:
            "Hantar biodata dan dokumen awal melalui portal rasmi kami.",
        },
        {
          title: "Semakan Dokumen",
          description:
            "Pentadbiran kami mengesahkan rekod akademik dan peribadi anda.",
        },
        {
          title: "Penilaian Fizikal",
          description:
            "Jalani pemeriksaan BMI dan ujian kecergasan fizikal untuk memastikan kesediaan.",
        },
        {
          title: "Pemilihan Akhir",
          description:
            "Lengkapkan temu duga akhir dan muktamadkan pendaftaran anda.",
        },
      ],
    },
  },
  intakesPage: {
    title: "Ambilan Kami",
    description:
      "Terokai ambilan ROTU Army UMT yang mempunyai identiti, karakter latihan, dan kisah tersendiri.",
    intakeNoLabel: "Ambilan",
    summaryFallback: "Ringkasan terperinci ambilan ini akan diterbitkan tidak lama lagi.",
    taglineFallback: "Maklumat kitaran latihan sedang dikemas kini.",
    viewDetails: "Lihat butiran",
    coverImageAlt: "Gambar utama ambilan {intake}",
    emptyTitle: "Belum ada ambilan diterbitkan",
    emptyDescription:
      "Rekod ambilan yang telah diterbitkan akan dipaparkan di sini sebaik sahaja pasukan menghasilkannya.",
    emptyActionLabel: "Kembali ke laman utama",
  },
  intakeDetailPage: {
    detailEyebrow: "Butiran ambilan",
    cadetsTitle: "Kadet aktif",
    noGalleryPhotos: "Tiada foto telah diterbitkan untuk ambilan ini lagi.",
    noPatchExplanations: "Penerangan lencana belum tersedia.",
    noCadets: "Tiada kadet aktif telah diterbitkan untuk ambilan ini lagi.",
    quoteFallback: "Tiada kata-kata został disediakan.",
    noUniformPhotos: "Visual uniform belum tersedia.",
    innerLabel: "Inner",
    tshirtLabel: "T-shirt",
    summaryTab: "Ringkasan",
    patchTab: "Lencana",
    uniformTab: "Inner & T-shirt",
    patchLabels: {
      ANIMAL: "Haiwan",
      COLOR: "Warna",
      PHILOSOPHY: "Falsafah",
    },
    alt: {
      displayPhoto: "Foto paparan {number} bagi {intake}",
      patch: "Lencana {intake}",
      cover: "Gambar utama {intake}",
      expanded: "Foto paparan {intake} yang diperbesar",
      uniform: "{intake} {item}",
    },
  },
  storiesPage: {
    title: "Cerita Kami",
    description:
      "Lihat cerita ROTU Army UMT yang diterbitkan mengikut tahun dan buka setiap satu untuk membaca rekod penuhnya.",
    emptyTitle: "Belum ada cerita diterbitkan",
    emptyDescription:
      "Cerita yang diterbitkan akan dipaparkan di sini sebaik sahaja pasukan menghasilkannya.",
    emptyActionLabel: "Kembali ke laman utama",
  },
  storyDetailPage: {
    backLabel: "Kembali ke cerita",
    detailLabel: "Butiran cerita",
    dateLabel: "Tarikh",
    locationLabel: "Lokasi",
    participantsLabel: "Peserta",
    tagsLabel: "Tag",
    watchVideo: "Tonton video",
    closeVideoLabel: "Tutup video",
    similarStoriesLabel: "Cerita berkaitan",
    carousel: {
      label: "Galeri foto",
      goToPhoto: "Pergi ke foto {number}",
    },
  },
  storyTagPage: {
    backLabel: "Kembali ke cerita",
    archiveLabel: "Arkib tag",
    description:
      "Lihat cerita ROTU Army UMT yang diterbitkan dan dikumpulkan di bawah tag ini.",
    emptyTitle: "Belum ada cerita berkaitan",
    emptyDescription:
      "Cerita yang diterbitkan untuk tag ini akan dipaparkan di sini sebaik sahaja ia tersedia.",
    emptyActionLabel: "Kembali ke semua cerita",
  },
  contactPage: {
    eyebrow: "Hubungi kami",
    title: "Kami sedia membantu",
    description:
      "Tidak pasti siapa yang perlu dihubungi? Semak sebab-sebab di bawah untuk mencari pasukan yang sesuai, atau hubungi kami terus melalui saluran rasmi kami.",
    social: {
      title: "Ikuti kami",
      tiktokLabel: "TikTok",
    },
    location: {
      title: "Cari kami",
      mapTitle: "Peta yang menunjukkan lokasi ROTU Army UMT",
    },
    newsletter: {
      title: "Kemas kini rasmi",
      subtitle: "Surat berita",
      description:
        "Terima pengumuman tentang ambilan, latihan, dan aktiviti. Sahkan langganan anda melalui e-mel untuk mula menerimanya.",
      emailLabel: "Alamat e-mel",
      emailPlaceholder: "email@contoh.com",
      loadingLabel: "Menghantar…",
      languageLabel: "Bahasa pilihan",
      languageOptions: {
        en: "Bahasa Inggeris",
        ms: "Bahasa Melayu",
        zh: "Bahasa Cina",
        ta: "Bahasa Tamil",
      },
      submitLabel: "Langgan",
      success: "Hampir selesai — semak peti masuk anda untuk mengesahkan langganan.",
      errorUnexpected: "Sesuatu tidak kena. Sila cuba lagi.",
      errorRequired: "Masukkan alamat e-mel anda untuk melanggan.",
      errorInvalidEmail:
        "Masukkan alamat e-mel yang sah, contohnya nama@contoh.com.",
      errorDuplicate: "Alamat e-mel ini sudah melanggan surat berita kami.",
      errorRateLimited:
        "Terlalu banyak percubaan langganan. Sila tunggu beberapa minit dan cuba lagi.",
      errorUnavailable:
        "Kami tidak dapat menerima langganan buat masa ini. Sila cuba lagi kemudian.",
      errorSecurityFailed: "Semakan keselamatan gagal. Sila cuba lagi.",
      errorSecurityNotReady:
        "Semakan keselamatan masih dimuatkan. Sila tunggu sebentar dan cuba lagi.",
      errorSendFailed:
        "Kami tidak dapat menghantar e-mel pengesahan sekarang. Sila cuba lagi.",
    },
  },
  newsletter: {
    emailSubject: "Sahkan langganan ROTU Army UMT anda",
    emailGreeting: "Halo daripada ROTU Army UMT,",
    emailIntro: "Terima kasih kerana menyertai surat berita kami. Sahkan langganan anda untuk mula menerima kemas kini dan pengumuman rasmi.",
    emailButton: "Sahkan langganan",
    emailFallback: "Jika butang tidak berfungsi, salin pautan ini:",
    emailFooter: "Jika anda tidak meminta langganan ini, anda boleh abaikan e-mel ini.",
    emailUnsubscribeLabel: "Nyahlanggan",
    confirmationPageEyebrow: "Surat berita",
    confirmationPageTitle: "Sahkan langganan anda",
    confirmationPageSuccessTitle: "Langganan disahkan",
    confirmationPageSuccessDescription:
      "Langganan surat berita anda kini aktif.",
    confirmationPageAlreadyTitle: "Langganan sudah disahkan",
    confirmationPageAlreadyDescription:
      "Pautan pengesahan ini sudah digunakan dan langganan anda sudah aktif.",
    confirmationPagePendingTitle: "Sahkan langganan anda",
    confirmationPagePendingDescription:
      "Tekan butang di bawah untuk mengesahkan langganan anda dan mula menerima kemas kini rasmi.",
    confirmationPageInvalidTitle: "Pautan pengesahan tidak sah",
    confirmationPageInvalidDescription:
      "Pautan pengesahan ini tidak sah atau telah tamat tempoh. Jika anda belum|langgan, minta e-mel pengesahan baharu melalui halaman hubungi.",
    confirmationPageActionLabel: "Sahkan langganan",
    confirmationPageImageAlt: "Ilustrasi langganan surat berita",
    unsubscribePageEyebrow: "Surat berita",
    unsubscribePageTitle: "Nyahlanggan surat berita",
    unsubscribePageSuccessTitle: "Nyahlanggan disahkan",
    unsubscribePageSuccessDescription:
      "Anda tidak akan menerima kemas kini surat berita daripada ROTU Army UMT lagi.",
    unsubscribePageAlreadyTitle: "Anda sudah nyahlanggan",
    unsubscribePageAlreadyDescription:
      "Pautan nyahlanggan ini sudah digunakan.",
    unsubscribePagePendingTitle: "Nyahlanggan surat berita",
    unsubscribePagePendingDescription:
      "Tekan butang di bawah untuk berhenti menerima kemas kini surat berita daripada ROTU Army UMT.",
    unsubscribePageInvalidTitle: "Pautan nyahlanggan tidak sah",
    unsubscribePageInvalidDescription:
      "Pautan nyahlanggan ini tidak sah atau telah tamat tempoh.",
    unsubscribePageActionLabel: "Nyahlanggan",
    unsubscribePageImageAlt: "Ilustrasi nyahlanggan surat berita",
    backToSiteLabel: "Kembali ke laman utama",
  },
  notFoundPage: {
    eyebrow: "404",
    title: "Halaman tidak dijumpai",
    description: "Halaman yang anda cari tidak wujud atau telah dipindahkan.",
    backHomeLabel: "Kembali ke laman utama",
    imageAlt: "Ilustrasi halaman tidak dijumpai",
  },
};

export default ms;
