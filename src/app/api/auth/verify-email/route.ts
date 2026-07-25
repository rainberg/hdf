import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyEmailVerificationToken,
  consumeEmailVerificationToken,
} from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "验证令牌不能为空" },
        { status: 400 },
      );
    }

    const userId = await verifyEmailVerificationToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "验证链接无效或已过期" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    await consumeEmailVerificationToken(token);

    return NextResponse.json({ message: "邮箱验证成功" });
  } catch (err) {
    console.error("[verify-email] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
