import { prisma } from "@/lib/prisma";
import { creditLevel } from "@/lib/utils";

// 重新计算实体的综合评分
// 评分汇总算法（PRD §3.2.3）：
//   综合评分 = 用户评分 × 0.7 + 网络评价分 × 0.3
//   用户评分按用户信用加权
//   网络评价分：正面=5，中性=3，负面=1
// 评价数 < 5 时仍计算，但页面会标注「样本不足」

const USER_WEIGHT = 0.7;
const AGGREGATED_WEIGHT = 0.3;

const sentimentScore: Record<string, number> = {
  POSITIVE: 5,
  NEUTRAL: 3,
  NEGATIVE: 1,
};

/**
 * 重算某公司综合评分，并写入 ratingAvg / reviewCount
 */
export async function recomputeCompanyRating(companyId: string) {
  const [reviews, aggregated] = await Promise.all([
    prisma.review.findMany({
      where: { companyId, status: "PUBLISHED" },
      select: { overallRating: true, userId: true },
    }),
    prisma.aggregatedReview.findMany({
      where: { companyId },
      select: { sentiment: true, likes: true },
    }),
  ]);

  // 加权用户评分
  const users = await prisma.user.findMany({
    where: { id: { in: reviews.map((r) => r.userId) } },
    select: { id: true, creditScore: true },
  });
  const userWeightMap = new Map(
    users.map((u) => [u.id, creditLevel(u.creditScore).weight]),
  );

  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const w = userWeightMap.get(r.userId) ?? 1.0;
    weightedSum += r.overallRating * w;
    weightTotal += w;
  }
  const userScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // 加权聚合评分（按点赞数加权）
  let aggSum = 0;
  let aggWeight = 0;
  for (const a of aggregated) {
    const s = sentimentScore[a.sentiment] ?? 3;
    const w = a.likes + 1; // +1 避免 0 权重
    aggSum += s * w;
    aggWeight += w;
  }
  const aggScore = aggWeight > 0 ? aggSum / aggWeight : 0;

  // 综合：仅有用户评分时直接用；仅有聚合时直接用；都没有则 0
  let final = 0;
  if (weightTotal > 0 && aggWeight > 0) {
    final = userScore * USER_WEIGHT + aggScore * AGGREGATED_WEIGHT;
  } else if (weightTotal > 0) {
    final = userScore;
  } else if (aggWeight > 0) {
    final = aggScore;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      ratingAvg: Math.round(final * 10) / 10,
      reviewCount: reviews.length,
    },
  });
}

/**
 * 重算电话套餐综合评分（无聚合评价，仅用户评分加权）
 */
export async function recomputePhonePlanRating(planId: string) {
  const reviews = await prisma.review.findMany({
    where: { phonePlanId: planId, status: "PUBLISHED" },
    select: { overallRating: true, userId: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: reviews.map((r) => r.userId) } },
    select: { id: true, creditScore: true },
  });
  const userWeightMap = new Map(
    users.map((u) => [u.id, creditLevel(u.creditScore).weight]),
  );

  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const w = userWeightMap.get(r.userId) ?? 1.0;
    weightedSum += r.overallRating * w;
    weightTotal += w;
  }
  const final = weightTotal > 0 ? weightedSum / weightTotal : 0;

  await prisma.phonePlan.update({
    where: { id: planId },
    data: {
      ratingAvg: Math.round(final * 10) / 10,
      reviewCount: reviews.length,
    },
  });
}
