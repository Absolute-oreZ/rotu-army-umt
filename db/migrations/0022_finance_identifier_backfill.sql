-- Backfill finance identifier text columns from numeric columns
-- Run this migration after 0019 (which adds the text columns)

-- 1. Backfill cadet_accounts
UPDATE "cadet_accounts"
SET 
    "account_number_text" = CASE 
        WHEN "account_number" IS NOT NULL THEN "account_number"::text 
        ELSE '0' 
    END,
    "duitnow_id_text" = CASE 
        WHEN "duitnow_id" IS NOT NULL THEN "duitnow_id"::text 
        ELSE NULL 
    END
WHERE "account_number" IS NOT NULL;

-- 2. Backfill treasury_accounts
UPDATE "treasury_accounts"
SET 
    "account_number_text" = CASE 
        WHEN "account_number" IS NOT NULL THEN "account_number"::text 
        ELSE '0' 
    END,
    "duitnow_id_text" = CASE 
        WHEN "duitnow_id" IS NOT NULL THEN "duitnow_id"::text 
        ELSE NULL 
    END
WHERE "account_number" IS NOT NULL;