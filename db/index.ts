import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  dbClient?: postgres.Sql;
};

// Use smaller pool for serverless (Vercel) - 5 connections max
// For production with pooled connection, use smaller pool
const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const poolSize = isServerless ? 5 : 20;

const client =
  globalForDb.dbClient ??
  postgres(getServerEnv().databaseUrl, {
    max: poolSize,
    prepare: false,
    idle_timeout: 30,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
