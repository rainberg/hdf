import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { companySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/companies - 列表查询，支持筛选/排序/分页
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const serviceType = searchParams.get("serviceType"); // AIR / SEA / RAIL / SPECIAL
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const verified = searchParams.get("verified");
  const minRating = Number(searchParams.get("minRating") ?? "0");
  const sort = searchParams.get("sort") ?? "rating"; // rating / reviews / newest / price
  const q = searchParams.get("q")?.trim();

  // 构造 where：JSON 字段做 LIKE 模糊匹配（SQLite 友好）
  const where: Record<string, unknown> = {};
  if (serviceType) where.serviceTypes = { contains: serviceType };
  if (origin) where.origins = { contains: origin };
  if (destination) where.destinations = { contains: destination };
  if (verified === "true") where.verified = true;
  if (minRating > 0) where.ratingAvg = { gte: minRating };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { intro: { contains: q } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "reviews"
      ? { reviewCount: "desc" }
      : sort === "newest"
        ? { createdAt: "desc" }
        : sort === "price"
          ? { ratingAvg: "asc" } // 价格排序需联表查询，简化为按评分升序
          : { ratingAvg: "desc" };

  const [total, items] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        quotes: {
          where: { active: true },
          take: 1,
          orderBy: { firstWeightPrice: "asc" },
        },
      },
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

// POST /api/companies - 创建公司（管理员/已通过审核商家）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "MERCHANT") {
    return NextResponse.json({ error: "无权限创建公司" }, { status: 403 });
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
  const slug = slugify(data.name) + "-" + Math.random().toString(36).slice(2, 6);

  // 同名公司检查
  const existing = await prisma.company.findFirst({
    where: { name: data.name },
  });
  if (existing) {
    return NextResponse.json({ error: "该公司名已存在" }, { status: 409 });
  }

  const company = await prisma.company.create({
    data: {
      name: data.name,
      slug,
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
      verified: session.user.role === "ADMIN", // 管理员创建默认认证
      ownerUserId: session.user.role === "MERCHANT" ? session.user.id : null,
    },
  });

  return NextResponse.json(company, { status: 201 });
}
