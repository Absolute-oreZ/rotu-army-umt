CREATE TYPE "public"."assessment_result" AS ENUM('PASS', 'FAIL');--> statement-breakpoint
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
ALTER TABLE "apfa_record_assessments" ADD CONSTRAINT "apfa_record_assessments_record_id_apfa_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."apfa_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apfa_record_assessments" ADD CONSTRAINT "apfa_record_assessments_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apfa_records" ADD CONSTRAINT "apfa_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_record_assessments" ADD CONSTRAINT "uka_record_assessments_record_id_uka_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."uka_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_record_assessments" ADD CONSTRAINT "uka_record_assessments_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uka_records" ADD CONSTRAINT "uka_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "apfa_record_assessments_record_cadet_idx" ON "apfa_record_assessments" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "apfa_record_assessments_record_id_idx" ON "apfa_record_assessments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "apfa_record_assessments_cadet_id_idx" ON "apfa_record_assessments" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apfa_records_intake_session_year_idx" ON "apfa_records" USING btree ("intake_id","session","year");--> statement-breakpoint
CREATE INDEX "apfa_records_intake_date_idx" ON "apfa_records" USING btree ("intake_id","record_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uka_record_assessments_record_cadet_idx" ON "uka_record_assessments" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "uka_record_assessments_record_id_idx" ON "uka_record_assessments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "uka_record_assessments_cadet_id_idx" ON "uka_record_assessments" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uka_records_intake_session_year_idx" ON "uka_records" USING btree ("intake_id","session","year");--> statement-breakpoint
CREATE INDEX "uka_records_intake_date_idx" ON "uka_records" USING btree ("intake_id","record_date");