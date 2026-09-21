ALTER TABLE "newsletter_campaign_deliveries" ADD COLUMN "idempotency_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "sending_lease_id" text;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "sending_lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_deliveries_idempotency_key_idx" ON "newsletter_campaign_deliveries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_lease_expires_idx" ON "newsletter_campaigns" USING btree ("sending_lease_expires_at");