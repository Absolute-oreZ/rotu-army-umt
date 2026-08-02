CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('DRAFT', 'SENT', 'SCHEDULED');--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(200) NOT NULL,
	"preview_text" varchar(200),
	"content_html" text NOT NULL,
	"content_text" text,
	"status" "newsletter_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_sent_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("sent_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_scheduled_at_idx" ON "newsletter_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_sent_by_idx" ON "newsletter_campaigns" USING btree ("sent_by_admin_user_id");