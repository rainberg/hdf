import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const applySchema = z.object({
  businessName: z.string().min(2, "公司名至少 2 个字符").max(80),
  businessLicense: z.string().max(200).optional().or(z.literal("")),
  contactEmail: z.string().email("请填写有效联系邮箱"),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
});

// POST /api/merchant/apply - 申请成为商家
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "管理员无需申请" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const existing = await prisma.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    if (existing.status === "PENDING") {
      return NextResponse.json({ error: "您已提交申请，正在审核中" }, { status: 409 });
    }
    if (existing.status === "APPROVED") {
      return NextResponse.json({ error: "您已是商家" }, { status: 409 });
    }
    // 被拒绝后允许重新申请：更新原记录
    await prisma.merchantProfile.update({
      where: { userId: session.user.id },
      data: {
        businessName: parsed.data.businessName,
        businessLicense: parsed.data.businessLicense || null,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone || null,
        status: "PENDING",
      },
    });
    return NextResponse.json({ message: "申请已重新提交" });
  }

  const profile = await prisma.merchantProfile.create({
    data: {
      userId: session.user.id,
      businessName: parsed.data.businessName,
      businessLicense: parsed.data.businessLicense || null,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone || null,
      status: "PENDING",
    },
  });

  return NextResponse.json(profile, { status: 201 });
}

// GET /api/merchant/apply - 查询当前用户的申请状态
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const profile = await prisma.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ profile });
}
