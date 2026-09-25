DROP INDEX "best_cadets_sort_order_idx";--> statement-breakpoint
ALTER TABLE "best_cadets" DROP COLUMN "public_consent_confirmed_at";--> statement-breakpoint
ALTER TABLE "best_cadets" DROP COLUMN "sort_order";