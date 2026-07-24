import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { codeSchema } from "@/lib/validations";

// GET /api/codes - 优惠码列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "newest"; // newest / hot
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (category) where.platformCategory = category;
  if (q) {
    where.OR = [
      { platform: { contains: q } },
      { benefitDescription: { contains: q } },
    ];
  }

  // 排除已过期
  const now = new Date();
  where.AND = [
    {
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    },
  ];

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "hot"
      ? { upvotes: "desc" }
      : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.code.count({ where }),
    prisma.code.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { nickname: true, creditScore: true } },
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

// POST /api/codes - 发布优惠码
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = codeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const userId = session.user.id;

  // 反作弊：同一用户同一平台每日最多 3 条
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.code.count({
    where: { userId, platform: data.platform, createdAt: { gte: dayStart } },
  });
  if (todayCount >= 3) {
    return NextResponse.json(
      { error: "同一平台今日发布已达上限（3 条）" },
      { status: 429 },
    );
  }

  // 至少有 codeValue 或 link
  if (!data.codeValue && !data.link) {
    return NextResponse.json(
      { error: "请填写码值或链接" },
      { status: 400 },
    );
  }

  const code = await prisma.code.create({
    data: {
      userId,
      type: data.type,
      platform: data.platform,
      platformCategory: data.platformCategory,
      benefitDescription: data.benefitDescription,
      codeValue: data.codeValue || null,
      link: data.link || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      hasReferral: data.hasReferral,
    },
  });

  return NextResponse.json(code, { status: 201 });
}
