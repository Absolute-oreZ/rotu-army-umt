CREATE TYPE "public"."accommodation_type" AS ENUM('HOSTEL', 'RENTAL');--> statement-breakpoint
CREATE TYPE "public"."attend_type" AS ENUM('B', 'C');--> statement-breakpoint
CREATE TABLE "accommodations" (
	"id" serial PRIMARY KEY NOT NULL,
	"cadet_id" integer NOT NULL,
	"type" "accommodation_type" DEFAULT 'HOSTEL' NOT NULL,
	"address" text,
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
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attend_records" ADD CONSTRAINT "attend_records_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accommodations_cadet_id_idx" ON "accommodations" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "attend_records_cadet_id_idx" ON "attend_records" USING btree ("cadet_id");--> statement-breakpoint
CREATE INDEX "attend_records_record_date_idx" ON "attend_records" USING btree ("record_date");