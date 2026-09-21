ALTER TABLE "cadet_accounts" ALTER COLUMN "account_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cadet_accounts" ALTER COLUMN "account_number_text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ALTER COLUMN "account_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ALTER COLUMN "account_number_text" SET NOT NULL;