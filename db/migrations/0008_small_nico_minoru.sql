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
ALTER TABLE "cadets" ADD COLUMN "platoon_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "platoons_platoon_no_idx" ON "platoons" USING btree ("platoon_no");--> statement-breakpoint
CREATE UNIQUE INDEX "platoons_slug_idx" ON "platoons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "platoons_status_idx" ON "platoons" USING btree ("status");--> statement-breakpoint
ALTER TABLE "cadets" ADD CONSTRAINT "cadets_platoon_id_platoons_id_fk" FOREIGN KEY ("platoon_id") REFERENCES "public"."platoons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cadets_platoon_id_idx" ON "cadets" USING btree ("platoon_id");