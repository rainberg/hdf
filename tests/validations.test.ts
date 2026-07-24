import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  companySchema,
  quoteSchema,
  codeSchema,
  phonePlanSchema,
  reviewSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  const valid = {
    email: "alice@example.com",
    nickname: "Alice",
    password: "password123",
    confirmPassword: "password123",
  };

  it("合法输入", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("邮箱格式错误", () => {
    expect(
      registerSchema.safeParse({ ...valid, email: "not-email" }).success,
    ).toBe(false);
  });

  it("昵称过短", () => {
    expect(
      registerSchema.safeParse({ ...valid, nickname: "a" }).success,
    ).toBe(false);
  });

  it("密码过短", () => {
    expect(
      registerSchema.safeParse({
        ...valid,
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });

  it("两次密码不一致", () => {
    expect(
      registerSchema.safeParse({
        ...valid,
        confirmPassword: "different123",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("合法输入", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "123" }).success,
    ).toBe(true);
  });

  it("邮箱错误", () => {
    expect(
      loginSchema.safeParse({ email: "bad", password: "123" }).success,
    ).toBe(false);
  });

  it("空密码", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("companySchema", () => {
  const valid = {
    name: "向东物流",
    origins: ["上海"],
    destinations: ["法兰克福"],
    serviceTypes: ["AIR"] as const,
  };

  it("合法输入", () => {
    expect(companySchema.safeParse(valid).success).toBe(true);
  });

  it("名称过短", () => {
    expect(
      companySchema.safeParse({ ...valid, name: "a" }).success,
    ).toBe(false);
  });

  it("缺起运地", () => {
    expect(
      companySchema.safeParse({ ...valid, origins: [] }).success,
    ).toBe(false);
  });

  it("缺目的地", () => {
    expect(
      companySchema.safeParse({ ...valid, destinations: [] }).success,
    ).toBe(false);
  });

  it("缺服务类型", () => {
    expect(
      companySchema.safeParse({ ...valid, serviceTypes: [] }).success,
    ).toBe(false);
  });

  it("非法服务类型", () => {
    expect(
      companySchema.safeParse({
        ...valid,
        serviceTypes: ["TELEPORT"],
      }).success,
    ).toBe(false);
  });

  it("非法 website URL", () => {
    expect(
      companySchema.safeParse({ ...valid, website: "not-url" }).success,
    ).toBe(false);
  });

  it("合法 website URL", () => {
    expect(
      companySchema.safeParse({
        ...valid,
        website: "https://example.com",
      }).success,
    ).toBe(true);
  });
});

describe("quoteSchema", () => {
  const valid = {
    channelName: "经济空运",
    serviceType: "AIR" as const,
    origin: "上海",
    destination: "法兰克福",
    firstWeightKg: 0.5,
    firstWeightPrice: 88,
    continueWeightKg: 0.5,
    continueWeightPrice: 28,
    estDaysMin: 5,
    estDaysMax: 9,
  };

  it("合法输入", () => {
    expect(quoteSchema.safeParse(valid).success).toBe(true);
  });

  it("首重必须 > 0", () => {
    expect(
      quoteSchema.safeParse({ ...valid, firstWeightKg: 0 }).success,
    ).toBe(false);
  });

  it("续重价必须 ≥ 0", () => {
    expect(
      quoteSchema.safeParse({ ...valid, continueWeightPrice: -1 }).success,
    ).toBe(false);
  });

  it("非法 serviceType", () => {
    expect(
      quoteSchema.safeParse({ ...valid, serviceType: "DRONE" }).success,
    ).toBe(false);
  });

  it("缺渠道名", () => {
    expect(
      quoteSchema.safeParse({ ...valid, channelName: "" }).success,
    ).toBe(false);
  });
});

describe("codeSchema", () => {
  const valid = {
    type: "DISCOUNT" as const,
    platform: "Amazon DE",
    platformCategory: "ecommerce" as const,
    benefitDescription: "首单 -10€",
    codeValue: "HUADIAN10",
    hasReferral: false,
  };

  it("合法输入", () => {
    expect(codeSchema.safeParse(valid).success).toBe(true);
  });

  it("缺平台", () => {
    expect(
      codeSchema.safeParse({ ...valid, platform: "" }).success,
    ).toBe(false);
  });

  it("优惠描述过短", () => {
    expect(
      codeSchema.safeParse({ ...valid, benefitDescription: "a" }).success,
    ).toBe(false);
  });

  it("非法 category", () => {
    expect(
      codeSchema.safeParse({
        ...valid,
        platformCategory: "unknown",
      }).success,
    ).toBe(false);
  });

  it("非法 type", () => {
    expect(
      codeSchema.safeParse({ ...valid, type: "PROMO" }).success,
    ).toBe(false);
  });

  it("非法 link URL", () => {
    expect(
      codeSchema.safeParse({ ...valid, link: "not-url" }).success,
    ).toBe(false);
  });
});

describe("phonePlanSchema", () => {
  const valid = {
    carrier: "Telekom",
    planName: "MagentaMobil M",
    type: "MOBILE" as const,
    monthlyFee: 39.95,
    dataGb: 40,
    isUnlimited: false,
    network: "5G" as const,
    contractMonths: 24,
  };

  it("合法输入", () => {
    expect(phonePlanSchema.safeParse(valid).success).toBe(true);
  });

  it("缺运营商", () => {
    expect(
      phonePlanSchema.safeParse({ ...valid, carrier: "" }).success,
    ).toBe(false);
  });

  it("非法 type", () => {
    expect(
      phonePlanSchema.safeParse({ ...valid, type: "FIBER" }).success,
    ).toBe(false);
  });

  it("非法 network", () => {
    expect(
      phonePlanSchema.safeParse({ ...valid, network: "6G" }).success,
    ).toBe(false);
  });

  it("月费可为 0", () => {
    expect(
      phonePlanSchema.safeParse({ ...valid, monthlyFee: 0 }).success,
    ).toBe(true);
  });
});

describe("reviewSchema", () => {
  const valid = {
    entityType: "COMPANY" as const,
    entityId: "c1",
    overallRating: 4,
    dimensions: {
      price: 4,
      speed: 5,
      package: 4,
      service: 4,
      loss: 5,
      customs: 4,
    },
    content: "服务很棒，物流很快，包装完好。",
    recommend: true,
  };

  it("合法输入", () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true);
  });

  it("总分超出 5", () => {
    expect(
      reviewSchema.safeParse({ ...valid, overallRating: 6 }).success,
    ).toBe(false);
  });

  it("评价过短", () => {
    expect(
      reviewSchema.safeParse({ ...valid, content: "太短" }).success,
    ).toBe(false);
  });

  it("维度评分越界", () => {
    expect(
      reviewSchema.safeParse({
        ...valid,
        dimensions: { ...valid.dimensions, price: 6 },
      }).success,
    ).toBe(false);
  });

  it("非法 entityType", () => {
    expect(
      reviewSchema.safeParse({ ...valid, entityType: "HOTEL" }).success,
    ).toBe(false);
  });
});
