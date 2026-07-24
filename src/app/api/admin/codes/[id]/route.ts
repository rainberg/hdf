import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "REMOVED"]),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/codes/[id] - 更新优惠码状态
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const code = await prisma.code.findUnique({ where: { id } });
  if (!code) {
    return NextResponse.json({ error: "优惠码不存在" }, { status: 404 });
  }

  const updated = await prisma.code.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/codes/[id] - 彻底删除优惠码
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const code = await prisma.code.findUnique({ where: { id } });
  if (!code) {
    return NextResponse.json({ error: "优惠码不存在" }, { status: 404 });
  }

  await prisma.code.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
