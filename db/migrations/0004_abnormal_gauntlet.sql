ALTER TABLE "best_cadets" DROP CONSTRAINT "best_cadets_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "best_cadets" ALTER COLUMN "member_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD COLUMN "display_name" varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE "best_cadets" ADD CONSTRAINT "best_cadets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;