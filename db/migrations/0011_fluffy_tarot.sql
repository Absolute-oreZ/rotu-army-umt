DROP INDEX "health_records_intake_date_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "health_records_intake_date_idx" ON "health_records" USING btree ("intake_id","record_date");