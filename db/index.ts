import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  dbClient?: postgres.Sql;
};

const client =
  globalForDb.dbClient ??
  postgres(getServerEnv().databaseUrl, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
