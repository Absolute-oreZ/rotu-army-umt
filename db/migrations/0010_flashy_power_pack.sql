CREATE TABLE "ai_index_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_version_id" uuid NOT NULL,
	"requested_by" uuid,
	"status" varchar(20) DEFAULT 'QUEUED' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_request_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"assistant" varchar(20) NOT NULL,
	"locale" "locale",
	"intent" varchar(80),
	"retrieval_ms" integer DEFAULT 0 NOT NULL,
	"llm_ms" integer DEFAULT 0 NOT NULL,
	"source_count" integer DEFAULT 0 NOT NULL,
	"model" varchar(160),
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "ai_admin_chunks" CASCADE;--> statement-breakpoint
DROP TABLE "ai_admin_document_versions" CASCADE;--> statement-breakpoint
DROP TABLE "ai_admin_documents" CASCADE;--> statement-breakpoint
ALTER TABLE "ai_index_jobs" ADD CONSTRAINT "ai_index_jobs_document_version_id_ai_public_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."ai_public_document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_index_jobs" ADD CONSTRAINT "ai_index_jobs_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_index_jobs_version_idx" ON "ai_index_jobs" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "ai_index_jobs_status_created_idx" ON "ai_index_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_request_logs_assistant_time_idx" ON "ai_request_logs" USING btree ("assistant","created_at");
--> statement-breakpoint
ALTER TABLE "ai_index_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_request_logs" ENABLE ROW LEVEL SECURITY;
