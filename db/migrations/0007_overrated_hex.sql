CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."ai_document_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."ai_index_status" AS ENUM('UNINDEXED', 'INDEXING', 'INDEXED', 'FAILED', 'STALE');--> statement-breakpoint
CREATE TABLE "ai_admin_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_version_id" uuid NOT NULL,
	"language" "locale" NOT NULL,
	"chunk_index" integer NOT NULL,
	"heading_path" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024),
	"fts" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_admin_document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"language" "locale" NOT NULL,
	"markdown" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"version_number" integer NOT NULL,
	"status" "ai_document_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_admin_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(240) NOT NULL,
	"classification" varchar(40) DEFAULT 'INTERNAL' NOT NULL,
	"allowed_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intake_ids" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_public_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_version_id" uuid NOT NULL,
	"language" "locale" NOT NULL,
	"category" varchar(80) NOT NULL,
	"source_type" varchar(40) NOT NULL,
	"chunk_index" integer NOT NULL,
	"heading_path" text NOT NULL,
	"content" text NOT NULL,
	"embedding_text" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"token_count" integer NOT NULL,
	"canonical_url" text,
	"published_at" timestamp with time zone NOT NULL,
	"embedding" vector(1024),
	"fts" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_public_document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"language" "locale" NOT NULL,
	"title" varchar(240) NOT NULL,
	"markdown" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"version_number" integer NOT NULL,
	"status" "ai_document_status" DEFAULT 'DRAFT' NOT NULL,
	"index_status" "ai_index_status" DEFAULT 'UNINDEXED' NOT NULL,
	"index_error" text,
	"published_at" timestamp with time zone,
	"published_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_public_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"canonical_topic" varchar(80) NOT NULL,
	"category" varchar(80) NOT NULL,
	"audience" varchar(80) DEFAULT 'public' NOT NULL,
	"source_type" varchar(40) DEFAULT 'curated_public_knowledge' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tool_execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"role" "admin_role" NOT NULL,
	"intake_id" integer,
	"tool_name" varchar(100) NOT NULL,
	"capability" varchar(100) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"result_row_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_admin_chunks" ADD CONSTRAINT "ai_admin_chunks_document_version_id_ai_admin_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."ai_admin_document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ADD CONSTRAINT "ai_admin_document_versions_document_id_ai_admin_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."ai_admin_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_chunks" ADD CONSTRAINT "ai_public_chunks_document_version_id_ai_public_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."ai_public_document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_document_versions" ADD CONSTRAINT "ai_public_document_versions_document_id_ai_public_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."ai_public_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_document_versions" ADD CONSTRAINT "ai_public_document_versions_published_by_admin_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_document_versions" ADD CONSTRAINT "ai_public_document_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_documents" ADD CONSTRAINT "ai_public_documents_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_documents" ADD CONSTRAINT "ai_public_documents_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tool_execution_logs" ADD CONSTRAINT "ai_tool_execution_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tool_execution_logs" ADD CONSTRAINT "ai_tool_execution_logs_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_public_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_public_document_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_public_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_admin_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_admin_document_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_admin_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_tool_execution_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_admin_chunks_version_index_idx" ON "ai_admin_chunks" USING btree ("document_version_id","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_admin_document_versions_unique_idx" ON "ai_admin_document_versions" USING btree ("document_id","language","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_admin_documents_slug_idx" ON "ai_admin_documents" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_public_chunks_version_index_idx" ON "ai_public_chunks" USING btree ("document_version_id","chunk_index");--> statement-breakpoint
CREATE INDEX "ai_public_chunks_locale_category_idx" ON "ai_public_chunks" USING btree ("language","category");--> statement-breakpoint
CREATE INDEX "ai_public_chunks_version_id_idx" ON "ai_public_chunks" USING btree ("document_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_public_document_versions_unique_idx" ON "ai_public_document_versions" USING btree ("document_id","language","version_number");--> statement-breakpoint
CREATE INDEX "ai_public_document_versions_public_idx" ON "ai_public_document_versions" USING btree ("document_id","language","status","published_at");--> statement-breakpoint
CREATE INDEX "ai_public_document_versions_hash_idx" ON "ai_public_document_versions" USING btree ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_public_documents_slug_idx" ON "ai_public_documents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ai_public_documents_topic_idx" ON "ai_public_documents" USING btree ("canonical_topic");--> statement-breakpoint
CREATE INDEX "ai_tool_execution_logs_admin_time_idx" ON "ai_tool_execution_logs" USING btree ("admin_user_id","created_at");
--> statement-breakpoint
CREATE INDEX "ai_public_chunks_embedding_hnsw_idx" ON "ai_public_chunks" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX "ai_public_chunks_fts_idx" ON "ai_public_chunks" USING gin ("fts");
--> statement-breakpoint
CREATE INDEX "ai_admin_chunks_embedding_hnsw_idx" ON "ai_admin_chunks" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX "ai_admin_chunks_fts_idx" ON "ai_admin_chunks" USING gin ("fts");
--> statement-breakpoint
CREATE FUNCTION ai_update_public_chunk_fts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('simple', coalesce(NEW.heading_path, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ai_public_chunk_fts_trigger BEFORE INSERT OR UPDATE OF heading_path, content ON ai_public_chunks FOR EACH ROW EXECUTE FUNCTION ai_update_public_chunk_fts();
--> statement-breakpoint
CREATE FUNCTION ai_update_admin_chunk_fts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('simple', coalesce(NEW.heading_path, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ai_admin_chunk_fts_trigger BEFORE INSERT OR UPDATE OF heading_path, content ON ai_admin_chunks FOR EACH ROW EXECUTE FUNCTION ai_update_admin_chunk_fts();
