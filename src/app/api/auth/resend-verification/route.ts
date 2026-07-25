import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createEmailVerificationToken,
} from "@/lib/tokens";
import { sendEmailVerification } from "@/lib/email";

// 简易内存速率限制：同一用户 60 秒内只能请求 1 次
// （仅在单实例 / Serverless 黏性会话下生效，多实例需替换为 Redis 等共享存储）
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const lastSentMap = new Map<string, number>();

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "邮箱已验证" },
        { status: 400 },
      );
    }

    // 速率限制检查
    const now = Date.now();
    const lastSentAt = lastSentMap.get(userId);
    if (lastSentAt && now - lastSentAt < RATE_LIMIT_WINDOW_MS) {
      const retryAfterSec = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - lastSentAt)) / 1000,
      );
      return NextResponse.json(
        { error: `请求过于频繁，请 ${retryAfterSec} 秒后重试` },
        { status: 429 },
      );
    }

    const token = await createEmailVerificationToken(user.id);
    await sendEmailVerification(user.email, token);

    lastSentMap.set(userId, now);

    return NextResponse.json({ message: "验证邮件已发送" });
  } catch (err) {
    console.error("[resend-verification] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
