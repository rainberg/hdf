import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { quoteSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; quoteId: string }> };

// PUT /api/companies/[id]/quotes/[quoteId] - 更新报价
export async function PUT(req: NextRequest, { params }: Params) {
  const { id, quoteId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "公司不存在" }, { status: 404 });
  }
  if (company.ownerUserId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权管理该公司报价" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const updated = await prisma.companyQuote.update({
    where: { id: quoteId },
    data: {
      channelName: data.channelName,
      serviceType: data.serviceType,
      origin: data.origin,
      destination: data.destination,
      firstWeightKg: data.firstWeightKg,
      firstWeightPrice: data.firstWeightPrice,
      continueWeightKg: data.continueWeightKg,
      continueWeightPrice: data.continueWeightPrice,
      estDaysMin: data.estDaysMin,
      estDaysMax: data.estDaysMax,
      restrictions: data.restrictions || null,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/companies/[id]/quotes/[quoteId] - 删除（软删除：active=false）
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, quoteId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "公司不存在" }, { status: 404 });
  }
  if (company.ownerUserId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权管理该公司报价" }, { status: 403 });
  }

  await prisma.companyQuote.update({
    where: { id: quoteId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
