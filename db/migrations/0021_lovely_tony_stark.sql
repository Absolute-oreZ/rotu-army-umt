CREATE TABLE "rate_limit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_entries_identifier_action_idx" ON "rate_limit_entries" USING btree ("identifier","action");--> statement-breakpoint
CREATE INDEX "rate_limit_entries_expires_at_idx" ON "rate_limit_entries" USING btree ("expires_at");