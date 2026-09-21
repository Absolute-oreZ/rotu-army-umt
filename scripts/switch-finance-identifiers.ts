#!/usr/bin/env node
/**
 * Switch finance identifiers to use text columns
 * This should be run AFTER backfill is verified
 * Run with: npx tsx scripts/switch-finance-identifiers.ts
 */

import "dotenv/config";
import { db } from "../db";
import { cadetAccounts, treasuryAccounts } from "../db/schema";
import { isNotNull } from "drizzle-orm";

async function verifyAllSynced() {
  console.log("Verifying all records are synced...");

  // Check cadet accounts
  const cadetMismatches = await db
    .select({
      id: cadetAccounts.id,
      accountNumber: cadetAccounts.accountNumber,
      accountNumberText: cadetAccounts.accountNumberText,
      duitNowId: cadetAccounts.duitNowId,
      duitNowIdText: cadetAccounts.duitNowIdText,
    })
    .from(cadetAccounts)
    .where(isNotNull(cadetAccounts.accountNumber));

  let cadetErrors = 0;
  for (const a of cadetMismatches) {
    if (a.accountNumber !== null && a.accountNumberText !== String(a.accountNumber)) {
      console.error(`MISMATCH cadet ${a.id}: accountNumber ${a.accountNumber} != accountNumberText ${a.accountNumberText}`);
      cadetErrors++;
    }
    if (a.duitNowId !== null && a.duitNowIdText !== String(a.duitNowId)) {
      console.error(`MISMATCH cadet ${a.id}: duitNowId ${a.duitNowId} != duitNowIdText ${a.duitNowIdText}`);
      cadetErrors++;
    }
  }

  // Check treasury accounts
  const treasuryMismatches = await db
    .select({
      id: treasuryAccounts.id,
      accountNumber: treasuryAccounts.accountNumber,
      accountNumberText: treasuryAccounts.accountNumberText,
      duitNowId: treasuryAccounts.duitNowId,
      duitNowIdText: treasuryAccounts.duitNowIdText,
    })
    .from(treasuryAccounts)
    .where(isNotNull(treasuryAccounts.accountNumber));

  let treasuryErrors = 0;
  for (const a of treasuryMismatches) {
    if (a.accountNumber !== null && a.accountNumberText !== String(a.accountNumber)) {
      console.error(`MISMATCH treasury ${a.id}: accountNumber ${a.accountNumber} != accountNumberText ${a.accountNumberText}`);
      treasuryErrors++;
    }
    if (a.duitNowId !== null && a.duitNowIdText !== String(a.duitNowId)) {
      console.error(`MISMATCH treasury ${a.id}: duitNowId ${a.duitNowId} != duitNowIdText ${a.duitNowIdText}`);
      treasuryErrors++;
    }
  }

  if (cadetErrors > 0 || treasuryErrors > 0) {
    console.error(`Total mismatches: ${cadetErrors + treasuryErrors}`);
    console.error("Cannot proceed - data not synced. Run backfill script first.");
    return false;
  }

  console.log("All records synced successfully!");
  return true;
}

async function main() {
  const synced = await verifyAllSynced();
  
  if (!synced) {
    console.error("Verification failed. Aborting switch.");
    process.exit(1);
  }

  console.log("All data verified. Ready to switch application code to use text columns.");
  console.log("");
  console.log("NEXT STEPS (manual):");
  console.log("1. Update application code to read/write accountNumberText and duitNowIdText");
  console.log("2. Remove Number() conversions for these fields");
  console.log("3. Update validation to accept string identifiers");
  console.log("4. After deployment verification, run migration to drop numeric columns");
  console.log("");
  console.log("Files to update:");
  console.log("- app/admin/treasurer/accounts/actions.ts");
  console.log("- app/admin/treasurer/accounts/page.tsx");
  console.log("- components/admin/treasurer/accounts/*");
  console.log("- app/cadet/accounts.ts");
  console.log("- lib/cadet/accounts.ts");
  console.log("- db/schema.ts (remove numeric columns after verification)");

  process.exit(0);
}

main();