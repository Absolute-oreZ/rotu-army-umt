CREATE TYPE "public"."admin_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'SECRETARY', 'TREASURER', 'MULTIMEDIA', 'SPORTS', 'WELFARE', 'ACADEMIC');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."intake_explanation_key" AS ENUM('ANIMAL', 'COLOR', 'PHILOSOPHY');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ms', 'zh', 'ta');--> statement-breakpoint
CREATE TYPE "public"."member_rank" AS ENUM('MAJOR', 'CAPTAIN', 'LIEUTENANT', 'SECOND_LIEUTENANT', 'WARRANT_OFFICER', 'SERGEANT', 'KOPERAL', 'LANS_KOPERAL', 'SENIOR_UNDER_OFFICER', 'JUNIOR_UNDER_OFFICER', 'SERGEANT_CADET', 'KOPERAL_CADET', 'PK', 'PKW');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'CADET');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."race" AS ENUM('MALAY', 'CHINESE', 'INDIAN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."religion" AS ENUM('ISLAM', 'CHRISTIAN', 'HINDU', 'BUDDHIST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED');--> statement-breakpoint
CREATE TABLE "academic_exam_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"cadet_info_id" integer NOT NULL,
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
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"full_name" varchar(160),
	"role" "admin_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by_auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadet_infos" (
	"id" serial PRIMARY KEY NOT NULL,
	"matric_no" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"quote" text,
	"display_photo_path" text,
	"study_program_id" integer NOT NULL,
	"intake_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"color" varchar(80) NOT NULL,
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
	"email" varchar(320) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"gender" "gender" NOT NULL,
	"role" "member_role" NOT NULL,
	"religion" "religion" NOT NULL,
	"race" "race" NOT NULL,
	"address" text NOT NULL,
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
	"unsubscribe_token_hash" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_display_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"photo_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_tag_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text,
	"body" text,
	"seo_title" varchar(180),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
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
CREATE TABLE "programs_to_tags" (
	"program_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "programs_to_tags_program_id_tag_id_pk" PRIMARY KEY("program_id","tag_id")
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
CREATE TABLE "webapp_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"singleton_key" boolean DEFAULT true NOT NULL,
	"hero_image_url" text,
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
ALTER TABLE "academic_exam_results" ADD CONSTRAINT "academic_exam_results_cadet_info_id_cadet_infos_id_fk" FOREIGN KEY ("cadet_info_id") REFERENCES "public"."cadet_infos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadet_infos" ADD CONSTRAINT "cadet_infos_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadet_infos" ADD CONSTRAINT "cadet_infos_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadet_infos" ADD CONSTRAINT "cadet_infos_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequently_asked_question_translations" ADD CONSTRAINT "frequently_asked_question_translations_faq_id_frequently_asked_questions_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."frequently_asked_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequently_asked_questions" ADD CONSTRAINT "frequently_asked_questions_webapp_content_id_webapp_contents_id_fk" FOREIGN KEY ("webapp_content_id") REFERENCES "public"."webapp_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_display_photos" ADD CONSTRAINT "intake_display_photos_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanation_translations" ADD CONSTRAINT "intake_patch_explanation_translations_patch_explanation_id_intake_patch_explanations_id_fk" FOREIGN KEY ("patch_explanation_id") REFERENCES "public"."intake_patch_explanations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanations" ADD CONSTRAINT "intake_patch_explanations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_translations" ADD CONSTRAINT "intake_translations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_display_photos" ADD CONSTRAINT "program_display_photos_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_tag_translations" ADD CONSTRAINT "program_tag_translations_tag_id_program_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."program_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_translations" ADD CONSTRAINT "program_translations_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs_to_tags" ADD CONSTRAINT "programs_to_tags_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs_to_tags" ADD CONSTRAINT "programs_to_tags_tag_id_program_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."program_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "see_more_links" ADD CONSTRAINT "see_more_links_webapp_content_id_webapp_contents_id_fk" FOREIGN KEY ("webapp_content_id") REFERENCES "public"."webapp_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webapp_contents" ADD CONSTRAINT "webapp_contents_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_exam_results_exam_cadet_idx" ON "academic_exam_results" USING btree ("exam_id","cadet_info_id");--> statement-breakpoint
CREATE INDEX "academic_exam_results_cadet_info_id_idx" ON "academic_exam_results" USING btree ("cadet_info_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_intake_year_number_idx" ON "academic_years" USING btree ("intake_id","year_number");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_auth_user_id_idx" ON "admin_users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_users_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "cadet_infos_matric_no_idx" ON "cadet_infos" USING btree ("matric_no");--> statement-breakpoint
CREATE UNIQUE INDEX "cadet_infos_member_id_idx" ON "cadet_infos" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "cadet_infos_intake_id_idx" ON "cadet_infos" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cadet_infos_study_program_id_idx" ON "cadet_infos" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "exams_session_id_idx" ON "exams" USING btree ("session_id");--> statement-breakpoint
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
CREATE UNIQUE INDEX "members_email_idx" ON "members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "members_role_idx" ON "members" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_confirmation_token_hash_idx" ON "newsletter_subscribers" USING btree ("confirmation_token_hash") WHERE "newsletter_subscribers"."confirmation_token_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_idx" ON "newsletter_subscribers" USING btree ("unsubscribe_token_hash");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "program_display_photos_program_id_idx" ON "program_display_photos" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "program_tag_translations_tag_locale_idx" ON "program_tag_translations" USING btree ("tag_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "program_tags_slug_idx" ON "program_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "program_translations_program_locale_idx" ON "program_translations" USING btree ("program_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_slug_idx" ON "programs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "programs_start_date_idx" ON "programs" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "programs_to_tags_tag_id_idx" ON "programs_to_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "see_more_links_webapp_content_id_idx" ON "see_more_links" USING btree ("webapp_content_id");--> statement-breakpoint
CREATE INDEX "see_more_links_sort_order_idx" ON "see_more_links" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_academic_year_session_number_idx" ON "sessions" USING btree ("academic_year_id","session_number");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_slug_idx" ON "study_programs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_name_idx" ON "study_programs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "study_programs_is_active_idx" ON "study_programs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "testimonial_translations_testimonial_locale_idx" ON "testimonial_translations" USING btree ("testimonial_id","locale");--> statement-breakpoint
CREATE INDEX "testimonials_sort_order_idx" ON "testimonials" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "webapp_contents_singleton_key_idx" ON "webapp_contents" USING btree ("singleton_key");