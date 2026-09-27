ALTER TABLE "ai_admin_document_versions" ADD COLUMN "index_status" "ai_index_status" DEFAULT 'UNINDEXED' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD COLUMN "index_error" text;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD COLUMN "published_by" uuid;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "ai_admin_documents" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "ai_admin_documents" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD CONSTRAINT "ai_admin_document_versions_published_by_admin_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD CONSTRAINT "ai_admin_document_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD CONSTRAINT "ai_admin_document_versions_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_admin_documents" ADD CONSTRAINT "ai_admin_documents_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_admin_documents" ADD CONSTRAINT "ai_admin_documents_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;