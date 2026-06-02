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
ALTER TABLE "contact_reason_translations" ADD CONSTRAINT "contact_reason_translations_reason_id_contact_reasons_id_fk" FOREIGN KEY ("reason_id") REFERENCES "public"."contact_reasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_reason_translations_reason_locale_idx" ON "contact_reason_translations" USING btree ("reason_id","locale");