ALTER TABLE "cadets" ADD COLUMN "cgpa" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "cadets" ADD COLUMN "height" numeric(4, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "cadets" ADD COLUMN "weight" numeric(5, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "cadets" ADD COLUMN "bmi" numeric(4, 2) NOT NULL;