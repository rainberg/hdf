import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/codes/[id]/vote - 投票（可用 +1 / 失效 -1）
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const value = body.value === 1 ? 1 : -1;
  const userId = session.user.id;

  // 检查是否已投过
  const existing = await prisma.codeVote.findUnique({
    where: { codeId_userId: { codeId: id, userId } },
  });

  if (existing) {
    if (existing.value === value) {
      // 取消投票
      await prisma.$transaction([
        prisma.codeVote.delete({ where: { id: existing.id } }),
        prisma.code.update({
          where: { id },
          data: {
            upvotes: { decrement: value === 1 ? 1 : 0 },
            downvotes: { decrement: value === -1 ? 1 : 0 },
          },
        }),
      ]);
      return NextResponse.json({ action: "removed" });
    }
    // 翻转投票
    await prisma.$transaction([
      prisma.codeVote.update({
        where: { id: existing.id },
        data: { value },
      }),
      prisma.code.update({
        where: { id },
        data: {
          upvotes: { increment: value === 1 ? 1 : -1 },
          downvotes: { increment: value === -1 ? 1 : -1 },
        },
      }),
    ]);
    return NextResponse.json({ action: "flipped" });
  }

  // 新增投票
  await prisma.$transaction([
    prisma.codeVote.create({
      data: { codeId: id, userId, value },
    }),
    prisma.code.update({
      where: { id },
      data: {
        upvotes: { increment: value === 1 ? 1 : 0 },
        downvotes: { increment: value === -1 ? 1 : 0 },
      },
    }),
  ]);

  // 失效投票数 > 5 自动标记 EXPIRED
  if (value === -1) {
    const code = await prisma.code.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true, status: true },
    });
    if (code && code.downvotes > 5 && code.downvotes > code.upvotes * 2) {
      await prisma.code.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ action: "expired" });
    }
  }

  return NextResponse.json({ action: "voted" });
}
