import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/merchants/[id] - 审核商家申请
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const profile = await prisma.merchantProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "申请不存在" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.merchantProfile.update({
      where: { id },
      data: { status: parsed.data.status },
    }),
    // 通过审核则将用户角色提升为 MERCHANT
    ...(parsed.data.status === "APPROVED"
      ? [
          prisma.user.update({
            where: { id: profile.userId },
            data: { role: "MERCHANT" },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true });
}
