import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

const firstOfficer = {
  authUserId: "dc331c53-9100-45c2-bef2-62e48efbe238",
  email: "s65505@ocean.umt.edu.my",
  fullName: "YONG CHUN HAO",
  role: "OFFICER",
} as const;

async function seed() {
  await sql`
    insert into admin_users (
      auth_user_id,
      email,
      full_name,
      role,
      is_active
    )
    values (
      ${firstOfficer.authUserId},
      ${firstOfficer.email},
      ${firstOfficer.fullName},
      ${firstOfficer.role},
      true
    )
    on conflict (auth_user_id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      is_active = true,
      updated_at = now()
  `;
}

seed()
  .then(async () => {
    console.log(`Seeded admin user: ${firstOfficer.email}`);
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
