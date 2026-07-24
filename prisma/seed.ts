import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

/**
 * 种子数据脚本
 * 运行：npm run seed（或 npx prisma db seed）
 *
 * 数据内容：
 * - 1 个管理员 + 2 个普通用户 + 1 个商家
 * - 3 家中德转运公司及其报价
 * - 4 个电话套餐
 * - 若干优惠码
 * - 若干聚合网络评价
 * - 若干用户评价
 */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 未设置，无法执行 seed");
}
const adapter = new PrismaNeonHttp(databaseUrl, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始写入种子数据…");

  // 清空（顺序：先删依赖方）
  await prisma.codeVote.deleteMany();
  await prisma.reviewVote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.aggregatedReview.deleteMany();
  await prisma.companyQuote.deleteMany();
  await prisma.company.deleteMany();
  await prisma.code.deleteMany();
  await prisma.phonePlan.deleteMany();
  await prisma.merchantProfile.deleteMany();
  await prisma.user.deleteMany();

  // ============ 用户 ============
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user12345", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@huadefu.org",
      passwordHash: adminPassword,
      nickname: "运营小助手",
      role: "ADMIN",
      creditScore: 100,
      emailVerified: new Date(),
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      passwordHash: userPassword,
      nickname: "在德Alice",
      role: "USER",
      creditScore: 65,
      emailVerified: new Date(),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      passwordHash: userPassword,
      nickname: "柏林搬砖Bob",
      role: "USER",
      creditScore: 40,
      emailVerified: new Date(),
    },
  });

  const merchantUser = await prisma.user.create({
    data: {
      email: "merchant@goeast.example",
      passwordHash: userPassword,
      nickname: "向东物流官方",
      role: "MERCHANT",
      creditScore: 80,
      emailVerified: new Date(),
    },
  });

  await prisma.merchantProfile.create({
    data: {
      userId: merchantUser.id,
      businessName: "向东物流 Germany GmbH",
      businessLicense: "HRB-123456-B",
      contactEmail: "service@goeast.example",
      contactPhone: "+49 30 12345678",
      status: "APPROVED",
    },
  });

  console.log(`✅ 用户：${[admin, alice, bob, merchantUser].length} 名`);

  // ============ 转运公司 ============
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: "向东物流 GoEast",
        slug: "xiangdong-wuliu-goest",
        logo: null,
        website: "https://goeast.example",
        intro: "专注中德空运 8 年，法兰克福清关，3-7 天可达全德。",
        foundedYear: 2017,
        phone: "+49 69 12345678",
        wechat: "goeast_de",
        email: "service@goeast.example",
        origins: JSON.stringify(["上海", "广州", "深圳", "义乌"]),
        destinations: JSON.stringify(["法兰克福", "柏林", "慕尼黑", "全德"]),
        serviceTypes: JSON.stringify(["AIR", "SEA"]),
        verified: true,
        ratingAvg: 4.4,
        reviewCount: 3,
        ownerUserId: merchantUser.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "云途物流 YunTu",
        slug: "yuntu-wuliu-yuntu",
        website: "https://yuntu.example",
        intro: "中欧班列主力承运商，性价比之选，铁路直达杜伊斯堡。",
        foundedYear: 2015,
        phone: "+49 203 987654",
        wechat: "yuntu_logistics",
        email: "info@yuntu.example",
        origins: JSON.stringify(["重庆", "成都", "西安", "郑州"]),
        destinations: JSON.stringify(["杜伊斯堡", "汉堡", "全德"]),
        serviceTypes: JSON.stringify(["RAIL", "SEA"]),
        verified: true,
        ratingAvg: 4.1,
        reviewCount: 2,
      },
    }),
    prisma.company.create({
      data: {
        name: "海派速递 HaiPai",
        slug: "haipai-sudi-haipai",
        website: "https://haipai.example",
        intro: "海运小包专家，大件家具首选，价格亲民时效略长。",
        foundedYear: 2019,
        phone: "+49 40 55667788",
        wechat: "haipai_de",
        email: "support@haipai.example",
        origins: JSON.stringify(["宁波", "青岛", "上海"]),
        destinations: JSON.stringify(["汉堡", "不莱梅", "全德"]),
        serviceTypes: JSON.stringify(["SEA", "SPECIAL"]),
        verified: false,
        ratingAvg: 3.8,
        reviewCount: 1,
      },
    }),
  ]);

  // ============ 报价 ============
  await prisma.companyQuote.create({
    data: {
      companyId: companies[0].id,
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
      restrictions: "禁运电池、液体；单件 ≤ 30kg",
    },
  });
  await prisma.companyQuote.create({
    data: {
      companyId: companies[0].id,
      channelName: "特快空运",
      serviceType: "AIR",
      origin: "上海",
      destination: "法兰克福",
      firstWeightKg: 0.5,
      firstWeightPrice: 138,
      continueWeightKg: 0.5,
      continueWeightPrice: 45,
      estDaysMin: 3,
      estDaysMax: 5,
      restrictions: "支持带电，需提供 MSDS",
    },
  });
  await prisma.companyQuote.create({
    data: {
      companyId: companies[1].id,
      channelName: "中欧班列 经济",
      serviceType: "RAIL",
      origin: "重庆",
      destination: "杜伊斯堡",
      firstWeightKg: 1,
      firstWeightPrice: 55,
      continueWeightKg: 1,
      continueWeightPrice: 18,
      estDaysMin: 18,
      estDaysMax: 28,
      restrictions: "禁运液体、粉末；适合非紧急货物",
    },
  });
  await prisma.companyQuote.create({
    data: {
      companyId: companies[1].id,
      channelName: "海运整柜",
      serviceType: "SEA",
      origin: "宁波",
      destination: "汉堡",
      firstWeightKg: 21,
      firstWeightPrice: 380,
      continueWeightKg: 1,
      continueWeightPrice: 12,
      estDaysMin: 35,
      estDaysMax: 50,
      restrictions: "适合家具、大件；最少 21kg 起",
    },
  });
  await prisma.companyQuote.create({
    data: {
      companyId: companies[2].id,
      channelName: "海运小包",
      serviceType: "SEA",
      origin: "宁波",
      destination: "汉堡",
      firstWeightKg: 1,
      firstWeightPrice: 45,
      continueWeightKg: 1,
      continueWeightPrice: 15,
      estDaysMin: 40,
      estDaysMax: 60,
      restrictions: "单件 ≤ 20kg；不计体积重",
    },
  });

  console.log(`✅ 公司：${companies.length} 家，报价 5 条`);

  // ============ 电话套餐 ============
  const plans = await Promise.all([
    prisma.phonePlan.create({
      data: {
        carrier: "Telekom",
        planName: "MagentaMobil M",
        slug: "telekom-magentamobil-m",
        type: "MOBILE",
        monthlyFee: 39.95,
        dataGb: 40,
        isUnlimited: false,
        network: "5G",
        contractMonths: 24,
        promoPrice: 19.95,
        promoMonths: 6,
        restorePrice: 39.95,
        officialUrl: "https://www.telekom.de",
        ratingAvg: 4.3,
        reviewCount: 2,
      },
    }),
    prisma.phonePlan.create({
      data: {
        carrier: "Vodafone",
        planName: "GigaMobil M",
        slug: "vodafone-gigamobil-m",
        type: "MOBILE",
        monthlyFee: 34.99,
        dataGb: 30,
        isUnlimited: false,
        network: "5G",
        contractMonths: 24,
        promoPrice: 14.99,
        promoMonths: 6,
        restorePrice: 34.99,
        officialUrl: "https://www.vodafone.de",
        ratingAvg: 4.0,
        reviewCount: 1,
      },
    }),
    prisma.phonePlan.create({
      data: {
        carrier: "O2",
        planName: "O2 Free S",
        slug: "o2-free-s",
        type: "MOBILE",
        monthlyFee: 24.99,
        dataGb: 10,
        isUnlimited: false,
        network: "4G",
        contractMonths: 24,
        officialUrl: "https://www.o2online.de",
        ratingAvg: 3.7,
        reviewCount: 0,
      },
    }),
    prisma.phonePlan.create({
      data: {
        carrier: "congstar",
        planName: "Prepaid Wie ich will",
        slug: "congstar-prepaid-wie-ich-will",
        type: "PREPAID",
        monthlyFee: 9.99,
        dataGb: 3,
        isUnlimited: false,
        network: "4G",
        contractMonths: null,
        officialUrl: "https://www.congstar.de",
        ratingAvg: 4.2,
        reviewCount: 0,
      },
    }),
  ]);

  console.log(`✅ 电话套餐：${plans.length} 个`);

  // ============ 优惠码 ============
  await Promise.all([
    prisma.code.create({
      data: {
        userId: alice.id,
        type: "INVITE",
        platform: "Amazon DE",
        platformCategory: "ecommerce",
        benefitDescription: "首单立减 10€，需通过专属链接注册",
        codeValue: "ALICE10",
        link: "https://amazon.example/?ref=alice10",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        upvotes: 12,
        downvotes: 1,
        hasReferral: true,
        status: "ACTIVE",
      },
    }),
    prisma.code.create({
      data: {
        userId: bob.id,
        type: "REFERRAL",
        platform: "Telegram Premium",
        platformCategory: "tool",
        benefitDescription: "通过链接订阅双方各得 3 个月免费",
        codeValue: "BOBTEL",
        link: "https://t.me/premium?ref=bobtel",
        upvotes: 8,
        downvotes: 0,
        hasReferral: true,
        status: "ACTIVE",
      },
    }),
    prisma.code.create({
      data: {
        userId: alice.id,
        type: "DISCOUNT",
        platform: "About You",
        platformCategory: "ecommerce",
        benefitDescription: "新用户首单 -15%",
        codeValue: "HUADIAN15",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        upvotes: 5,
        downvotes: 4,
        hasReferral: false,
        status: "ACTIVE",
      },
    }),
  ]);

  console.log("✅ 优惠码：3 条");

  // ============ 聚合网络评价 ============
  await prisma.aggregatedReview.create({
    data: {
      companyId: companies[0].id,
      source: "zhihu",
      title: "向东物流用了 3 年，说说真实体验",
      summary:
        "价格中等偏上，空运时效稳定 5-7 天；客服微信回复及时；偶有体积重争议。",
      originalUrl: "https://www.zhihu.com/question/xxx/answer/yyy",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      likes: 220,
      sentiment: "POSITIVE",
    },
  });
  await prisma.aggregatedReview.create({
    data: {
      companyId: companies[0].id,
      source: "xiaohongshu",
      title: "在德华人空运避雷指南",
      summary:
        "向东的特快线路带电包裹能发，但要注意单件不超过 30kg，超过会被拆包。",
      originalUrl: "https://www.xiaohongshu.com/explore/abc",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      likes: 88,
      sentiment: "NEUTRAL",
    },
  });
  await prisma.aggregatedReview.create({
    data: {
      companyId: companies[1].id,
      source: "tieba",
      title: "中欧班列物流商横评",
      summary:
        "云途班列价格优势明显，但 18-28 天时效偏长，适合非紧急货物。",
      originalUrl: "https://tieba.baidu.com/p/zzz",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      likes: 56,
      sentiment: "POSITIVE",
    },
  });

  console.log("✅ 聚合评价：3 条");

  // ============ 用户评价 ============
  await prisma.review.create({
    data: {
      entityType: "COMPANY",
      companyId: companies[0].id,
      userId: alice.id,
      overallRating: 5,
      dimensions: JSON.stringify({
        price: 4,
        speed: 5,
        package: 4,
        service: 5,
        loss: 5,
        customs: 4,
      }),
      content:
        "上海寄法兰克福，特快线路 4 天到，包装完好；客服微信回复很及时，会回购。",
      images: "[]",
      recommend: true,
      scenario: "母婴用品",
      route: "上海 → 法兰克福",
      weight: 4.2,
      cost: 280,
      status: "PUBLISHED",
      likes: 6,
    },
  });
  await prisma.review.create({
    data: {
      entityType: "COMPANY",
      companyId: companies[0].id,
      userId: bob.id,
      overallRating: 4,
      dimensions: JSON.stringify({
        price: 4,
        speed: 4,
        package: 4,
        service: 4,
        loss: 5,
        customs: 4,
      }),
      content:
        "经济空运 7 天到，价格还行。但体积重计算有点严格，建议小件合并打包。",
      images: "[]",
      recommend: true,
      scenario: "衣服鞋包",
      route: "广州 → 法兰克福",
      weight: 6.5,
      cost: 198,
      status: "PUBLISHED",
      likes: 2,
    },
  });
  await prisma.review.create({
    data: {
      entityType: "COMPANY",
      companyId: companies[1].id,
      userId: alice.id,
      overallRating: 4,
      dimensions: JSON.stringify({
        price: 5,
        speed: 3,
        package: 4,
        service: 4,
        loss: 4,
        customs: 4,
      }),
      content:
        "中欧班列 22 天到杜伊斯堡，性价比很高，适合不急的家具和大件。",
      images: "[]",
      recommend: true,
      scenario: "家具",
      route: "重庆 → 杜伊斯堡",
      weight: 28,
      cost: 690,
      status: "PUBLISHED",
    },
  });
  await prisma.review.create({
    data: {
      entityType: "COMPANY",
      companyId: companies[2].id,
      userId: bob.id,
      overallRating: 3,
      dimensions: JSON.stringify({
        price: 5,
        speed: 2,
        package: 3,
        service: 3,
        loss: 4,
        customs: 3,
      }),
      content:
        "海运小包 52 天才到，比预期慢很多，但价格便宜，对时效不敏感的可选。",
      images: "[]",
      recommend: false,
      scenario: "图书",
      route: "宁波 → 汉堡",
      weight: 12,
      cost: 220,
      status: "PENDING",
    },
  });

  await prisma.review.create({
    data: {
      entityType: "PHONE_PLAN",
      phonePlanId: plans[0].id,
      userId: alice.id,
      overallRating: 4,
      dimensions: JSON.stringify({
        price: 4,
        speed: 5,
        package: 4,
        service: 4,
        loss: 5,
        customs: 5,
      }),
      content:
        "Telekom MagentaMobil M 信号覆盖好，5G 在大城市稳定；前 6 个月 19.95€ 性价比不错。",
      images: "[]",
      recommend: true,
      status: "PUBLISHED",
    },
  });
  await prisma.review.create({
    data: {
      entityType: "PHONE_PLAN",
      phonePlanId: plans[0].id,
      userId: bob.id,
      overallRating: 4,
      dimensions: JSON.stringify({
        price: 3,
        speed: 5,
        package: 4,
        service: 4,
        loss: 5,
        customs: 5,
      }),
      content:
        "24 个月合约偏长，但网络质量确实是德国第一梯队，乡村地区也有 4G。",
      images: "[]",
      recommend: true,
      status: "PUBLISHED",
    },
  });
  await prisma.review.create({
    data: {
      entityType: "PHONE_PLAN",
      phonePlanId: plans[1].id,
      userId: alice.id,
      overallRating: 4,
      dimensions: JSON.stringify({
        price: 4,
        speed: 4,
        package: 4,
        service: 4,
        loss: 5,
        customs: 5,
      }),
      content:
        "Vodafone GigaMobil M 性价比不错，城市 5G 信号满格，乡村偶尔切 4G。",
      images: "[]",
      recommend: true,
      status: "PUBLISHED",
    },
  });

  console.log("✅ 用户评价：7 条（含 1 条待审核）");

  console.log("\n🎉 种子数据写入完成！");
  console.log("   管理员账号：admin@huadefu.org / admin123");
  console.log("   普通用户：alice@example.com / user12345");
  console.log("   普通用户：bob@example.com / user12345");
  console.log("   商家账号：merchant@goeast.example / user12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
