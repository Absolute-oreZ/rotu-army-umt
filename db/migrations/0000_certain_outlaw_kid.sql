CREATE TYPE "public"."accommodation_type" AS ENUM('HOSTEL', 'RENTAL');--> statement-breakpoint
CREATE TYPE "public"."admin_audit_action" AS ENUM('ROLE_CHANGED', 'INVITED', 'ACCEPTED', 'DROPPED');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'SECRETARY', 'TREASURER', 'MULTIMEDIA', 'SPORTS', 'WELFARE', 'ACADEMIC');--> statement-breakpoint
CREATE TYPE "public"."assessment_result" AS ENUM('PASS', 'FAIL');--> statement-breakpoint
CREATE TYPE "public"."attend_type" AS ENUM('B', 'C');--> statement-breakpoint
CREATE TYPE "public"."bank" AS ENUM('MAYBANK', 'CIMB', 'RHB', 'BANK_ISLAM', 'BSN', 'PUBLIC_BANK', 'HONG_LEONG', 'AMBANK', 'AFFIN', 'OCBC', 'UOB', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."bmi_classification" AS ENUM('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('PENDING', 'FULFILLED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."collection_purpose" AS ENUM('MONTHLY_COLLECTION', 'WELFARE', 'GOODS', 'FEAST', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."intake_explanation_key" AS ENUM('ANIMAL', 'COLOR', 'PHILOSOPHY');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ms', 'zh', 'ta');--> statement-breakpoint
CREATE TYPE "public"."member_rank" AS ENUM('MAJOR', 'CAPTAIN', 'LIEUTENANT', 'SECOND_LIEUTENANT', 'WARRANT_OFFICER', 'SERGEANT', 'KOPERAL', 'LANS_KOPERAL', 'SENIOR_UNDER_OFFICER', 'JUNIOR_UNDER_OFFICER', 'SERGEANT_CADET', 'KOPERAL_CADET', 'PK', 'PKW');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OFFICER', 'INSTRUCTOR', 'CADET');--> statement-breakpoint
CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('DRAFT', 'SENT', 'SCHEDULED', 'SENDING', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."newsletter_delivery_status" AS ENUM('QUEUED', 'SENT', 'FAILED');--> statement-breakpoint
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
CREATE TABLE "academic_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"gpa" numeric(3, 2),
	"cgpa" numeric(3, 2),
	"result_slip_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_timetables" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"occupied_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timetable_pdf_path" text,
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
CREATE TABLE "accommodations" (
	"id" serial PRIMARY KEY NOT NULL,
	"cadet_id" integer NOT NULL,
	"type" "accommodation_type" DEFAULT 'HOSTEL' NOT NULL,
	"address" text,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_intake_scope_check" CHECK (("admin_users"."role" in ('SECRETARY', 'TREASURER', 'SPORTS', 'WELFARE', 'ACADEMIC') and "admin_users"."intake_id" is not null) or ("admin_users"."role" in ('OFFICER', 'INSTRUCTOR', 'MULTIMEDIA') and "admin_users"."intake_id" is null))
);
--> statement-breakpoint
CREATE TABLE "apfa_record_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"run_seconds" integer,
	"run_pass" boolean,
	"pull_up" integer,
	"pull_up_pass" boolean,
	"swimming_metres" integer,
	"swimming_pass" boolean,
	"floating_seconds" integer,
	"floating_pass" boolean,
	"result" "assessment_result",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apfa_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"record_date" date NOT NULL,
	"session" integer NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attend_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"cadet_id" integer NOT NULL,
	"record_date" date NOT NULL,
	"attend_type" "attend_type" NOT NULL,
	"source" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadet_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"bank_name" "bank" NOT NULL,
	"account_number_text" text NOT NULL,
	"duitnow_id_text" text,
	"qr_code_path" text,
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
	"platoon_id" integer,
	"member_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"intake_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"receipt_path" text NOT NULL,
	"qr_code_path" text NOT NULL,
	"description" text,
	"status" "claim_status" DEFAULT 'PENDING' NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
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
	"video_path" text,
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
CREATE TABLE "health_record_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"age" integer NOT NULL,
	"height" numeric(5, 2) NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"bmi" numeric(4, 2) NOT NULL,
	"bmi_classification" "bmi_classification" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"record_date" date NOT NULL,
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
CREATE TABLE "newsletter_campaign_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" varchar(150) NOT NULL,
	"file_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"locale" "locale" NOT NULL,
	"status" "newsletter_delivery_status" DEFAULT 'QUEUED' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"subject" varchar(200) NOT NULL,
	"preview_text" varchar(200),
	"content_html" text NOT NULL,
	"content_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(200) NOT NULL,
	"preview_text" varchar(200),
	"content_html" text NOT NULL,
	"content_text" text,
	"status" "newsletter_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_by_admin_user_id" uuid,
	"sending_lease_id" text,
	"sending_lease_expires_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "platoons" (
	"id" serial PRIMARY KEY NOT NULL,
	"platoon_no" varchar(40) NOT NULL,
	"display_name" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"color" varchar(40),
	"tag_line" varchar(240),
	"flag_photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "religious_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(80) NOT NULL,
	"record_date" date NOT NULL,
	"title" varchar(140) NOT NULL,
	"remarks" text,
	"location" text NOT NULL,
	"meeting_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "religious_activity_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"photo_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "see_more_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"webapp_content_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"link" text NOT NULL,
	"image_path" text,
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
	"completion_year" integer DEFAULT 3 NOT NULL,
	"is_supported" boolean DEFAULT true NOT NULL,
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
	"account_number_text" text NOT NULL,
	"qr_code_path" text,
	"duitnow_id_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uka_record_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"push_up" integer,
	"push_up_pass" boolean,
	"sit_up" integer,
	"sit_up_pass" boolean,
	"run_seconds" integer,
	"run_pass" boolean,
	"result" "assessment_result",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uka_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"intake_id" integer NOT NULL,
	"record_date" date NOT NULL,
	"session" integer NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webapp_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"singleton_key" boolean DEFAULT true NOT NULL,
	"hero_image_path" text,
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
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_timetables" ADD CONSTRAINT "academic_timetables_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_timetables" ADD CONSTRAINT "academic_timetables_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apfa_record_assessments" ADD CONSTRAINT "apfa_record_assessments_record_id_apfa_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."apfa_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apfa_record_assessments" ADD CONSTRAINT "apfa_record_assessments_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apfa_records" ADD CONSTRAINT "apfa_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attend_records" ADD CONSTRAINT "attend_records_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadet_accounts" ADD CONSTRAINT "cadet_accounts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_platoon_id_platoons_id_fk" FOREIGN KEY ("platoon_id") REFERENCES "public"."platoons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "health_record_metrics" ADD CONSTRAINT "health_record_metrics_record_id_health_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."health_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_record_metrics" ADD CONSTRAINT "health_record_metrics_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_display_photos" ADD CONSTRAINT "intake_display_photos_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanation_translations" ADD CONSTRAINT "intake_patch_explanation_translations_patch_explanation_id_intake_patch_explanations_id_fk" FOREIGN KEY ("patch_explanation_id") REFERENCES "public"."intake_patch_explanations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_patch_explanations" ADD CONSTRAINT "intake_patch_explanations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_translations" ADD CONSTRAINT "intake_translations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_attachments" ADD CONSTRAINT "newsletter_campaign_attachments_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_translations" ADD CONSTRAINT "newsletter_campaign_translations_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_sent_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("sent_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers_and_instructors" ADD CONSTRAINT "officers_and_instructors_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "religious_activity_photos" ADD CONSTRAINT "religious_activity_photos_activity_id_religious_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."religious_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "see_more_links" ADD CONSTRAINT "see_more_links_webapp_content_id_webapp_contents_id_fk" FOREIGN KEY ("webapp_content_id") REFERENCES "public"."webapp_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_treasurer_id_admin_users_id_fk" FOREIGN KEY ("treasurer_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_record_assessments" ADD CONSTRAINT "uka_record_assessments_record_id_uka_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."uka_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_record_assessments" ADD CONSTRAINT "uka_record_assessments_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_records" ADD CONSTRAINT "uka_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webapp_contents" ADD CONSTRAINT "webapp_contents_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_exam_results_exam_cadet_idx" ON "academic_exam_results" USING btree ("exam_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_exam_results_cadet_id_idx" ON "academic_exam_results" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_results_session_cadet_idx" ON "academic_results" USING btree ("session_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_results_session_id_idx" ON "academic_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "academic_results_cadet_id_idx" ON "academic_results" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_timetables_session_cadet_idx" ON "academic_timetables" USING btree ("session_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_timetables_session_id_idx" ON "academic_timetables" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "academic_timetables_cadet_id_idx" ON "academic_timetables" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_intake_year_number_idx" ON "academic_years" USING btree ("intake_id","year_number");--> statement-breakpoint
CREATE UNIQUE INDEX "accommodations_cadet_id_idx" ON "accommodations" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_changed_by_idx" ON "admin_role_audit_logs" USING btree ("changed_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_created_at_idx" ON "admin_role_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_auth_user_id_idx" ON "admin_users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_member_id_idx" ON "admin_users" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_users_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admin_users_intake_id_idx" ON "admin_users" USING btree ("intake_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apfa_record_assessments_record_cadet_idx" ON "apfa_record_assessments" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "apfa_record_assessments_record_id_idx" ON "apfa_record_assessments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "apfa_record_assessments_cadet_id_idx" ON "apfa_record_assessments" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apfa_records_intake_session_year_idx" ON "apfa_records" USING btree ("intake_id","session","year");--> statement-breakpoint
CREATE INDEX "apfa_records_intake_date_idx" ON "apfa_records" USING btree ("intake_id","record_date");--> statement-breakpoint
CREATE INDEX "attend_records_cadet_id_idx" ON "attend_records" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "attend_records_record_date_idx" ON "attend_records" USING btree ("record_date");--> statement-breakpoint
CREATE UNIQUE INDEX "cadet_accounts_member_id_idx" ON "cadet_accounts" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_matric_no_idx" ON "cadets" USING btree ("matric_no");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_member_id_idx" ON "cadets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "cadets_intake_id_idx" ON "cadets" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cadets_platoon_id_idx" ON "cadets" USING btree ("platoon_id");--> statement-breakpoint
CREATE INDEX "cadets_study_program_id_idx" ON "cadets" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "cadets_is_active_idx" ON "cadets" USING btree ("is_active") WHERE "cadets"."is_active" = true;--> statement-breakpoint
CREATE INDEX "claims_member_id_idx" ON "claims" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "claims_intake_id_idx" ON "claims" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
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
CREATE UNIQUE INDEX "health_record_metrics_record_cadet_idx" ON "health_record_metrics" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "health_record_metrics_record_id_idx" ON "health_record_metrics" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "health_record_metrics_cadet_id_idx" ON "health_record_metrics" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "health_records_intake_date_idx" ON "health_records" USING btree ("intake_id","record_date");--> statement-breakpoint
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
CREATE INDEX "newsletter_campaign_attachments_campaign_idx" ON "newsletter_campaign_attachments" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_deliveries_campaign_subscriber_idx" ON "newsletter_campaign_deliveries" USING btree ("campaign_id","subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_deliveries_idempotency_key_idx" ON "newsletter_campaign_deliveries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_deliveries_campaign_status_idx" ON "newsletter_campaign_deliveries" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_deliveries_subscriber_idx" ON "newsletter_campaign_deliveries" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_translations_campaign_locale_idx" ON "newsletter_campaign_translations" USING btree ("campaign_id","locale");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_translations_campaign_idx" ON "newsletter_campaign_translations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_scheduled_at_idx" ON "newsletter_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_sent_by_idx" ON "newsletter_campaigns" USING btree ("sent_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_lease_expires_idx" ON "newsletter_campaigns" USING btree ("sending_lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_confirmation_token_hash_idx" ON "newsletter_subscribers" USING btree ("confirmation_token_hash") WHERE "newsletter_subscribers"."confirmation_token_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_idx" ON "newsletter_subscribers" USING btree ("unsubscribe_token_hash") WHERE "newsletter_subscribers"."unsubscribe_token_hash" is not null;--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "officers_and_instructors_member_id_idx" ON "officers_and_instructors" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platoons_platoon_no_idx" ON "platoons" USING btree ("platoon_no");--> statement-breakpoint
CREATE UNIQUE INDEX "platoons_slug_idx" ON "platoons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "platoons_status_idx" ON "platoons" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_entries_identifier_action_idx" ON "rate_limit_entries" USING btree ("identifier","action");--> statement-breakpoint
CREATE INDEX "rate_limit_entries_expires_at_idx" ON "rate_limit_entries" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "religious_activities_title_idx" ON "religious_activities" USING btree ("title");--> statement-breakpoint
CREATE INDEX "religious_activities_type_idx" ON "religious_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "religious_activities_record_date_idx" ON "religious_activities" USING btree ("record_date");--> statement-breakpoint
CREATE INDEX "religious_activity_photos_activity_id_idx" ON "religious_activity_photos" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "see_more_links_webapp_content_id_idx" ON "see_more_links" USING btree ("webapp_content_id");--> statement-breakpoint
CREATE INDEX "see_more_links_sort_order_idx" ON "see_more_links" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_academic_year_session_number_idx" ON "sessions" USING btree ("academic_year_id","session_number");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_slug_idx" ON "study_programs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "study_programs_name_idx" ON "study_programs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "study_programs_is_supported_idx" ON "study_programs" USING btree ("is_supported");--> statement-breakpoint
CREATE UNIQUE INDEX "testimonial_translations_testimonial_locale_idx" ON "testimonial_translations" USING btree ("testimonial_id","locale");--> statement-breakpoint
CREATE INDEX "testimonials_sort_order_idx" ON "testimonials" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "treasury_accounts_intake_id_idx" ON "treasury_accounts" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_treasurer_id_idx" ON "treasury_accounts" USING btree ("treasurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uka_record_assessments_record_cadet_idx" ON "uka_record_assessments" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "uka_record_assessments_record_id_idx" ON "uka_record_assessments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "uka_record_assessments_cadet_id_idx" ON "uka_record_assessments" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uka_records_intake_session_year_idx" ON "uka_records" USING btree ("intake_id","session","year");--> statement-breakpoint
CREATE INDEX "uka_records_intake_date_idx" ON "uka_records" USING btree ("intake_id","record_date");--> statement-breakpoint
CREATE UNIQUE INDEX "webapp_contents_singleton_key_idx" ON "webapp_contents" USING btree ("singleton_key");