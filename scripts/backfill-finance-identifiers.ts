#!/usr/bin/env node
/**
 * Backfill finance identifier text columns from numeric columns
 * Run with: npx tsx scripts/backfill-finance-identifiers.ts
 * Requires: ALLOW_SEED=1 and local environment
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cadetAccounts, treasuryAccounts } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!, {
  max: 5,
  prepare: false,
  idle_timeout: 30,
  connect_timeout: 10,
});

const db = drizzle(client, { schema: { cadetAccounts, treasuryAccounts } });

async function backfillCadetAccounts() {
  console.log("Backfilling cadet_accounts...");
  
  const accounts = await db
    .select({
      id: cadetAccounts.id,
      accountNumber: cadetAccounts.accountNumber,
      duitNowId: cadetAccounts.duitNowId,
    })
    .from(cadetAccounts)
    .where(isNotNull(cadetAccounts.accountNumber));

  let updated = 0;
  for (const account of accounts) {
    const accountNumberText = account.accountNumber !== null 
      ? String(account.accountNumber) 
      : "0";
    const duitNowIdText = account.duitNowId !== null 
      ? String(account.duitNowId) 
      : null;

    await db
      .update(cadetAccounts)
      .set({
        accountNumberText: accountNumberText,
        duitNowIdText: duitNowIdText,
      })
      .where(eq(cadetAccounts.id, account.id));
    updated++;
  }

  console.log(`Updated ${updated} cadet accounts`);
  await client.end();
}

async function backfillTreasuryAccounts() {
  console.log("Backfilling treasury_accounts...");
  
  const client2 = postgres(process.env.DATABASE_URL!, {
    max: 5,
    prepare: false,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  const db2 = drizzle(client2, { schema: { cadetAccounts, treasuryAccounts } });
  
  const accounts = await db2
    .select({
      id: treasuryAccounts.id,
      accountNumber: treasuryAccounts.accountNumber,
      duitNowId: treasuryAccounts.duitNowId,
    })
    .from(treasuryAccounts)
    .where(isNotNull(treasuryAccounts.accountNumber));

  let updated = 0;
  for (const account of accounts) {
    const accountNumberText = account.accountNumber !== null 
      ? String(account.accountNumber) 
      : "0";
    const duitNowIdText = account.duitNowId !== null 
      ? String(account.duitNowId) 
      : null;

    await db2
      .update(treasuryAccounts)
      .set({
        accountNumberText: accountNumberText,
        duitNowIdText: duitNowIdText,
      })
      .where(eq(treasuryAccounts.id, account.id));
    updated++;
  }

  console.log(`Updated ${updated} treasury accounts`);
  await client2.end();
}

async function verifyBackfill() {
  console.log("Verifying backfill...");
  
  const client3 = postgres(process.env.DATABASE_URL!, {
    max: 5,
    prepare: false,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  const db3 = drizzle(client3, { schema: { cadetAccounts, treasuryAccounts } });
  
  // Check cadet accounts
  const cadetCheck = await db3
    .select({ id: cadetAccounts.id })
    .from(cadetAccounts)
    .where(isNotNull(cadetAccounts.accountNumber));
  
  let hasErrors = false;
  for (const record of cadetCheck) {
    const account = await db3
      .select({
        accountNumber: cadetAccounts.accountNumber,
        accountNumberText: cadetAccounts.accountNumberText,
        duitNowId: cadetAccounts.duitNowId,
        duitNowIdText: cadetAccounts.duitNowIdText,
      })
      .from(cadetAccounts)
      .where(eq(cadetAccounts.id, record.id))
      .limit(1);
    
    const a = account[0];
    if (a.accountNumber !== null && a.accountNumberText !== String(a.accountNumber)) {
      console.error(`MISMATCH cadet ${record.id}: ${a.accountNumber} != ${a.accountNumberText}`);
      hasErrors = true;
    }
    if (a.duitNowId !== null && a.duitNowIdText !== String(a.duitNowId)) {
      console.error(`MISMATCH cadet duitnow ${record.id}: ${a.duitNowId} != ${a.duitNowIdText}`);
      hasErrors = true;
    }
  }

  // Check treasury accounts
  const treasuryCheck = await db3
    .select({ id: treasuryAccounts.id })
    .from(treasuryAccounts)
    .where(isNotNull(treasuryAccounts.accountNumber));

  for (const record of treasuryCheck) {
    const account = await db3
      .select({
        accountNumber: treasuryAccounts.accountNumber,
        accountNumberText: treasuryAccounts.accountNumberText,
        duitNowId: treasuryAccounts.duitNowId,
        duitNowIdText: treasuryAccounts.duitNowIdText,
      })
      .from(treasuryAccounts)
      .where(eq(treasuryAccounts.id, record.id))
      .limit(1);
    
    const a = account[0];
    if (a.accountNumber !== null && a.accountNumberText !== String(a.accountNumber)) {
      console.error(`MISMATCH treasury ${record.id}: ${a.accountNumber} != ${a.accountNumberText}`);
      hasErrors = true;
    }
    if (a.duitNowId !== null && a.duitNowIdText !== String(a.duitNowId)) {
      console.error(`MISMATCH treasury duitnow ${record.id}: ${a.duitNowId} != ${a.duitNowIdText}`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log("Verification complete - all records match!");
  } else {
    console.error("Verification failed - mismatches found");
  }
  
  await client3.end();
}

async function main() {
  try {
    await backfillCadetAccounts();
    await backfillTreasuryAccounts();
    await verifyBackfill();
    console.log("Backfill completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

main();