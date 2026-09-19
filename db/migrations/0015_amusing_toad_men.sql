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
ALTER TABLE "study_programs" ADD COLUMN "completion_year" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "study_programs" ADD COLUMN "is_supported" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_timetables" ADD CONSTRAINT "academic_timetables_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_timetables" ADD CONSTRAINT "academic_timetables_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_results_session_cadet_idx" ON "academic_results" USING btree ("session_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_results_session_id_idx" ON "academic_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "academic_results_cadet_id_idx" ON "academic_results" USING btree ("cadet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_timetables_session_cadet_idx" ON "academic_timetables" USING btree ("session_id","cadet_id");--> statement-breakpoint
CREATE INDEX "academic_timetables_session_id_idx" ON "academic_timetables" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "academic_timetables_cadet_id_idx" ON "academic_timetables" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "study_programs_is_supported_idx" ON "study_programs" USING btree ("is_supported");