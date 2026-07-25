/**
 * Token 生成与校验工具
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * 生成密码安全随机 token（32 字节 = 64 位 hex）
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 创建密码重置 token，同时使该用户旧 token 失效
 * 24 小时过期
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // 使旧 token 失效
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

/**
 * 创建邮箱验证 token，同时使旧 token 失效
 * 48 小时过期
 */
export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  return token;
}

/**
 * 校验密码重置 token，返回 userId 或 null
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  return record.userId;
}

/**
 * 校验邮箱验证 token，返回 userId 或 null
 */
export async function verifyEmailVerificationToken(
  token: string,
): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  return record.userId;
}

/**
 * 标记 token 已使用
 */
export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

export async function consumeEmailVerificationToken(token: string): Promise<void> {
  await prisma.emailVerificationToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
