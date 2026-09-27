-- Archive all but the newest published version per document + language so the
-- unique index below cannot fail on pre-existing duplicates.
UPDATE "ai_public_document_versions" AS older
SET "status" = 'ARCHIVED', "index_status" = 'STALE'
WHERE older."status" = 'PUBLISHED'
  AND older."id" <> (
    SELECT DISTINCT ON (newer."document_id", newer."language") newer."id"
    FROM "ai_public_document_versions" AS newer
    WHERE newer."status" = 'PUBLISHED'
    ORDER BY newer."document_id", newer."language", newer."published_at" DESC NULLS LAST, newer."version_number" DESC
  );
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_public_document_versions_one_published_idx" ON "ai_public_document_versions" USING btree ("document_id","language") WHERE "ai_public_document_versions"."status" = 'PUBLISHED';