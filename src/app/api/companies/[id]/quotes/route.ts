import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { quoteSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/companies/[id]/quotes - 报价列表
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotes = await prisma.companyQuote.findMany({
    where: { companyId: id, active: true },
    orderBy: [{ serviceType: "asc" }, { firstWeightPrice: "asc" }],
  });
  return NextResponse.json(quotes);
}

// POST /api/companies/[id]/quotes - 新增报价（所有者或管理员）
export async function POST(req: NextRequest, { params }: Params) {
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
  const quote = await prisma.companyQuote.create({
    data: {
      companyId: id,
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

  return NextResponse.json(quote, { status: 201 });
}
