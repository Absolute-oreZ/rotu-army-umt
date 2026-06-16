CREATE TABLE "admin_role_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"changed_by_admin_user_id" uuid NOT NULL,
	"target_admin_user_id" uuid NOT NULL,
	"old_role" "admin_role" NOT NULL,
	"new_role" "admin_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webapp_contents" DROP CONSTRAINT "webapp_contents_updated_by_admin_user_id_admin_users_id_fk";
--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_changed_by_idx" ON "admin_role_audit_logs" USING btree ("changed_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_role_audit_logs_created_at_idx" ON "admin_role_audit_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "webapp_contents" ADD CONSTRAINT "webapp_contents_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;