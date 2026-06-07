DROP INDEX "members_email_idx";--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "member_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "personal_email" varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "edu_email" varchar(320);--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_member_id_idx" ON "admin_users" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_personal_email_idx" ON "members" USING btree ("personal_email");--> statement-breakpoint
CREATE UNIQUE INDEX "members_edu_email_idx" ON "members" USING btree ("edu_email") WHERE "members"."edu_email" is not null;--> statement-breakpoint
ALTER TABLE "admin_users" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN "email";