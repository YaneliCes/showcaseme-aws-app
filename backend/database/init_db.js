const fs = require("fs");
const path = require("path");
const { getConnection } = require("../lib/db");

async function runMigrations() {
  const dir = __dirname;
  const files = fs.readdirSync(dir);

  // Only .sql files
  const sqlFiles = files
    .filter((f) => f.endsWith(".sql"))
    .map((f) => path.join(dir, f));

  if (sqlFiles.length === 0) {
    console.log("No .sql files found in /backend/database");
    return;
  }

  // Validate + sort by filename (001_, 002_, etc.)
  const validFiles = sqlFiles.filter((fullPath) => {
    const file = path.basename(fullPath);
    const ok = /^\d{3}_/.test(file);
    if (!ok) {
      console.warn(
        `Skipping "${file}" (invalid name – must start with 3 digits + underscore, e.g., 001_example.sql)`
      );
    }
    return ok;
  });

  validFiles.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  console.log("Found SQL files:");
  validFiles.forEach((f) => console.log("  -", path.basename(f)));

  const conn = await getConnection();
  let count = 0;

  try {
    for (const fullPath of validFiles) {
      const file = path.basename(fullPath);
      const sql = fs.readFileSync(fullPath, "utf8");

      console.log(`\n=== Running ${file} ===`);

      try {
        // For multi-statement files you may need 'multipleStatements: true' in pool config,
        // or split the file manually on ';'. For simple single-statement files, this is fine.
        const res = await conn.query(sql);
        count++;
        console.log(`Success (${file})`);
      } catch (err) {
        // MySQL duplicate warnings (idempotent behavior)
        const msg = String(err.message || err);
        if (
          msg.includes("Duplicate entry") ||
          msg.includes("Duplicate column") ||
          msg.includes("Duplicate key") ||
          msg.toLowerCase().includes("multiple primary key")
        ) {
          console.warn(`Duplicate-ish warning for ${file} (probably safe):`);
          console.warn("   ", msg);
        } else {
          console.error(`Error running ${file}:`);
          console.error("   ", msg);
        }
      }
    }

    console.log(`\nInit complete, used approximately ${count} DB calls.`);
  } finally {
    conn.release();
  }
}

runMigrations()
  .then(() => {
    console.log("\nAll done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration runner crashed:", err);
    process.exit(1);
  });