import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    const { email, nickname, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        nickname,
        passwordHash,
        // 开发环境自动验证邮箱；生产环境应发送验证邮件
        emailVerified: process.env.NODE_ENV === "development" ? new Date() : null,
      },
      select: { id: true, email: true, nickname: true },
    });

    return NextResponse.json(
      { message: "注册成功，请登录", user },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
