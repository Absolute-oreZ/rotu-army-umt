CREATE TYPE "public"."admin_audit_action" AS ENUM('ROLE_CHANGED', 'INVITED', 'ACCEPTED', 'DROPPED');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'SECRETARY', 'TREASURER', 'MULTIMEDIA', 'SPORTS', 'WELFARE', 'ACADEMIC');--> statement-breakpoint
CREATE TYPE "public"."bank" AS ENUM('MAYBANK', 'CIMB', 'RHB', 'BANK_ISLAM', 'BSN', 'PUBLIC_BANK', 'HONG_LEONG', 'AMBANK', 'AFFIN', 'OCBC', 'UOB', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."bmi_classification" AS ENUM('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE');--> statement-breakpoint
CREATE TYPE "public"."collection_purpose" AS ENUM('MONTHLY_COLLECTION', 'WELFARE', 'GOODS', 'FEAST', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."intake_explanation_key" AS ENUM('ANIMAL', 'COLOR', 'PHILOSOPHY');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ms', 'zh', 'ta');--> statement-breakpoint
CREATE TYPE "public"."member_rank" AS ENUM('MAJOR', 'CAPTAIN', 'LIEUTENANT', 'SECOND_LIEUTENANT', 'WARRANT_OFFICER', 'SERGEANT', 'KOPERAL', 'LANS_KOPERAL', 'SENIOR_UNDER_OFFICER', 'JUNIOR_UNDER_OFFICER', 'SERGEANT_CADET', 'KOPERAL_CADET', 'PK', 'PKW');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'CADET');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."race" AS ENUM('MALAY', 'CHINESE', 'INDIAN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."rejimen_and_kor" AS ENUM('Rejimen Askar Melayu Diraja (RAMD)', 'Rejimen Renjer Diraja (RRD)', 'Rejimen Sempadan (RS)', 'Kor Armor Diraja (KAD)', 'Rejimen Artileri Diraja (RAD)', 'Rejimen Semboyan Diraja (RSD)', 'Rejimen Askar Jurutera Diraja (RAJD)', 'Kor Polis Tentera Diraja (KPTD)', 'Kor Risik Diraja (KRD)', 'Grup Gerak Khas (GGK)', 'Kor Perkhidmatan Am (KPA)', 'Kor Perkhidmatan Diraja (KPD)', 'Kor Jurutera Letrik dan Jentera Diraja (KJLJD)', 'Kor Kesihatan Diraja (KKD)', 'Kor Agama Angkatan Tentera (KAGAT)', 'Kor Ordnans Diraja (KOD)', 'Rejimen Askar Wataniah (RAW)');--> statement-breakpoint
CREATE TYPE "public"."religion" AS ENUM('ISLAM', 'CHRISTIAN', 'HINDU', 'BUDDHIST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED');--> statement-breakpoint
CREATE TABLE "academic_exam_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"score" numeric(5, 2),
	"grade" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"year_number" integer NOT NULL,
	"calendar_year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "admin_role" NOT NULL,
	"intake_id" integer,
	"invited_by_auth_user_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_role_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "admin_audit_action" DEFAULT 'ROLE_CHANGED' NOT NULL,
	"changed_by_admin_user_id" uuid NOT NULL,
	"target_admin_user_id" uuid,
	"target_member_name" text NOT NULL,
	"old_role" "admin_role",
	"new_role" "admin_role",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"member_id" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "admin_role" NOT NULL,
	"intake_id" integer,
	"invited_by_auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadets" (
	"id" serial PRIMARY KEY NOT NULL,
	"matric_no" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"quote" text,
	"display_photo_path" text,
	"cgpa" numeric(3, 2),
	"height" numeric(4, 2),
	"weight" numeric(5, 2),
	"bmi" numeric(4, 2),
	"bmi_classification" "bmi_classification",
	"study_program_id" integer,
	"intake_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"receipt_path" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"treasurer_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"purpose" "collection_purpose" NOT NULL,
	"description" text,
	"amount" numeric(10, 2),
	"is_fixed_amount" boolean DEFAULT true NOT NULL,
	"is_receipt_required" boolean DEFAULT true NOT NULL,
	"payment_account_id" integer,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_reason_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reason_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon_key" varchar(60) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_display_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"photo_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tag_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text,
	"seo_title" varchar(180),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" varchar(220) NOT NULL,
	"participant_count" integer,
	"cover_photo_path" text,
	"cover_photo_width" integer,
	"cover_photo_height" integer,
	"video_url" text,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events_to_tags" (
	"event_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "events_to_tags_event_id_tag_id_pk" PRIMARY KEY("event_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"exam_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" integer NOT NULL,
	"file_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"treasurer_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frequently_asked_question_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"faq_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frequently_asked_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"webapp_content_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "publication_status" DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_display_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"photo_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_patch_explanation_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"patch_explanation_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_patch_explanations" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"key" "intake_explanation_key" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"summary" text,
	"seo_title" varchar(180),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_no" varchar(60) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"start_year" integer NOT NULL,
	"color" varchar(80),
	"tag_line" text,
	"cover_photo_path" text,
	"patch_photo_path" text,
	"inner_photo_path" text,
	"tshirt_photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"army_no" integer NOT NULL,
	"rank" "member_rank" NOT NULL,
	"name" varchar(180) NOT NULL,
	"personal_email" varchar(320) NOT NULL,
	"edu_email" varchar(320),
	"display_name" varchar(120) NOT NULL,
	"gender" "gender" NOT NULL,
	"role" "member_role" NOT NULL,
	"religion" "religion" NOT NULL,
	"race" "race" NOT NULL,
	"address" text NOT NULL,
	"birthdate" date NOT NULL,
	"age" integer NOT NULL,
	"kor" "rejimen_and_kor" NOT NULL,
	"red_bg_photo_path" text,
	"blue_bg_photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"preferred_locale" "locale" DEFAULT 'en' NOT NULL,
	"status" "subscription_status" DEFAULT 'PENDING' NOT NULL,
	"confirmation_token_hash" text,
	"unsubscribe_token_hash" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "officers_and_instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"year_of_experience" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "see_more_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"webapp_content_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"link" text NOT NULL,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "publication_status" DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(220) NOT NULL,
	"name" varchar(220) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"testimonial_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"status" "publication_status" DEFAULT 'PUBLISHED' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"treasurer_id" uuid NOT NULL,
	"bank_name" "bank" NOT NULL,
	"account_number" bigint NOT NULL,
	"qr_code_path" text,
	"duitnow_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webapp_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"singleton_key" boolean DEFAULT true NOT NULL,
	"hero_image_url" text,
	"google_map_location_url" text,
	"official_email" varchar(320),
	"facebook_url" text,
	"instagram_url" text,
	"youtube_url" text,
	"tiktok_url" text,
	"x_url" text,
	"updated_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webapp_contents_singleton_key_check" CHECK ("webapp_contents"."singleton_key" = true)
);
--> statement-breakpoint
ALTER TABLE "academic_exam_results" ADD CONSTRAINT "academic_exam_results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_exam_results" ADD CONSTRAINT "academic_exam_results_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_payments" ADD CONSTRAINT "collection_payments_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_payments" ADD CONSTRAINT "collection_payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_treasurer_id_admin_users_id_fk" FOREIGN KEY ("treasurer_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_payment_account_id_treasury_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."treasury_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_reason_translations" ADD CONSTRAINT "contact_reason_translations_reason_id_contact_reasons_id_fk" FOREIGN KEY ("reason_id") REFERENCES "public"."contact_reasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_display_photos" ADD CONSTRAINT "event_display_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tag_translations" ADD CONSTRAINT "event_tag_translations_tag_id_event_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."event_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_translations" ADD CONSTRAINT "event_translations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_tags" ADD CONSTRAINT "events_to_tags_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_tags" ADD CONSTRAINT "events_to_tags_tag_id_event_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."event_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_treasurer_id_admin_users_id_fk" FOREIGN KEY ("treasurer_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequently_asked_question_translations" ADD CONSTRAINT "frequently_asked_question_translations_faq_id_frequently_asked_questions_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."frequently_asked_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequently_asked_questions" ADD CONSTRAINT "frequently_asked_questions_webapp_content_id_webapp_contents_id_fk" FOREIGN KEY ("webapp_content_id") REFERENCES "public"."webapp_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_display_photos" ADD CONSTRAINT "intake_display_photos_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanation_translations" ADD CONSTRAINT "intake_patch_explanation_translations_patch_explanation_id_intake_patch_explanations_id_fk" FOREIGN KEY ("patch_explanation_id") REFERENCES "public"."intake_patch_explanations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanations" ADD CONSTRAINT "intake_patch_explanations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_translations" ADD CONSTRAINT "intake_translations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers_and_instructors" ADD CONSTRAINT "officers_and_instructors_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "see_more_links" ADD CONSTRAINT "see_more_links_webapp_content_id_webapp_contents_id_fk" FOREIGN KEY ("webapp_content_id") REFERENCES "public"."webapp_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_treasurer_id_admin_users_id_fk" FOREIGN KEY ("treasurer_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webapp_contents" ADD CONSTRAINT "webapp_contents_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_exam_results_exam_cadet_idx" ON "academic_exam_results" USING btree ("exam_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_exam_results_cadet_id_idx" ON "academic_exam_results" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_intake_year_number_idx" ON "academic_years" USING btree ("intake_id","year_number");--> statement-breakpoint
CREATE INDEX "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_changed_by_idx" ON "admin_role_audit_logs" USING btree ("changed_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_created_at_idx" ON "admin_role_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_auth_user_id_idx" ON "admin_users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_member_id_idx" ON "admin_users" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_users_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admin_users_intake_id_idx" ON "admin_users" USING btree ("intake_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_matric_no_idx" ON "cadets" USING btree ("matric_no");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_member_id_idx" ON "cadets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "cadets_intake_id_idx" ON "cadets" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cadets_study_program_id_idx" ON "cadets" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "cadets_is_active_idx" ON "cadets" USING btree ("is_active") WHERE "cadets"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_payments_collection_member_idx" ON "collection_payments" USING btree ("collection_id","member_id");--> statement-breakpoint
CREATE INDEX "collection_payments_collection_id_idx" ON "collection_payments" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_payments_member_id_idx" ON "collection_payments" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "collections_intake_id_status_idx" ON "collections" USING btree ("intake_id","status");--> statement-breakpoint
CREATE INDEX "collections_treasurer_id_idx" ON "collections" USING btree ("treasurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_reason_translations_reason_locale_idx" ON "contact_reason_translations" USING btree ("reason_id","locale");--> statement-breakpoint
CREATE INDEX "event_display_photos_event_id_idx" ON "event_display_photos" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_tag_translations_tag_locale_idx" ON "event_tag_translations" USING btree ("tag_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "event_tags_slug_idx" ON "event_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "event_translations_event_locale_idx" ON "event_translations" USING btree ("event_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "events_to_tags_tag_id_idx" ON "events_to_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "exams_session_id_idx" ON "exams" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "expense_receipts_expense_id_idx" ON "expense_receipts" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expense_receipts_created_at_idx" ON "expense_receipts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "expenses_intake_id_idx" ON "expenses" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "expenses_treasurer_id_idx" ON "expenses" USING btree ("treasurer_id");--> statement-breakpoint
CREATE INDEX "expenses_created_at_idx" ON "expenses" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "frequently_asked_question_translations_faq_locale_idx" ON "frequently_asked_question_translations" USING btree ("faq_id","locale");--> statement-breakpoint
CREATE INDEX "frequently_asked_questions_webapp_content_id_idx" ON "frequently_asked_questions" USING btree ("webapp_content_id");--> statement-breakpoint
CREATE INDEX "frequently_asked_questions_sort_order_idx" ON "frequently_asked_questions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "intake_display_photos_intake_id_idx" ON "intake_display_photos" USING btree ("intake_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_patch_explanation_translations_patch_explanation_locale_idx" ON "intake_patch_explanation_translations" USING btree ("patch_explanation_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_patch_explanations_intake_key_idx" ON "intake_patch_explanations" USING btree ("intake_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_translations_intake_locale_idx" ON "intake_translations" USING btree ("intake_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "intakes_intake_no_idx" ON "intakes" USING btree ("intake_no");--> statement-breakpoint
CREATE UNIQUE INDEX "intakes_display_name_idx" ON "intakes" USING btree ("display_name");--> statement-breakpoint
CREATE UNIQUE INDEX "intakes_slug_idx" ON "intakes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "intakes_start_year_idx" ON "intakes" USING btree ("start_year");--> statement-breakpoint
CREATE UNIQUE INDEX "members_army_no_idx" ON "members" USING btree ("army_no");--> statement-breakpoint
CREATE UNIQUE INDEX "members_personal_email_idx" ON "members" USING btree ("personal_email");--> statement-breakpoint
CREATE UNIQUE INDEX "members_edu_email_idx" ON "members" USING btree ("edu_email") WHERE "members"."edu_email" is not null;--> statement-breakpoint
CREATE INDEX "members_role_idx" ON "members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "members_name_idx" ON "members" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_confirmation_token_hash_idx" ON "newsletter_subscribers" USING btree ("confirmation_token_hash") WHERE "newsletter_subscribers"."confirmation_token_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_idx" ON "newsletter_subscribers" USING btree ("unsubscribe_token_hash") WHERE "newsletter_subscribers"."unsubscribe_token_hash" is not null;--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "officers_and_instructors_member_id_idx" ON "officers_and_instructors" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "see_more_links_webapp_content_id_idx" ON "see_more_links" USING btree ("webapp_content_id");--> statement-breakpoint
CREATE INDEX "see_more_links_sort_order_idx" ON "see_more_links" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_academic_year_session_number_idx" ON "sessions" USING btree ("academic_year_id","session_number");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_slug_idx" ON "study_programs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_name_idx" ON "study_programs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "study_programs_is_active_idx" ON "study_programs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "testimonial_translations_testimonial_locale_idx" ON "testimonial_translations" USING btree ("testimonial_id","locale");--> statement-breakpoint
CREATE INDEX "testimonials_sort_order_idx" ON "testimonials" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "treasury_accounts_intake_id_idx" ON "treasury_accounts" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_treasurer_id_idx" ON "treasury_accounts" USING btree ("treasurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webapp_contents_singleton_key_idx" ON "webapp_contents" USING btree ("singleton_key");