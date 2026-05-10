import "server-only";
import { getPublicEnv } from "@/lib/env/public";

const serverEnv = {
  databaseUrl: process.env.DATABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
};

export function getServerEnv() {
  const missing = Object.entries(serverEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  return {
    ...getPublicEnv(),
    ...(serverEnv as {
      databaseUrl: string;
      directUrl: string;
      supabaseSecretKey: string;
    }),
  };
}
