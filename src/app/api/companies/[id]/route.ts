import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { companySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/companies/[id] - 详情
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      quotes: {
        where: { active: true },
        orderBy: [{ serviceType: "asc" }, { firstWeightPrice: "asc" }],
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: { user: { select: { nickname: true, avatar: true, creditScore: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      aggregatedReviews: {
        orderBy: { likes: "desc" },
        take: 20,
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "公司不存在" }, { status: 404 });
  }

  return NextResponse.json(company);
}

// PUT /api/companies/[id] - 更新（仅所有者或管理员）
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "公司不存在" }, { status: 404 });
  }

  const isOwner = company.ownerUserId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "无权修改该公司" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const updated = await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      logo: data.logo || null,
      website: data.website || null,
      intro: data.intro || null,
      foundedYear: data.foundedYear,
      phone: data.phone || null,
      wechat: data.wechat || null,
      email: data.email || null,
      origins: JSON.stringify(data.origins),
      destinations: JSON.stringify(data.destinations),
      serviceTypes: JSON.stringify(data.serviceTypes),
      verified: isAdmin ? body.verified ?? company.verified : company.verified,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/companies/[id] - 删除（仅管理员）
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
