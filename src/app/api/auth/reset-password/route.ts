import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const userId = await verifyPasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "重置链接无效或已过期" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "重置链接无效或已过期" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await consumePasswordResetToken(token);

    return NextResponse.json({
      message: "密码重置成功，请使用新密码登录",
    });
  } catch (err) {
    console.error("[reset-password] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
