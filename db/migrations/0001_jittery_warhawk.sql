CREATE TYPE "public"."claim_status" AS ENUM('PENDING', 'FULFILLED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"intake_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"receipt_path" text NOT NULL,
	"qr_code_path" text NOT NULL,
	"description" text,
	"status" "claim_status" DEFAULT 'PENDING' NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_member_id_idx" ON "claims" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "claims_intake_id_idx" ON "claims" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status");