import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { collectEnvIssues } from "../lib/env/schema";

function loadDotEnvFile(fileName: string) {
  const envPath = resolve(process.cwd(), fileName);

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

loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const production = process.argv.includes("--production");
const issues = collectEnvIssues(process.env, { production });

if (issues.length === 0) {
  console.log(`Environment OK (${production ? "production" : "development"} rules).`);
  process.exit(0);
}

for (const issue of issues) {
  console.error(`- ${issue.key} ${issue.message}`);
}

console.error(`\n${issues.length} environment issue(s) found (${production ? "production" : "development"} rules).`);
process.exit(1);
