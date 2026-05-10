import { sql } from "drizzle-orm";
import {
  boolean,
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

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);

export const memberRoleEnum = pgEnum("member_role", [
  "OFFICER",
  "INSTRUCTOR",
  "CADET",
]);

export const memberRankEnum = pgEnum("member_rank", [
  "PK",
  "PKW",
  "KPL_CADET",
  "SJN_CADET",
  "KPL",
  "SJN",
]);

export const studyProgramEnum = pgEnum("study_program", [
  "EKONOMI (SUMBER ALAM)",
  "KAUNSELING",
  "MATEMATIK KEWANGAN",
  "NANOFIZIK",
  "PENGURUSAN MARITIM",
  "PENGURUSAN OPERASI MARITIM",
  "PENGURUSAN PEMASARAN",
  "PENGURUSAN (PENGAJIAN POLISI)",
  "PERAKAUNAN",
  "PERKHIDMATAN MAKANAN DAN PEMAKANAN",
  "SAINS (ANALITIK DATA)",
  "SAINS (SAINS BIOLOGI)",
  "SAINS (BIOLOGI MARIN)",
  "SAINS GUNAAN (ELEKTRONIK DAN INSTRUMENTASI)",
  "SAINS GUNAAN (PEMULIHARAAN DAN PENGURUSAN BIODIVERSITI)",
  "SAINS GUNAAN (TEKNOLOGI MARITIM)",
  "SAINS KIMIA",
  "SAINS (KIMIA ANALISIS DAN PERSEKITARAN)",
  "SAINS KOMPUTER (INFORMATIK MARITIM)",
  "SAINS KOMPUTER (KEJURUTERAAN PERISIAN)",
  "SAINS KOMPUTER (KOMPUTERAN MUDAH ALIH)",
  "SAINS MAKANAN (TEKNOLOGI MAKANAN)",
  "SAINS MARIN",
  "SAINS (MATEMATIK GUNAAN)",
  "SAINS (SAINS NAUTIKAL DAN PENGANGKUTAN MARITIM)",
  "TEKNOLOGI (ALAM SEKITAR)",
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
    email: varchar("email", { length: 320 }).notNull(),
    fullName: varchar("full_name", { length: 160 }),
    role: adminRoleEnum("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    invitedByAuthUserId: uuid("invited_by_auth_user_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("admin_users_auth_user_id_idx").on(table.authUserId),
    uniqueIndex("admin_users_email_idx").on(table.email),
    index("admin_users_role_idx").on(table.role),
  ],
);

export const intakes = pgTable(
  "intakes",
  {
    id: serial("id").primaryKey(),
    intakeNo: varchar("intake_no", { length: 60 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    isReadyForPublic: boolean("is_ready_for_public").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    startYear: integer("start_year").notNull(),
    color: varchar("color", { length: 80 }).notNull(),
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
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: text("seo_description"),
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
    locale: localeEnum("locale").notNull(),
    key: intakeExplanationKeyEnum("key").notNull(),
    value: text("value").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("intake_patch_explanations_intake_locale_key_idx").on(
      table.intakeId,
      table.locale,
      table.key,
    ),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    gender: genderEnum("gender").notNull(),
    role: memberRoleEnum("role").notNull(),
    religion: varchar("religion", { length: 80 }).notNull(),
    race: varchar("race", { length: 80 }).notNull(),
    address: text("address").notNull(),
    redBgPhotoPath: text("red_bg_photo_path"),
    blueBgPhotoPath: text("blue_bg_photo_path"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("members_army_no_idx").on(table.armyNo),
    uniqueIndex("members_email_idx").on(table.email),
    index("members_role_idx").on(table.role),
  ],
);

export const cadetInfos = pgTable(
  "cadet_infos",
  {
    id: serial("id").primaryKey(),
    matrictNo: varchar("matrict_no", { length: 80 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    quote: text("quote"),
    displayPhotoPath: text("display_photo_path"),
    studyProgram: studyProgramEnum("study_program").notNull(),
    intakeId: integer("intake_id")
      .notNull()
      .references(() => intakes.id),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cadet_infos_matrict_no_idx").on(table.matrictNo),
    uniqueIndex("cadet_infos_member_id_idx").on(table.memberId),
    index("cadet_infos_intake_id_idx").on(table.intakeId),
    index("cadet_infos_study_program_idx").on(table.studyProgram),
  ],
);

export const academicExamResults = pgTable(
  "academic_exam_results",
  {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    score: numeric("score", { precision: 5, scale: 2 }),
    grade: varchar("grade", { length: 20 }),
    cadetInfoId: integer("cadet_info_id").references(() => cadetInfos.id),
  },
  (table) => [
    uniqueIndex("academic_exam_results_exam_member_idx").on(
      table.examId,
      table.memberId,
    ),
    index("academic_exam_results_cadet_info_id_idx").on(table.cadetInfoId),
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
    unsubscribeTokenHash: text("unsubscribe_token_hash").notNull(),
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
    ),
    index("newsletter_subscribers_status_idx").on(table.status),
  ],
);

export const programs = pgTable(
  "programs",
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
    videoUrl: text("video_url"),
    isPublished: boolean("is_published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("programs_slug_idx").on(table.slug),
    index("programs_start_date_idx").on(table.startDate),
  ],
);

export const programTranslations = pgTable(
  "program_translations",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary"),
    body: text("body"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("program_translations_program_locale_idx").on(
      table.programId,
      table.locale,
    ),
  ],
);

export const programTags = pgTable(
  "program_tags",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
  },
  (table) => [uniqueIndex("program_tags_slug_idx").on(table.slug)],
);

export const programTagTranslations = pgTable(
  "program_tag_translations",
  {
    id: serial("id").primaryKey(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => programTags.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
  },
  (table) => [
    uniqueIndex("program_tag_translations_tag_locale_idx").on(
      table.tagId,
      table.locale,
    ),
  ],
);

export const programsToTags = pgTable(
  "programs_to_tags",
  {
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => programTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.programId, table.tagId] }),
    index("programs_to_tags_tag_id_idx").on(table.tagId),
  ],
);

export const programDisplayPhotos = pgTable(
  "program_display_photos",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    photoPath: text("photo_path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("program_display_photos_program_id_idx").on(table.programId)],
);
