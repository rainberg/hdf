import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const replySchema = z.object({
  reply: z.string().min(2, "回复内容至少 2 字").max(1000, "回复最多 1000 字"),
});

type Params = { params: Promise<{ id: string }> };

// POST /api/merchant/reviews/[id]/reply - 商家回复评价
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      company: { select: { ownerUserId: true } },
    },
  });
  if (!review) {
    return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  }
  if (!review.companyId || !review.company) {
    return NextResponse.json({ error: "该评价无关联公司" }, { status: 400 });
  }

  // 仅公司所有者或管理员可回复
  const isOwner = review.company.ownerUserId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "无权回复该评价" }, { status: 403 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { merchantReply: parsed.data.reply },
  });

  return NextResponse.json(updated);
}
