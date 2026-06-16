CREATE TYPE "public"."rejimen_and_kor" AS ENUM('Rejimen Askar Melayu Diraja (RAMD)', 'Rejimen Renjer Diraja (RRD)', 'Rejimen Sempadan (RS)', 'Kor Armor Diraja (KAD)', 'Rejimen Artileri Diraja (RAD)', 'Rejimen Semboyan Diraja (RSD)', 'Rejimen Askar Jurutera Diraja (RAJD)', 'Kor Polis Tentera Diraja (KPTD)', 'Kor Risik Diraja (KRD)', 'Grup Gerak Khas (GGK)', 'Kor Perkhidmatan Am (KPA)', 'Kor Perkhidmatan Diraja (KPD)', 'Kor Jurutera Letrik dan Jentera Diraja (KJLJD)', 'Kor Kesihatan Diraja (KKD)', 'Kor Agama Angkatan Tentera (KAGAT)', 'Kor Ordnans Diraja (KOD)', 'Rejimen Askar Wataniah (RAW)');--> statement-breakpoint
CREATE TABLE "officers_and_instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"year_of_experience" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cadet_infos" RENAME TO "cadets";--> statement-breakpoint
ALTER TABLE "academic_exam_results" RENAME COLUMN "cadet_info_id" TO "cadet_id";--> statement-breakpoint
ALTER TABLE "academic_exam_results" DROP CONSTRAINT "academic_exam_results_cadet_info_id_cadet_infos_id_fk";
--> statement-breakpoint
ALTER TABLE "cadets" DROP CONSTRAINT "cadet_infos_study_program_id_study_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "cadets" DROP CONSTRAINT "cadet_infos_intake_id_intakes_id_fk";
--> statement-breakpoint
ALTER TABLE "cadets" DROP CONSTRAINT "cadet_infos_member_id_members_id_fk";
--> statement-breakpoint
DROP INDEX "academic_exam_results_cadet_info_id_idx";--> statement-breakpoint
DROP INDEX "cadet_infos_matric_no_idx";--> statement-breakpoint
DROP INDEX "cadet_infos_member_id_idx";--> statement-breakpoint
DROP INDEX "cadet_infos_intake_id_idx";--> statement-breakpoint
DROP INDEX "cadet_infos_study_program_id_idx";--> statement-breakpoint
DROP INDEX "academic_exam_results_exam_cadet_idx";--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "birthdate" date NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "age" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "kor" "rejimen_and_kor" NOT NULL;--> statement-breakpoint
ALTER TABLE "officers_and_instructors" ADD CONSTRAINT "officers_and_instructors_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "officers_and_instructors_member_id_idx" ON "officers_and_instructors" USING btree ("member_id");--> statement-breakpoint
ALTER TABLE "academic_exam_results" ADD CONSTRAINT "academic_exam_results_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_exam_results_cadet_id_idx" ON "academic_exam_results" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_matric_no_idx" ON "cadets" USING btree ("matric_no");--> statement-breakpoint
CREATE UNIQUE INDEX "cadets_member_id_idx" ON "cadets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "cadets_intake_id_idx" ON "cadets" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cadets_study_program_id_idx" ON "cadets" USING btree ("study_program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_exam_results_exam_cadet_idx" ON "academic_exam_results" USING btree ("exam_id","cadet_id");