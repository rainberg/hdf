import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import {
  recomputeCompanyRating,
  recomputePhonePlanRating,
} from "@/lib/rating";

const statusSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/reviews/[id] - 审核评价（发布/拒绝）
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

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, companyId: true, phonePlanId: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  // 状态变为 PUBLISHED 时，重算实体评分；变为 REJECTED 时也重算（移除该评价）
  if (review.companyId) {
    await recomputeCompanyRating(review.companyId);
  }
  if (review.phonePlanId) {
    await recomputePhonePlanRating(review.phonePlanId);
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/reviews/[id] - 删除评价
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, companyId: true, phonePlanId: true, userId: true },
  });
  if (!review) {
    return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  }

  // 删除评价的同时扣减用户信用分（防刷分惩罚）
  await prisma.$transaction([
    prisma.review.delete({ where: { id } }),
    prisma.user.update({
      where: { id: review.userId },
      data: { creditScore: { decrement: 5 } },
    }),
  ]);

  if (review.companyId) {
    await recomputeCompanyRating(review.companyId);
  }
  if (review.phonePlanId) {
    await recomputePhonePlanRating(review.phonePlanId);
  }

  return NextResponse.json({ success: true });
}
