/**
 * 应用 user_management migration 到 Neon（通过 HTTP）
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL 未设置");

const sql = neon(databaseUrl);

const migrationSql = readFileSync(
  join(process.cwd(), "prisma/migrations/20260725000000_user_management/migration.sql"),
  "utf8",
);

// Neon HTTP 每次只能执行一条语句，需要按 ; 拆分
// 先移除注释行，再按 ; 拆分
const statements = migrationSql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

async function main() {
  console.log(`🚀 执行 user_management migration（${statements.length} 条语句）…`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.query(stmt, []);
      console.log(`  [${i + 1}/${statements.length}] ✓ ${stmt.slice(0, 60)}…`);
    } catch (e) {
      // 忽略"已存在"错误（幂等）
      const msg = (e as Error).message;
      if (msg.includes("already exists") || msg.includes("does not exist")) {
        console.log(`  [${i + 1}/${statements.length}] ⊙ 已存在，跳过`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ✗ ${msg}`);
        throw e;
      }
    }
  }
  console.log("✅ migration 完成");
}

main().catch((e) => {
  console.error("❌ 失败：", e);
  process.exit(1);
});
