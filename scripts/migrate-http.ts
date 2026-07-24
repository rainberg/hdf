/**
 * 通过 Neon HTTP 适配器执行 migration.sql
 * 用途：在沙箱/Serverless 环境（封锁 5432 端口）下完成数据库建表
 *
 * 运行：npx tsx scripts/migrate-http.ts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 未设置，无法执行迁移");
}

const sql = neon(databaseUrl);

const migrationPath = join(
  process.cwd(),
  "prisma/migrations/20260724000000_init/migration.sql",
);
const rawSql = readFileSync(migrationPath, "utf-8");

/**
 * 将 migration.sql 按 ';' 切分为单条语句
 * - 移除注释行（-- 开头）
 * - 跳过空语句
 * - 该 migration.sql 仅包含 DDL，无字符串字面量含 ';'，可安全切分
 */
function splitStatements(sqlText: string): string[] {
  const lines = sqlText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("--") && l.length > 0);
  const joined = lines.join("\n");
  return joined
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  console.log("🚀 开始通过 Neon HTTP 执行迁移…");
  console.log(`   文件：${migrationPath}`);

  // 1. 先确认连接
  const version = await sql`SELECT version()`;
  console.log(`   ✅ 连接成功：${version[0]?.version?.slice(0, 60)}…`);

  // 2. 创建 _prisma_migrations 表（如果不存在）
  await sql`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,

        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    )
  `;
  console.log("   ✅ _prisma_migrations 表已就绪");

  // 3. 检查迁移是否已应用
  const migrationName = "20260724000000_init";
  const existing = await sql`
    SELECT id FROM "_prisma_migrations" WHERE "migration_name" = ${migrationName}
  `;
  if (existing.length > 0) {
    console.log(`   ⏭️  迁移 ${migrationName} 已应用，跳过`);
    return;
  }

  // 4. 切分并逐条执行
  const statements = splitStatements(rawSql);
  console.log(`   📦 共 ${statements.length} 条语句待执行`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      await sql.query(stmt, []);
      console.log(`   [${i + 1}/${statements.length}] ✅ ${preview}…`);
    } catch (err: any) {
      // 已经存在的对象等错误可跳过（幂等）
      if (
        err?.message?.includes("already exists") ||
        err?.message?.includes("does not exist")
      ) {
        console.log(`   [${i + 1}/${statements.length}] ⏭️  跳过(已存在)：${preview}…`);
        continue;
      }
      console.error(`   [${i + 1}/${statements.length}] ❌ 失败：${preview}`);
      console.error(`      错误：${err?.message}`);
      throw err;
    }
  }

  // 5. 记录迁移
  const crypto = await import("node:crypto");
  const checksum = crypto
    .createHash("sha256")
    .update(rawSql)
    .digest("hex");
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
    VALUES (${id}, ${checksum}, NOW(), ${migrationName}, NOW(), ${statements.length})
  `;
  console.log(`\n🎉 迁移完成！共执行 ${statements.length} 条语句`);
}

main().catch((e) => {
  console.error("❌ 迁移失败：", e);
  process.exit(1);
});
