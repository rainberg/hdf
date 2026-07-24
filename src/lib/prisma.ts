import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// 使用 Neon HTTP 适配器（走 443 端口，绕过 Serverless 环境对 5432 的封锁）
// 本地开发、Vercel 部署、沙箱环境均可使用同一连接串。
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 环境变量未设置。请在 .env 中配置 Neon 连接串，例如：\n" +
      'DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"',
  );
}

const createPrismaClient = () => {
  // PrismaNeonHttp 直接接收连接串，内部通过 fetch() 走 HTTPS
  const adapter = new PrismaNeonHttp(databaseUrl, {});
  return new PrismaClient({ adapter });
};

// 避免 Next.js 开发热重载与 Serverless 函数复用时建立多个客户端
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

