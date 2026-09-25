CREATE TABLE "best_cadet_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"best_cadet_id" integer NOT NULL,
	"locale" "locale" NOT NULL,
	"distinction" varchar(180) NOT NULL,
	"summary" text NOT NULL,
	"quote" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "best_cadets" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"display_name" varchar(180) NOT NULL,
	"award_year" integer NOT NULL,
	"award_date" date,
	"rank_at_award" varchar(120) NOT NULL,
	"intake_id" integer,
	"intake_no_snapshot" varchar(60),
	"portrait_path" text NOT NULL,
	"related_story_id" integer,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "best_cadet_translations" ADD CONSTRAINT "best_cadet_translations_best_cadet_id_best_cadets_id_fk" FOREIGN KEY ("best_cadet_id") REFERENCES "public"."best_cadets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD CONSTRAINT "best_cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD CONSTRAINT "best_cadets_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD CONSTRAINT "best_cadets_related_story_id_events_id_fk" FOREIGN KEY ("related_story_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "best_cadet_translations_cadet_locale_idx" ON "best_cadet_translations" USING btree ("best_cadet_id","locale");--> statement-breakpoint
CREATE INDEX "best_cadets_award_year_idx" ON "best_cadets" USING btree ("award_year");--> statement-breakpoint
CREATE INDEX "best_cadets_status_idx" ON "best_cadets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "best_cadets_sort_order_idx" ON "best_cadets" USING btree ("sort_order");