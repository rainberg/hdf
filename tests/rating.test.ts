import { describe, it, expect, vi, beforeEach } from "vitest";

// 在导入 rating.ts 之前 mock prisma 模块
const prismaMock = {
  review: {
    findMany: vi.fn(),
  },
  aggregatedReview: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
  company: {
    update: vi.fn(),
  },
  phonePlan: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// 必须在 mock 之后导入
const { recomputeCompanyRating, recomputePhonePlanRating } = await import(
  "@/lib/rating"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recomputeCompanyRating", () => {
  it("仅用户评分：按信用加权平均", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { overallRating: 4, userId: "u1" },
      { overallRating: 5, userId: "u2" },
    ]);
    prismaMock.aggregatedReview.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", creditScore: 30 }, // 普通 weight=1.0
      { id: "u2", creditScore: 60 }, // 活跃 weight=1.5
    ]);
    prismaMock.company.update.mockResolvedValue({});

    await recomputeCompanyRating("c1");

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: {
        // (4*1 + 5*1.5) / (1+1.5) = 11.5 / 2.5 = 4.6
        ratingAvg: 4.6,
        reviewCount: 2,
      },
    });
  });

  it("仅聚合评分：正面/中性按点赞加权", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);
    prismaMock.aggregatedReview.findMany.mockResolvedValue([
      { sentiment: "POSITIVE", likes: 10 }, // 5 * 11 = 55
      { sentiment: "NEUTRAL", likes: 0 }, // 3 * 1 = 3
    ]);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.company.update.mockResolvedValue({});

    await recomputeCompanyRating("c1");

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: {
        // (55 + 3) / (11 + 1) = 58 / 12 = 4.833... → 4.8
        ratingAvg: 4.8,
        reviewCount: 0,
      },
    });
  });

  it("用户 + 聚合：综合 0.7/0.3 加权", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { overallRating: 5, userId: "u1" },
    ]);
    prismaMock.aggregatedReview.findMany.mockResolvedValue([
      { sentiment: "NEGATIVE", likes: 0 }, // 1 * 1 = 1
    ]);
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", creditScore: 30 }, // weight 1.0
    ]);
    prismaMock.company.update.mockResolvedValue({});

    await recomputeCompanyRating("c1");

    // userScore = 5, aggScore = 1
    // final = 5*0.7 + 1*0.3 = 3.5 + 0.3 = 3.8
    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { ratingAvg: 3.8, reviewCount: 1 },
    });
  });

  it("无任何评分：返回 0", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);
    prismaMock.aggregatedReview.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.company.update.mockResolvedValue({});

    await recomputeCompanyRating("c1");

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { ratingAvg: 0, reviewCount: 0 },
    });
  });

  it("未知用户回退权重 1.0", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { overallRating: 3, userId: "ghost" },
    ]);
    prismaMock.aggregatedReview.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]); // 没有该用户
    prismaMock.company.update.mockResolvedValue({});

    await recomputeCompanyRating("c1");

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { ratingAvg: 3, reviewCount: 1 },
    });
  });
});

describe("recomputePhonePlanRating", () => {
  it("按信用加权平均", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { overallRating: 5, userId: "u1" },
      { overallRating: 3, userId: "u2" },
    ]);
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", creditScore: 85 }, // 资深 2.0
      { id: "u2", creditScore: 10 }, // 新人 0.5
    ]);
    prismaMock.phonePlan.update.mockResolvedValue({});

    await recomputePhonePlanRating("p1");

    // (5*2 + 3*0.5) / (2+0.5) = 11.5 / 2.5 = 4.6
    expect(prismaMock.phonePlan.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { ratingAvg: 4.6, reviewCount: 2 },
    });
  });

  it("无评分返回 0", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.phonePlan.update.mockResolvedValue({});

    await recomputePhonePlanRating("p1");

    expect(prismaMock.phonePlan.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { ratingAvg: 0, reviewCount: 0 },
    });
  });
});
