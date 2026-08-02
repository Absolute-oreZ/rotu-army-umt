CREATE TYPE "public"."newsletter_delivery_status" AS ENUM('QUEUED', 'SENT', 'FAILED');--> statement-breakpoint
ALTER TYPE "public"."newsletter_campaign_status" ADD VALUE 'SENDING';--> statement-breakpoint
ALTER TYPE "public"."newsletter_campaign_status" ADD VALUE 'FAILED';--> statement-breakpoint
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
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_translations" ADD CONSTRAINT "newsletter_campaign_translations_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_deliveries_campaign_subscriber_idx" ON "newsletter_campaign_deliveries" USING btree ("campaign_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_deliveries_campaign_status_idx" ON "newsletter_campaign_deliveries" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_deliveries_subscriber_idx" ON "newsletter_campaign_deliveries" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_translations_campaign_locale_idx" ON "newsletter_campaign_translations" USING btree ("campaign_id","locale");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_translations_campaign_idx" ON "newsletter_campaign_translations" USING btree ("campaign_id");
--> statement-breakpoint
INSERT INTO "newsletter_campaign_translations" ("campaign_id", "locale", "subject", "preview_text", "content_html", "content_text")
SELECT "id", 'en', "subject", "preview_text", "content_html", "content_text"
FROM "newsletter_campaigns"
ON CONFLICT ("campaign_id", "locale") DO NOTHING;
