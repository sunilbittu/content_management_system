import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const supportedArgs = new Set(["--dry-run", "--help"]);
const unexpectedArgs = [...args].filter((arg) => !supportedArgs.has(arg));

if (unexpectedArgs.length > 0) {
  console.error(`Unknown option: ${unexpectedArgs.join(", ")}`);
  process.exit(1);
}

if (args.has("--help")) {
  console.log(`Run all pending Supabase migrations against a remote database.

Usage:
  npm run db:migrate
  npm run db:migrate:dry-run

Environment:
  SUPABASE_DB_URL  Percent-encoded Postgres connection string from Supabase Dashboard > Connect.

The runner loads .env.local and .env when supported by the installed Node.js version.
Existing process environment variables take precedence.`);
  process.exit(0);
}

for (const fileName of [".env.local", ".env"]) {
  const filePath = resolve(projectRoot, fileName);
  if (existsSync(filePath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(filePath);
  }
}

const databaseUrl = process.env.SUPABASE_DB_URL?.trim();

if (!databaseUrl) {
  console.error(
    "SUPABASE_DB_URL is required. Add it to .env.local or export it before running this command.",
  );
  process.exit(1);
}

let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  console.error("SUPABASE_DB_URL must be a valid Postgres connection string.");
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
  console.error("SUPABASE_DB_URL must use the postgres:// or postgresql:// protocol.");
  process.exit(1);
}

const migrationsDirectory = resolve(projectRoot, "supabase", "migrations");
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
  .sort();

if (migrationFiles.length === 0) {
  console.error("No migration files were found in supabase/migrations.");
  process.exit(1);
}

const cliPath = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);

if (!existsSync(cliPath)) {
  console.error("Supabase CLI is not installed. Run npm install first.");
  process.exit(1);
}

const dryRun = args.has("--dry-run");
const cliArgs = [
  "db",
  "push",
  "--db-url",
  databaseUrl,
  "--include-all",
  ...(dryRun ? ["--dry-run"] : []),
];

console.log(`${dryRun ? "Checking" : "Applying"} ${migrationFiles.length} migration files:`);
for (const fileName of migrationFiles) {
  console.log(`  ${fileName}`);
}
console.log(`Target host: ${parsedDatabaseUrl.hostname}`);

const result = spawnSync(cliPath, cliArgs, {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Unable to start Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
