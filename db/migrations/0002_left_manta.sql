ALTER TABLE "program_display_photos" RENAME TO "event_display_photos";--> statement-breakpoint
ALTER TABLE "program_tag_translations" RENAME TO "event_tag_translations";--> statement-breakpoint
ALTER TABLE "program_tags" RENAME TO "event_tags";--> statement-breakpoint
ALTER TABLE "program_translations" RENAME TO "event_translations";--> statement-breakpoint
ALTER TABLE "programs" RENAME TO "events";--> statement-breakpoint
ALTER TABLE "programs_to_tags" RENAME TO "events_to_tags";--> statement-breakpoint
ALTER TABLE "event_display_photos" RENAME COLUMN "program_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "event_translations" RENAME COLUMN "program_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "events_to_tags" RENAME COLUMN "program_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "event_display_photos" DROP CONSTRAINT "program_display_photos_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "event_tag_translations" DROP CONSTRAINT "program_tag_translations_tag_id_program_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "event_translations" DROP CONSTRAINT "program_translations_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "events_to_tags" DROP CONSTRAINT "programs_to_tags_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "events_to_tags" DROP CONSTRAINT "programs_to_tags_tag_id_program_tags_id_fk";
--> statement-breakpoint
DROP INDEX "program_display_photos_program_id_idx";--> statement-breakpoint
DROP INDEX "program_tag_translations_tag_locale_idx";--> statement-breakpoint
DROP INDEX "program_tags_slug_idx";--> statement-breakpoint
DROP INDEX "program_translations_program_locale_idx";--> statement-breakpoint
DROP INDEX "programs_slug_idx";--> statement-breakpoint
DROP INDEX "programs_start_date_idx";--> statement-breakpoint
DROP INDEX "programs_to_tags_tag_id_idx";--> statement-breakpoint
ALTER TABLE "events_to_tags" DROP CONSTRAINT "programs_to_tags_program_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "events_to_tags" ADD CONSTRAINT "events_to_tags_event_id_tag_id_pk" PRIMARY KEY("event_id","tag_id");--> statement-breakpoint
ALTER TABLE "event_display_photos" ADD CONSTRAINT "event_display_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tag_translations" ADD CONSTRAINT "event_tag_translations_tag_id_event_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."event_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_translations" ADD CONSTRAINT "event_translations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_tags" ADD CONSTRAINT "events_to_tags_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_tags" ADD CONSTRAINT "events_to_tags_tag_id_event_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."event_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_display_photos_event_id_idx" ON "event_display_photos" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_tag_translations_tag_locale_idx" ON "event_tag_translations" USING btree ("tag_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "event_tags_slug_idx" ON "event_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "event_translations_event_locale_idx" ON "event_translations" USING btree ("event_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "events_to_tags_tag_id_idx" ON "events_to_tags" USING btree ("tag_id");