import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { profileSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { nickname, avatar, bio } = parsed.data;
  const userId = session.user.id;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        // 空字符串统一存为 null，避免数据库里出现空串
        avatar: avatar ? avatar : null,
        bio: bio ? bio : null,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[me/profile] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
