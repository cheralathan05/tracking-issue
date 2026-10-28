/**
 * db-push-retry.cjs
 * Retries `prisma db push` during deployment startup to ensure
 * Render PostgreSQL has finished initializing before Express starts.
 */

const { spawn } = require("child_process");
const path = require("path");

const MAX_RETRIES = 15;
const DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runPrismaDbPush() {
  return new Promise((resolve) => {
    const backendDir = path.resolve(__dirname, "..");
    const prismaCli = path.resolve(backendDir, "node_modules", "prisma", "build", "index.js");
    const schemaPath = path.resolve(backendDir, "prisma", "schema.prisma");

    console.log(`[db-push-retry] Running: node ${prismaCli} db push --schema=${schemaPath} --accept-data-loss`);

    const child = spawn(
      process.execPath,
      [prismaCli, "db", "push", `--schema=${schemaPath}`, "--accept-data-loss"],
      {
        cwd: backendDir,
        stdio: "inherit",
        env: process.env,
      }
    );

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", (err) => {
      console.error("[db-push-retry] Process error:", err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log("[db-push-retry] Starting PostgreSQL schema synchronization...");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[db-push-retry] Attempt ${attempt}/${MAX_RETRIES}...`);
    const success = await runPrismaDbPush();

    if (success) {
      console.log("[db-push-retry] ✅ Database schema successfully synchronized with PostgreSQL!");
      process.exit(0);
    }

    if (attempt < MAX_RETRIES) {
      console.log(`[db-push-retry] PostgreSQL not ready or synchronization pending. Retrying in ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }
  }

  console.error("[db-push-retry] ❌ Failed to synchronize database after maximum retries.");
  process.exit(1);
}

main();
