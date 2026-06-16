ALTER TABLE "admin_invitations" ADD COLUMN "intake_id" integer;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "intake_id" integer;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_intake_id_idx" ON "admin_users" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cadets_is_active_idx" ON "cadets" USING btree ("is_active") WHERE "cadets"."is_active" = true;--> statement-breakpoint
CREATE INDEX "members_name_idx" ON "members" USING btree ("name");