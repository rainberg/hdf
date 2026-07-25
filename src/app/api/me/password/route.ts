import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { changePasswordSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // OAuth 用户没有密码，无法通过当前密码校验流程修改
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "请先通过第三方登录后设置密码" },
        { status: 400 },
      );
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "当前密码错误" },
        { status: 400 },
      );
    }

    // 新密码不能与旧密码相同
    const isSameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsOld) {
      return NextResponse.json(
        { error: "新密码不能与当前密码相同" },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (err) {
    console.error("[me/password] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
