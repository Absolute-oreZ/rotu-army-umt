CREATE TYPE "public"."admin_audit_action" AS ENUM('ROLE_CHANGED', 'INVITED', 'ACCEPTED', 'DROPPED');--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "admin_role" NOT NULL,
	"invited_by_auth_user_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_role_audit_logs" ALTER COLUMN "target_admin_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_role_audit_logs" ALTER COLUMN "old_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_role_audit_logs" ALTER COLUMN "new_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_role_audit_logs" ADD COLUMN "action" "admin_audit_action" DEFAULT 'ROLE_CHANGED' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_role_audit_logs" ADD COLUMN "target_member_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_invitations_member_id_idx" ON "admin_invitations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");