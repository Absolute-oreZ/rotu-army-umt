CREATE TABLE "health_record_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"cadet_id" integer NOT NULL,
	"age" integer NOT NULL,
	"height" numeric(4, 2) NOT NULL,
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
ALTER TABLE "health_record_metrics" ADD CONSTRAINT "health_record_metrics_record_id_health_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."health_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_record_metrics" ADD CONSTRAINT "health_record_metrics_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "health_record_metrics_record_cadet_idx" ON "health_record_metrics" USING btree ("record_id","cadet_id");--> statement-breakpoint
CREATE INDEX "health_record_metrics_record_id_idx" ON "health_record_metrics" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "health_record_metrics_cadet_id_idx" ON "health_record_metrics" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "health_records_intake_date_idx" ON "health_records" USING btree ("intake_id","record_date");