import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["USER", "MERCHANT", "ADMIN"]).optional(),
  creditScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "BANNED"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] - 更新用户角色/信用分
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  // 不允许管理员降级自己
  if (id === session.user.id && parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "不能降级自己的管理员角色" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.creditScore !== undefined)
    data.creditScore = parsed.data.creditScore;
  if (parsed.data.status) data.status = parsed.data.status;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      creditScore: true,
      status: true,
    },
  });

  return NextResponse.json(updated);
}
