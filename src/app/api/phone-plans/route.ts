import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { phonePlanSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/phone-plans - 套餐列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const carrier = searchParams.get("carrier");
  const type = searchParams.get("type");
  const maxFee = searchParams.get("maxFee");
  const contractMonths = searchParams.get("contractMonths");
  const sort = searchParams.get("sort") ?? "fee-asc";
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (carrier) where.carrier = carrier;
  if (type) where.type = type;
  if (maxFee) where.monthlyFee = { lte: Number(maxFee) };
  if (contractMonths === "0") where.OR = [{ contractMonths: null }, { contractMonths: 0 }];
  if (contractMonths && contractMonths !== "0")
    where.contractMonths = { gte: Number(contractMonths) };
  if (q) {
    where.OR = [
      { carrier: { contains: q } },
      { planName: { contains: q } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "fee-desc"
      ? { monthlyFee: "desc" }
      : sort === "rating"
        ? { ratingAvg: "desc" }
        : { monthlyFee: "asc" };

  const [total, items] = await Promise.all([
    prisma.phonePlan.count({ where }),
    prisma.phonePlan.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST /api/phone-plans - 创建套餐（仅管理员，数据为人工录入）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = phonePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const slug = slugify(`${data.carrier}-${data.planName}`) + "-" + Math.random().toString(36).slice(2, 6);

  const plan = await prisma.phonePlan.create({
    data: {
      carrier: data.carrier,
      planName: data.planName,
      slug,
      type: data.type,
      monthlyFee: data.monthlyFee,
      dataGb: data.dataGb,
      isUnlimited: data.isUnlimited,
      network: data.network,
      contractMonths: data.contractMonths,
      promoPrice: data.promoPrice,
      promoMonths: data.promoMonths,
      restorePrice: data.restorePrice,
      officialUrl: data.officialUrl || null,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
