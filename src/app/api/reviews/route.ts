import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { reviewSchema } from "@/lib/validations";
import {
  recomputeCompanyRating,
  recomputePhonePlanRating,
} from "@/lib/rating";

// 防刷：同一用户对同一实体 30 天内仅可发布 1 条评价
const REVIEW_COOLDOWN_DAYS = 30;
// 新注册用户 7 天内不可发布评价
const NEW_USER_COOLDOWN_DAYS = 7;
// 每日每用户最多发布评价数
const DAILY_LIMIT = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const userId = session.user.id;

  // 1. 校验邮箱已验证
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      createdAt: true,
      creditScore: true,
    },
  });
  if (!user?.emailVerified) {
    return NextResponse.json(
      { error: "请先验证邮箱后再发布评价" },
      { status: 403 },
    );
  }

  // 2. 新用户冷却期
  const userAgeDays =
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (userAgeDays < NEW_USER_COOLDOWN_DAYS) {
    return NextResponse.json(
      {
        error: `注册满 ${NEW_USER_COOLDOWN_DAYS} 天后可发布评价（信用体系防刷）`,
      },
      { status: 403 },
    );
  }

  // 3. 同一实体 30 天冷却
  const since = new Date();
  since.setDate(since.getDate() - REVIEW_COOLDOWN_DAYS);
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      entityType: data.entityType,
      ...(data.entityType === "COMPANY"
        ? { companyId: data.entityId }
        : { phonePlanId: data.entityId }),
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existingReview) {
    return NextResponse.json(
      { error: `该${data.entityType === "COMPANY" ? "公司" : "套餐"} ${REVIEW_COOLDOWN_DAYS} 天内您已评价过` },
      { status: 409 },
    );
  }

  // 4. 每日限额
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.review.count({
    where: { userId, createdAt: { gte: dayStart } },
  });
  if (todayCount >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: `今日发布已达上限（${DAILY_LIMIT} 条）` },
      { status: 429 },
    );
  }

  // 5. 校验实体存在
  if (data.entityType === "COMPANY") {
    const company = await prisma.company.findUnique({
      where: { id: data.entityId },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }
  } else {
    const plan = await prisma.phonePlan.findUnique({
      where: { id: data.entityId },
      select: { id: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "套餐不存在" }, { status: 404 });
    }
  }

  // 6. 创建评价（默认 PENDING 状态，需审核；老用户/高信用用户可直接发布）
  // 信用分 >= 50 的用户直接发布，否则进入审核队列
  const autoPublish = user.creditScore >= 50;

  const review = await prisma.review.create({
    data: {
      entityType: data.entityType,
      companyId: data.entityType === "COMPANY" ? data.entityId : null,
      phonePlanId: data.entityType === "PHONE_PLAN" ? data.entityId : null,
      userId,
      overallRating: data.overallRating,
      dimensions: JSON.stringify(data.dimensions),
      content: data.content,
      images: JSON.stringify(data.images),
      recommend: data.recommend,
      scenario: data.scenario || null,
      route: data.route || null,
      weight: data.weight,
      cost: data.cost,
      status: autoPublish ? "PUBLISHED" : "PENDING",
    },
  });

  // 7. 发布成功则重算评分
  if (autoPublish) {
    if (data.entityType === "COMPANY") {
      await recomputeCompanyRating(data.entityId);
    } else {
      await recomputePhonePlanRating(data.entityId);
    }
  }

  // 8. 用户信用分 +1（鼓励贡献）
  await prisma.user.update({
    where: { id: userId },
    data: { creditScore: { increment: 1 } },
  });

  return NextResponse.json(
    {
      message: autoPublish
        ? "评价发布成功"
        : "评价已提交，将在审核通过后展示",
      review,
    },
    { status: 201 },
  );
}

// GET /api/reviews - 列表（按实体）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const phonePlanId = searchParams.get("phonePlanId");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const sort = searchParams.get("sort") ?? "newest";

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (companyId) where.companyId = companyId;
  if (phonePlanId) where.phonePlanId = phonePlanId;

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "likes" ? { likes: "desc" } : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: { nickname: true, avatar: true, creditScore: true },
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
