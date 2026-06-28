CREATE TABLE "cadet_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"bank_name" "bank" NOT NULL,
	"account_number" bigint NOT NULL,
	"duitnow_id" bigint,
	"qr_code_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cadet_accounts" ADD CONSTRAINT "cadet_accounts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cadet_accounts_member_id_idx" ON "cadet_accounts" USING btree ("member_id");