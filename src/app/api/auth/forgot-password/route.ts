import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import {
  createPasswordResetToken,
} from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

// 简单内存速率限制：同一邮箱 60 秒内只能请求 1 次。
// 进程级缓存，多实例部署应替换为 Redis 等共享存储。
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const requestLog = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    // 速率限制：同一邮箱 60s 内只能请求 1 次
    const now = Date.now();
    const lastRequestAt = requestLog.get(normalizedEmail);
    if (lastRequestAt && now - lastRequestAt < RATE_LIMIT_WINDOW_MS) {
      const retryAfter = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - lastRequestAt)) / 1000,
      );
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
    requestLog.set(normalizedEmail, now);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true },
    });

    // 即使用户不存在也返回成功（防枚举）
    if (user && user.passwordHash) {
      const token = await createPasswordResetToken(user.id);
      const result = await sendPasswordResetEmail(user.email, token);

      // 仅开发环境返回降级邮件内容，便于本地调试
      const isDev = process.env.NODE_ENV === "development";
      if (!result.delivered && result.fallbackContent && isDev) {
        return NextResponse.json({
          message: "如果该邮箱已注册，重置链接已发送",
          fallbackContent: result.fallbackContent,
        });
      }
    }

    return NextResponse.json({
      message: "如果该邮箱已注册，重置链接已发送",
    });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
