CREATE TABLE "newsletter_campaign_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" varchar(150) NOT NULL,
	"file_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_campaign_attachments" ADD CONSTRAINT "newsletter_campaign_attachments_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "newsletter_campaign_attachments_campaign_idx" ON "newsletter_campaign_attachments" USING btree ("campaign_id");