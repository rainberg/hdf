/**
 * 集成测试：使用真实 PostgreSQL 数据库验证只读 API
 *
 * 策略：
 *   - 使用 TEST_DATABASE_URL 指向一个【独立空库】（schema 由 prisma db push 创建）
 *   - 仅测试 GET 路由（不涉及鉴权）
 *   - 直接调用 route handler
 *
 * 若未设置 TEST_DATABASE_URL，整个文件跳过（避免无 DB 环境下报错）。
 *
 * 运行：
 *   TEST_DATABASE_URL="postgresql://..." npm test
 *   # 或单独运行：
 *   TEST_DATABASE_URL="postgresql://..." npx vitest run tests/api.integration.test.ts
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { execSync } from "node:child_process";
// 动态导入 route（必须在 mock 之后）
import * as codesRoute from "@/app/api/codes/route";
import * as companiesRoute from "@/app/api/companies/route";
import * as companyDetailRoute from "@/app/api/companies/[id]/route";
import * as phonePlansRoute from "@/app/api/phone-plans/route";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

// 共享测试 prisma 实例（mock 工厂通过 holder 引用，避免循环）
const holder: { prisma: PrismaClient | null } = { prisma: null };

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return holder.prisma;
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const testSuite = TEST_DB_URL ? describe : describe.skip;

function makeJsonRequest(
  url: string,
  method: string,
  body?: unknown,
): NextRequest {
  const init: Record<string, unknown> = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(
    `http://localhost${url}`,
    init as ConstructorParameters<typeof NextRequest>[1],
  );
}

testSuite("API 集成测试（PostgreSQL）", () => {
  let testPrisma: PrismaClient;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    // 推送 schema 到测试库（独立库，不影响开发/生产数据）
    execSync("npx prisma db push", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe",
    });

    const adapter = new PrismaPg(new Pool({ connectionString: TEST_DB_URL }));
    testPrisma = new PrismaClient({ adapter });
    holder.prisma = testPrisma;

    const userPwd = await bcrypt.hash("user12345", 10);
    const user = await testPrisma.user.create({
      data: {
        email: "test-user@huadefu.org",
        passwordHash: userPwd,
        nickname: "测试用户",
        role: "USER",
        creditScore: 50,
        emailVerified: new Date(),
      },
    });
    userId = user.id;

    const company = await testPrisma.company.create({
      data: {
        name: "测试转运公司",
        slug: "test-company",
        intro: "用于集成测试",
        origins: JSON.stringify(["上海"]),
        destinations: JSON.stringify(["法兰克福"]),
        serviceTypes: JSON.stringify(["AIR"]),
        verified: true,
        ratingAvg: 0,
        reviewCount: 0,
      },
    });
    companyId = company.id;

    await testPrisma.companyQuote.create({
      data: {
        companyId,
        channelName: "经济空运",
        serviceType: "AIR",
        origin: "上海",
        destination: "法兰克福",
        firstWeightKg: 0.5,
        firstWeightPrice: 88,
        continueWeightKg: 0.5,
        continueWeightPrice: 28,
        estDaysMin: 5,
        estDaysMax: 9,
      },
    });

    await testPrisma.phonePlan.create({
      data: {
        carrier: "TestCarrier",
        planName: "Test Plan",
        slug: "test-plan",
        type: "MOBILE",
        monthlyFee: 19.99,
        dataGb: 10,
        isUnlimited: false,
        network: "4G",
        contractMonths: 24,
      },
    });
  });

  beforeEach(async () => {
    // 清空可变业务数据（保留用户/公司/套餐/报价）
    await testPrisma.codeVote.deleteMany();
    await testPrisma.reviewVote.deleteMany();
    await testPrisma.review.deleteMany();
    await testPrisma.code.deleteMany();
  });

  afterAll(async () => {
    if (!testPrisma) return;
    await testPrisma.review.deleteMany();
    await testPrisma.companyQuote.deleteMany();
    await testPrisma.company.deleteMany();
    await testPrisma.phonePlan.deleteMany();
    await testPrisma.code.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.$disconnect();
  });

  it("GET /api/companies 返回公司列表", async () => {
    const req = makeJsonRequest("/api/companies", "GET");
    const res = await companiesRoute.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toBeInstanceOf(Array);
    expect(json.total).toBeGreaterThanOrEqual(1);
    expect(
      json.items.some((c: { name: string }) => c.name === "测试转运公司"),
    ).toBe(true);
  });

  it("GET /api/companies 支持关键词搜索", async () => {
    const req = makeJsonRequest("/api/companies?q=测试转运", "GET");
    const res = await companiesRoute.GET(req);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.items[0].name).toBe("测试转运公司");
  });

  it("GET /api/companies 分页参数生效", async () => {
    const req = makeJsonRequest("/api/companies?page=1&pageSize=1", "GET");
    const res = await companiesRoute.GET(req);
    const json = await res.json();
    expect(json.pageSize).toBe(1);
    expect(json.items.length).toBe(1);
  });

  it("GET /api/companies 按服务类型筛选", async () => {
    const req = makeJsonRequest("/api/companies?serviceType=AIR", "GET");
    const res = await companiesRoute.GET(req);
    const json = await res.json();
    expect(json.total).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/companies/[id] 返回公司详情含报价", async () => {
    const req = makeJsonRequest(`/api/companies/${companyId}`, "GET");
    const res = await companyDetailRoute.GET(req, {
      params: Promise.resolve({ id: companyId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("测试转运公司");
    expect(json.quotes.length).toBe(1);
    expect(json.quotes[0].channelName).toBe("经济空运");
  });

  it("GET /api/companies/[id] 不存在返回 404", async () => {
    const req = makeJsonRequest("/api/companies/nonexistent", "GET");
    const res = await companyDetailRoute.GET(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("GET /api/codes 仅返回 ACTIVE 且未过期的码", async () => {
    await testPrisma.code.create({
      data: {
        userId,
        type: "DISCOUNT",
        platform: "TestShop",
        platformCategory: "ecommerce",
        benefitDescription: "-10%",
        codeValue: "TEST10",
        upvotes: 5,
        downvotes: 1,
        status: "ACTIVE",
      },
    });
    await testPrisma.code.create({
      data: {
        userId,
        type: "INVITE",
        platform: "ExpiredShop",
        platformCategory: "tool",
        benefitDescription: "过期邀请",
        codeValue: "EXPIRED",
        status: "EXPIRED",
      },
    });

    const req = makeJsonRequest("/api/codes", "GET");
    const res = await codesRoute.GET(req);
    const json = await res.json();
    expect(json.items.length).toBe(1);
    expect(json.items[0].platform).toBe("TestShop");
  });

  it("GET /api/codes 支持按平台搜索", async () => {
    await testPrisma.code.create({
      data: {
        userId,
        type: "DISCOUNT",
        platform: "TestShop",
        platformCategory: "ecommerce",
        benefitDescription: "-10%",
        codeValue: "TEST10",
        status: "ACTIVE",
      },
    });

    const req = makeJsonRequest("/api/codes?q=TestShop", "GET");
    const res = await codesRoute.GET(req);
    const json = await res.json();
    expect(json.items.length).toBe(1);
  });

  it("GET /api/phone-plans 返回套餐列表", async () => {
    const req = makeJsonRequest("/api/phone-plans", "GET");
    const res = await phonePlansRoute.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items.length).toBeGreaterThanOrEqual(1);
    expect(
      json.items.some((p: { carrier: string }) => p.carrier === "TestCarrier"),
    ).toBe(true);
  });
});
