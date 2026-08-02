import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES } from "@/lib/admin/roles";

export const localeEnum = pgEnum("locale", ["en", "ms", "zh", "ta"]);

export const adminRoleEnum = pgEnum("admin_role", ADMIN_ROLES);

export const adminAuditActionEnum = pgEnum("admin_audit_action", [
  "ROLE_CHANGED",
  "INVITED",
  "ACCEPTED",
  "DROPPED",
]);

export const rejimenAndKorEnum = pgEnum("rejimen_and_kor", [
  "Rejimen Askar Melayu Diraja (RAMD)",
  "Rejimen Renjer Diraja (RRD)",
  "Rejimen Sempadan (RS)",
  "Kor Armor Diraja (KAD)",
  "Rejimen Artileri Diraja (RAD)",
  "Rejimen Semboyan Diraja (RSD)",
  "Rejimen Askar Jurutera Diraja (RAJD)",
  "Kor Polis Tentera Diraja (KPTD)",
  "Kor Risik Diraja (KRD)",
  "Grup Gerak Khas (GGK)",
  "Kor Perkhidmatan Am (KPA)",
  "Kor Perkhidmatan Diraja (KPD)",
  "Kor Jurutera Letrik dan Jentera Diraja (KJLJD)",
  "Kor Kesihatan Diraja (KKD)",
  "Kor Agama Angkatan Tentera (KAGAT)",
  "Kor Ordnans Diraja (KOD)",
  "Rejimen Askar Wataniah (RAW)",
]);

export const intakeExplanationKeyEnum = pgEnum("intake_explanation_key", [
  "ANIMAL",
  "COLOR",
  "PHILOSOPHY",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "PENDING",
  "ACTIVE",
  "UNSUBSCRIBED",
]);

export const publicationStatusEnum = pgEnum("publication_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "PENDING",
  "FULFILLED",
  "REJECTED",
]);

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);

export const bmiClassificationEnum = pgEnum("bmi_classification", [
  "UNDERWEIGHT",
  "NORMAL",
  "OVERWEIGHT",
  "OBESE",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "OFFICER",
  "INSTRUCTOR",
  "CADET",
]);

export const memberRankEnum = pgEnum("member_rank", [
  "MAJOR",
  "CAPTAIN",
  "LIEUTENANT",
  "SECOND_LIEUTENANT",
  "WARRANT_OFFICER",
  "SERGEANT",
  "KOPERAL",
  "LANS_KOPERAL",
  "SENIOR_UNDER_OFFICER",
  "JUNIOR_UNDER_OFFICER",
  "SERGEANT_CADET",
  "KOPERAL_CADET",
  "PK",
  "PKW",
]);

export const CADET_RANKS = [
  "SENIOR_UNDER_OFFICER",
  "JUNIOR_UNDER_OFFICER",
  "SERGEANT_CADET",
  "KOPERAL_CADET",
  "PK",
  "PKW",
] as const satisfies readonly (typeof memberRankEnum.enumValues)[number][];

export type CadetRank = (typeof CADET_RANKS)[number];

export const religionEnum = pgEnum("religion", [
  "ISLAM",
  "CHRISTIAN",
  "HINDU",
  "BUDDHIST",
  "OTHER",
]);

export const raceEnum = pgEnum("race", [
  "MALAY",
  "CHINESE",
  "INDIAN",
  "OTHER",
]);

export const bankEnum = pgEnum("bank", [
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
]);

export const collectionPurposeEnum = pgEnum("collection_purpose", [
  "MONTHLY_COLLECTION",
  "WELFARE",
  "GOODS",
  "FEAST",
  "OTHERS",
]);


const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull(),
    memberId: integer("member_id").notNull().references(() => members.id),
    email: varchar("email", { length: 320 }).notNull(),
    role: adminRoleEnum("role").notNull(),
    intakeId: integer("intake_id").references(() => intakes.id),
    invitedByAuthUserId: uuid("invited_by_auth_user_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("admin_users_auth_user_id_idx").on(table.authUserId),
    uniqueIndex("admin_users_member_id_idx").on(table.memberId),
    uniqueIndex("admin_users_email_idx").on(table.email),
    index("admin_users_role_idx").on(table.role),
    index("admin_users_intake_id_idx").on(table.intakeId),
  ],
);

export const adminRoleAuditLogs = pgTable(
  "admin_role_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: adminAuditActionEnum("action").notNull().default("ROLE_CHANGED"),
    changedByAdminUserId: uuid("changed_by_admin_user_id").notNull(),
    targetAdminUserId: uuid("target_admin_user_id"),
    targetMemberName: text("target_member_name").notNull(),
    oldRole: adminRoleEnum("old_role"),
    newRole: adminRoleEnum("new_role"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_role_audit_logs_changed_by_idx").on(table.changedByAdminUserId),
    index("admin_role_audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const adminInvitations = pgTable(
  "admin_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: integer("member_id").notNull().references(() => members.id),
    email: varchar("email", { length: 320 }).notNull(),
    role: adminRoleEnum("role").notNull(),
    intakeId: integer("intake_id").references(() => intakes.id),
    invitedByAuthUserId: uuid("invited_by_auth_user_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_invitations_email_idx").on(table.email),
  ],
);

export const intakes = pgTable(
  "intakes",
  {
    id: serial("id").primaryKey(),
    intakeNo: varchar("intake_no", { length: 60 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    status: publicationStatusEnum("status").default("DRAFT").notNull(),
    startYear: integer("start_year").notNull(),
    color: varchar("color", { length: 80 }),
    tagLine: text("tag_line"),
    coverPhotoPath: text("cover_photo_path"),
    patchPhotoPath: text("patch_photo_path"),
    innerPhotoPath: text("inner_photo_path"),
    tshirtPhotoPath: text("tshirt_photo_path"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("intakes_intake_no_idx").on(table.intakeNo),
    uniqueIndex("intakes_display_name_idx").on(table.displayName),
    uniqueIndex("intakes_slug_idx").on(table.slug),
    index("intakes_start_year_idx").on(table.startYear),
  ],
);

export const intakeTranslations = pgTable(
  "intake_translations",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    summary: text("summary"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("intake_translations_intake_locale_idx").on(
      table.intakeId,
      table.locale,
    ),
  ],
);

export const intakePatchExplanations = pgTable(
  "intake_patch_explanations",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id, { onDelete: "cascade" }),
    key: intakeExplanationKeyEnum("key").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("intake_patch_explanations_intake_key_idx").on(
      table.intakeId,
      table.key,
    ),
  ],
);

export const intakePatchExplanationTranslations = pgTable(
  "intake_patch_explanation_translations",
  {
    id: serial("id").primaryKey(),
    patchExplanationId: integer("patch_explanation_id")
      .notNull()
      .references(() => intakePatchExplanations.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    value: text("value").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex(
      "intake_patch_explanation_translations_patch_explanation_locale_idx",
    ).on(table.patchExplanationId, table.locale),
  ],
);

export const intakeDisplayPhotos = pgTable(
  "intake_display_photos",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id, { onDelete: "cascade" }),
    photoPath: text("photo_path").notNull(),
    ...timestamps,
  },
  (table) => [index("intake_display_photos_intake_id_idx").on(table.intakeId)],
);

export const academicYears = pgTable(
  "academic_years",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id, { onDelete: "cascade" }),
    yearNumber: integer("year_number").notNull(),
    calendarYear: integer("calendar_year").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academic_years_intake_year_number_idx").on(
      table.intakeId,
      table.yearNumber,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    academicYearId: integer("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "cascade" }),
    sessionNumber: integer("session_number").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_academic_year_session_number_idx").on(
      table.academicYearId,
      table.sessionNumber,
    ),
  ],
);

export const exams = pgTable(
  "exams",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    examDate: timestamp("exam_date", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("exams_session_id_idx").on(table.sessionId)],
);

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    armyNo: integer("army_no").notNull(),
    rank: memberRankEnum("rank").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    personalEmail: varchar("personal_email", { length: 320 }).notNull(),
    eduEmail: varchar("edu_email", { length: 320 }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    gender: genderEnum("gender").notNull(),
    role: memberRoleEnum("role").notNull(),
    religion: religionEnum("religion").notNull(),
    race: raceEnum("race").notNull(),
    address: text("address").notNull(),
    birthdate: date("birthdate").notNull(),
    age: integer("age").notNull(),
    kor: rejimenAndKorEnum("kor").notNull(),
    redBgPhotoPath: text("red_bg_photo_path"),
    blueBgPhotoPath: text("blue_bg_photo_path"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("members_army_no_idx").on(table.armyNo),
    uniqueIndex("members_personal_email_idx").on(table.personalEmail),
    uniqueIndex("members_edu_email_idx").on(table.eduEmail).where(sql`${table.eduEmail} is not null`),
    index("members_role_idx").on(table.role),
    index("members_name_idx").on(table.name),
  ],
);

export const studyPrograms = pgTable(
  "study_programs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 220 }).notNull(),
    name: varchar("name", { length: 220 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("study_programs_slug_idx").on(table.slug),
    uniqueIndex("study_programs_name_idx").on(table.name),
    index("study_programs_is_active_idx").on(table.isActive),
  ],
);

export const cadets = pgTable(
  "cadets",
  {
    id: serial("id").primaryKey(),
    matricNo: varchar("matric_no", { length: 80 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    quote: text("quote"),
    displayPhotoPath: text("display_photo_path"),
    cgpa: numeric("cgpa", { precision: 3, scale: 2 }),
    height: numeric("height", { precision: 4, scale: 2 }),
    weight: numeric("weight", { precision: 5, scale: 2 }),
    bmi: numeric("bmi", { precision: 4, scale: 2 }),
    bmiClassification: bmiClassificationEnum("bmi_classification"),
    studyProgramId: integer("study_program_id")
      .references(() => studyPrograms.id),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cadets_matric_no_idx").on(table.matricNo),
    uniqueIndex("cadets_member_id_idx").on(table.memberId),
    index("cadets_intake_id_idx").on(table.intakeId),
    index("cadets_study_program_id_idx").on(table.studyProgramId),
    index("cadets_is_active_idx").on(table.isActive).where(sql`${table.isActive} = true`),
  ],
);

export const cadetAccounts = pgTable(
  "cadet_accounts",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    bankName: bankEnum("bank_name").notNull(),
    accountNumber: bigint("account_number", { mode: "number" }).notNull(),
    duitNowId: bigint("duitnow_id", { mode: "number" }),
    qrCodePath: text("qr_code_path"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cadet_accounts_member_id_idx").on(table.memberId),
  ],
);

export const academicExamResults = pgTable(
  "academic_exam_results",
  {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    cadetId: integer("cadet_id")
      .notNull()
      .references(() => cadets.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 5, scale: 2 }),
    grade: varchar("grade", { length: 20 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academic_exam_results_exam_cadet_idx").on(
      table.examId,
      table.cadetId,
    ),
    index("academic_exam_results_cadet_id_idx").on(table.cadetId),
  ],
);

export const officersAndInstructors = pgTable(
  "officers_and_instructors",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    isActive: boolean("is_active").default(true).notNull(),
    yearOfExperience: integer("year_of_experience").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("officers_and_instructors_member_id_idx").on(table.memberId),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    preferredLocale: localeEnum("preferred_locale").default("en").notNull(),
    status: subscriptionStatusEnum("status").default("PENDING").notNull(),
    confirmationTokenHash: text("confirmation_token_hash"),
    unsubscribeTokenHash: text("unsubscribe_token_hash"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(table.email),
    uniqueIndex("newsletter_subscribers_confirmation_token_hash_idx")
      .on(table.confirmationTokenHash)
      .where(sql`${table.confirmationTokenHash} is not null`),
    uniqueIndex("newsletter_subscribers_unsubscribe_token_hash_idx").on(
      table.unsubscribeTokenHash,
    ).where(sql`${table.unsubscribeTokenHash} is not null`),
    index("newsletter_subscribers_status_idx").on(table.status),
  ],
);

export const newsletterCampaignStatusEnum = pgEnum("newsletter_campaign_status", [
  "DRAFT",
  "SENT",
  "SCHEDULED",
  "SENDING",
  "FAILED",
]);

export const newsletterDeliveryStatusEnum = pgEnum("newsletter_delivery_status", [
  "QUEUED",
  "SENT",
  "FAILED",
]);

export const newsletterCampaigns = pgTable(
  "newsletter_campaigns",
  {
    id: serial("id").primaryKey(),
    subject: varchar("subject", { length: 200 }).notNull(),
    previewText: varchar("preview_text", { length: 200 }),
    contentHtml: text("content_html").notNull(),
    contentText: text("content_text"),
    status: newsletterCampaignStatusEnum("status").default("DRAFT").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    recipientCount: integer("recipient_count").default(0).notNull(),
    sentByAdminUserId: uuid("sent_by_admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("newsletter_campaigns_status_idx").on(table.status),
    index("newsletter_campaigns_scheduled_at_idx").on(table.scheduledAt),
    index("newsletter_campaigns_sent_by_idx").on(table.sentByAdminUserId),
  ],
);

export const newsletterCampaignTranslations = pgTable(
  "newsletter_campaign_translations",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    previewText: varchar("preview_text", { length: 200 }),
    contentHtml: text("content_html").notNull(),
    contentText: text("content_text"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("newsletter_campaign_translations_campaign_locale_idx").on(table.campaignId, table.locale),
    index("newsletter_campaign_translations_campaign_idx").on(table.campaignId),
  ],
);

export const newsletterCampaignAttachments = pgTable(
  "newsletter_campaign_attachments",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storagePath: text("storage_path").notNull(),
    contentType: varchar("content_type", { length: 150 }).notNull(),
    fileSize: integer("file_size").notNull(),
    ...timestamps,
  },
  (table) => [index("newsletter_campaign_attachments_campaign_idx").on(table.campaignId)],
);

export const newsletterCampaignDeliveries = pgTable(
  "newsletter_campaign_deliveries",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id").notNull().references(() => newsletterSubscribers.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 320 }).notNull(),
    locale: localeEnum("locale").notNull(),
    status: newsletterDeliveryStatusEnum("status").default("QUEUED").notNull(),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("newsletter_campaign_deliveries_campaign_subscriber_idx").on(table.campaignId, table.subscriberId),
    index("newsletter_campaign_deliveries_campaign_status_idx").on(table.campaignId, table.status),
    index("newsletter_campaign_deliveries_subscriber_idx").on(table.subscriberId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    location: varchar("location", { length: 220 }).notNull(),
    participantCount: integer("participant_count"),
    coverPhotoPath: text("cover_photo_path"),
    coverPhotoWidth: integer("cover_photo_width"),
    coverPhotoHeight: integer("cover_photo_height"),
    videoPath: text("video_path"),
    status: publicationStatusEnum("status").default("DRAFT").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("events_slug_idx").on(table.slug),
    index("events_start_date_idx").on(table.startDate),
  ],
);

export const eventTranslations = pgTable(
  "event_translations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("event_translations_event_locale_idx").on(
      table.eventId,
      table.locale,
    ),
  ],
);

export const eventTags = pgTable(
  "event_tags",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("event_tags_slug_idx").on(table.slug)],
);

export const eventTagTranslations = pgTable(
  "event_tag_translations",
  {
    id: serial("id").primaryKey(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => eventTags.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("event_tag_translations_tag_locale_idx").on(
      table.tagId,
      table.locale,
    ),
  ],
);

export const eventsToTags = pgTable(
  "events_to_tags",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => eventTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.tagId] }),
    index("events_to_tags_tag_id_idx").on(table.tagId),
  ],
);

export const eventDisplayPhotos = pgTable(
  "event_display_photos",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    photoPath: text("photo_path").notNull(),
    ...timestamps,
  },
  (table) => [index("event_display_photos_event_id_idx").on(table.eventId)],
);

export const webappContents = pgTable(
  "webapp_contents",
  {
    id: serial("id").primaryKey(),
    singletonKey: boolean("singleton_key").default(true).notNull(),
    heroImagePath: text("hero_image_path"),
    googleMapLocationUrl: text("google_map_location_url"),
    officialEmail: varchar("official_email", { length: 320 }),
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    youtubeUrl: text("youtube_url"),
    tiktokUrl: text("tiktok_url"),
    xUrl: text("x_url"),
    updatedByAdminUserId: uuid("updated_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("webapp_contents_singleton_key_idx").on(table.singletonKey),
    check("webapp_contents_singleton_key_check", sql`${table.singletonKey} = true`),
  ],
);

export const frequentlyAskedQuestions = pgTable(
  "frequently_asked_questions",
  {
    id: serial("id").primaryKey(),
    webappContentId: integer("webapp_content_id")
      .notNull()
      .references(() => webappContents.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: publicationStatusEnum("status").default("PUBLISHED").notNull(),
    ...timestamps,
  },
  (table) => [
    index("frequently_asked_questions_webapp_content_id_idx").on(
      table.webappContentId,
    ),
    index("frequently_asked_questions_sort_order_idx").on(table.sortOrder),
  ],
);

export const frequentlyAskedQuestionTranslations = pgTable(
  "frequently_asked_question_translations",
  {
    id: serial("id").primaryKey(),
    faqId: integer("faq_id")
      .notNull()
      .references(() => frequentlyAskedQuestions.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("frequently_asked_question_translations_faq_locale_idx").on(
      table.faqId,
      table.locale,
    ),
  ],
);

export const seeMoreLinks = pgTable(
  "see_more_links",
  {
    id: serial("id").primaryKey(),
    webappContentId: integer("webapp_content_id")
      .notNull()
      .references(() => webappContents.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    link: text("link").notNull(),
    imagePath: text("image_path"),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: publicationStatusEnum("status").default("PUBLISHED").notNull(),
    ...timestamps,
  },
  (table) => [
    index("see_more_links_webapp_content_id_idx").on(table.webappContentId),
    index("see_more_links_sort_order_idx").on(table.sortOrder),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    status: publicationStatusEnum("status").default("PUBLISHED").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("testimonials_sort_order_idx").on(table.sortOrder)],
);

export const testimonialTranslations = pgTable(
  "testimonial_translations",
  {
    id: serial("id").primaryKey(),
    testimonialId: integer("testimonial_id")
      .notNull()
      .references(() => testimonials.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    content: text("content").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("testimonial_translations_testimonial_locale_idx").on(
      table.testimonialId,
      table.locale,
    ),
  ],
);

export const contactReasons = pgTable(
  "contact_reasons",
  {
    id: serial("id").primaryKey(),
    iconKey: varchar("icon_key", { length: 60 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
);

export const contactReasonTranslations = pgTable(
  "contact_reason_translations",
  {
    id: serial("id").primaryKey(),
    reasonId: integer("reason_id")
      .notNull()
      .references(() => contactReasons.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("contact_reason_translations_reason_locale_idx").on(
      table.reasonId,
      table.locale,
    ),
  ],
);

export const treasuryAccounts = pgTable(
  "treasury_accounts",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    treasurerId: uuid("treasurer_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    bankName: bankEnum("bank_name").notNull(),
    accountNumber: bigint("account_number", { mode: "number" }).notNull(),
    qrCodePath: text("qr_code_path"),
    duitNowId: bigint("duitnow_id", { mode: "number" }),
    ...timestamps,
  },
  (table) => [
    index("treasury_accounts_intake_id_idx").on(table.intakeId),
    index("treasury_accounts_treasurer_id_idx").on(table.treasurerId),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    treasurerId: uuid("treasurer_id")
      .notNull()
      .references(() => adminUsers.id),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    purpose: collectionPurposeEnum("purpose").notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 10, scale: 2 }),
    isFixedAmount: boolean("is_fixed_amount").default(true).notNull(),
    isReceiptRequired: boolean("is_receipt_required").default(true).notNull(),
    paymentAccountId: integer("payment_account_id")
      .references(() => treasuryAccounts.id, { onDelete: "set null" }),
    status: publicationStatusEnum("status").default("DRAFT").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collections_slug_idx").on(table.slug),
    index("collections_intake_id_status_idx").on(table.intakeId, table.status),
    index("collections_treasurer_id_idx").on(table.treasurerId),
  ],
);

export const collectionPayments = pgTable(
  "collection_payments",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
    receiptPath: text("receipt_path"),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collection_payments_collection_member_idx").on(
      table.collectionId,
      table.memberId,
    ),
    index("collection_payments_collection_id_idx").on(table.collectionId),
    index("collection_payments_member_id_idx").on(table.memberId),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    treasurerId: uuid("treasurer_id")
      .notNull()
      .references(() => adminUsers.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("expenses_intake_id_idx").on(table.intakeId),
    index("expenses_treasurer_id_idx").on(table.treasurerId),
    index("expenses_created_at_idx").on(table.createdAt),
  ],
);

export const expenseReceipts = pgTable(
  "expense_receipts",
  {
    id: serial("id").primaryKey(),
    expenseId: integer("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("expense_receipts_expense_id_idx").on(table.expenseId),
    index("expense_receipts_created_at_idx").on(table.createdAt),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    title: varchar("title", { length: 200 }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    receiptPath: text("receipt_path").notNull(),
    qrCodePath: text("qr_code_path").notNull(),
    description: text("description"),
    status: claimStatusEnum("status").default("PENDING").notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("claims_member_id_idx").on(table.memberId),
    index("claims_intake_id_idx").on(table.intakeId),
    index("claims_status_idx").on(table.status),
  ],
);
