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
ALTER TABLE "religious_activity_photos" ADD CONSTRAINT "religious_activity_photos_activity_id_religious_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."religious_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "religious_activities_title_idx" ON "religious_activities" USING btree ("title");--> statement-breakpoint
CREATE INDEX "religious_activities_type_idx" ON "religious_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "religious_activities_record_date_idx" ON "religious_activities" USING btree ("record_date");--> statement-breakpoint
CREATE INDEX "religious_activity_photos_activity_id_idx" ON "religious_activity_photos" USING btree ("activity_id");