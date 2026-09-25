ALTER TABLE "testimonial_translations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "testimonial_translations" CASCADE;--> statement-breakpoint
DROP TABLE "testimonials" CASCADE;--> statement-breakpoint
ALTER TABLE "best_cadets" DROP CONSTRAINT "best_cadets_member_id_members_id_fk";
--> statement-breakpoint
DROP INDEX "best_cadets_award_year_idx";--> statement-breakpoint
ALTER TABLE "best_cadets" ALTER COLUMN "member_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "best_cadets" ALTER COLUMN "award_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD CONSTRAINT "best_cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "best_cadets_award_date_idx" ON "best_cadets" USING btree ("award_date");--> statement-breakpoint
ALTER TABLE "best_cadet_translations" DROP COLUMN "distinction";--> statement-breakpoint
ALTER TABLE "best_cadets" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "best_cadets" DROP COLUMN "award_year";--> statement-breakpoint
ALTER TABLE "best_cadets" DROP COLUMN "rank_at_award";