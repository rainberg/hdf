/**
 * 录入 8 家真实中德集运公司（中国→德国方向）
 * 数据来源：subagent 通过 WebSearch + WebFetch 调研
 * 运行：node --env-file=.env --import tsx scripts/seed-real-companies.ts
 *
 * 注意：
 * - ServiceType enum: AIR | SEA | RAIL | SPECIAL
 *   原 JSON 中的 "TRUCK" 映射为 "SPECIAL"
 * - 价格单位统一为人民币 ¥（欧元已按 1€≈8¥ 换算）
 * - 删除原占位 3 家公司（goeast/yuntu/haipai）会级联删除其评价
 * - 保留用户、电话套餐、优惠码、电话套餐评价等
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 未设置");
}
const adapter = new PrismaNeonHttp(databaseUrl, {});
const prisma = new PrismaClient({ adapter });

type Quote = {
  channelName: string;
  serviceType: "AIR" | "SEA" | "RAIL" | "SPECIAL";
  origin: string;
  destination: string;
  firstWeightKg: number;
  firstWeightPrice: number;
  continueWeightKg: number;
  continueWeightPrice: number;
  estDaysMin: number;
  estDaysMax: number;
  restrictions: string;
};

type Company = {
  name: string;
  slug: string;
  website: string;
  intro: string;
  foundedYear: number | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  origins: string[];
  destinations: string[];
  serviceTypes: string[];
  quotes: Quote[];
};

const companies: Company[] = [
  {
    name: "象样集运",
    slug: "xiangyang-jiyun",
    website: "https://www.imagineship.com/",
    intro:
      "深圳自营仓库的中国集运平台，支持淘宝/京东/拼多多/1688 商品转运到德国，提供欧盟双清包税服务，全程物流追踪。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["法兰克福", "柏林", "慕尼黑", "杜塞尔多夫", "全德"],
    serviceTypes: ["AIR", "SEA"],
    quotes: [
      {
        channelName: "空运普货",
        serviceType: "AIR",
        origin: "深圳",
        destination: "法兰克福",
        firstWeightKg: 1,
        firstWeightPrice: 60,
        continueWeightKg: 1,
        continueWeightPrice: 60,
        estDaysMin: 7,
        estDaysMax: 15,
        restrictions:
          "官网参考区间价 ¥45-80/kg；按实际重与体积重(长×宽×高÷5000)取大值计费；多件合箱可省 20%-40%；经香港/广州机场→法兰克福 FRA→德国全境派送(DHL/DPD/Hermes)",
      },
      {
        channelName: "海运",
        serviceType: "SEA",
        origin: "深圳",
        destination: "汉堡",
        firstWeightKg: 1,
        firstWeightPrice: 20,
        continueWeightKg: 1,
        continueWeightPrice: 20,
        estDaysMin: 25,
        estDaysMax: 45,
        restrictions:
          "官网参考区间价 ¥12-30/kg；深圳蛇口港→汉堡港；适合大件家居、批量物品；双清包税",
      },
    ],
  },
  {
    name: "雁巢集运 YANCHAObuy",
    slug: "yanchao-jiyun",
    website: "https://buy.yanchao.cn/",
    intro:
      "提供代购+集运一站式服务，覆盖 14 类商品(含食品/化妆品/带电/液体)，180 天免费仓储，免费验货拍照与重新打包，¥500 免费保险，欧盟 DDP 双清包税。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA", "SPECIAL"],
    quotes: [
      {
        channelName: "欧盟空运普货快线",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 0.5,
        firstWeightPrice: 137,
        continueWeightKg: 0.5,
        continueWeightPrice: 43,
        estDaysMin: 8,
        estDaysMax: 15,
        restrictions: "单件最大 25kg；覆盖 26 个欧盟国家；DDP 含税到门",
      },
      {
        channelName: "欧盟空运敏感货(电池/液体/粉末)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 0.5,
        firstWeightPrice: 140,
        continueWeightKg: 0.5,
        continueWeightPrice: 45,
        estDaysMin: 8,
        estDaysMax: 15,
        restrictions: "单件最大 25kg；可走电池/液体/粉末/食品/化妆品等敏感货",
      },
      {
        channelName: "欧盟空运大货(10kg+)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 10,
        firstWeightPrice: 840,
        continueWeightKg: 1,
        continueWeightPrice: 84,
        estDaysMin: 8,
        estDaysMax: 15,
        restrictions: "单件最大 199kg；适合大批量/团购/小商家补货",
      },
      {
        channelName: "欧洲卡航(12kg+)",
        serviceType: "SPECIAL",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 12,
        firstWeightPrice: 438,
        continueWeightKg: 1,
        continueWeightPrice: 36.5,
        estDaysMin: 25,
        estDaysMax: 35,
        restrictions: "单价 ¥36.5-52/kg 区间；单件最大 2000kg；DDP 含税；大批量最划算的陆运渠道",
      },
      {
        channelName: "欧洲海运(21kg+)",
        serviceType: "SEA",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 21,
        firstWeightPrice: 750,
        continueWeightKg: 1,
        continueWeightPrice: 34.5,
        estDaysMin: 45,
        estDaysMax: 60,
        restrictions: "单件最大 2000kg；适合重货/大件/不急物品；DDP 含税",
      },
    ],
  },
  {
    name: "CNFans",
    slug: "cnfans",
    website: "https://www.cnfans.com/",
    intro:
      "面向海外买家的中国代购集运平台，支持淘宝/1688/微店采购，提供 150+ 条物流线路，3-5 张免费 QC 照片与免费仓储。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA"],
    quotes: [
      {
        channelName: "EMS 空运(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 0.5,
        firstWeightPrice: 90,
        continueWeightKg: 0.5,
        continueWeightPrice: 59,
        estDaysMin: 7,
        estDaysMax: 15,
        restrictions: "首 500g 约 $12.5，续 500g 约 $8.2(按 1$≈7.2¥ 换算)；7-12 天到货",
      },
      {
        channelName: "China Post SAL 经济空运",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 0.5,
        firstWeightPrice: 60,
        continueWeightKg: 0.5,
        continueWeightPrice: 39,
        estDaysMin: 15,
        estDaysMax: 30,
        restrictions: "预算友好但较慢",
      },
      {
        channelName: "DHL/FedEx 快递",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 0.5,
        firstWeightPrice: 130,
        continueWeightKg: 0.5,
        continueWeightPrice: 90,
        estDaysMin: 3,
        estDaysMax: 7,
        restrictions: "高价值/急件首选",
      },
      {
        channelName: "海运",
        serviceType: "SEA",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 15,
        firstWeightPrice: 280,
        continueWeightKg: 1,
        continueWeightPrice: 28,
        estDaysMin: 45,
        estDaysMax: 60,
        restrictions: "15kg 以上大货最划算；体积重(÷6000)与实重取大值",
      },
    ],
  },
  {
    name: "Superbuy",
    slug: "superbuy",
    website: "https://www.superbuy.com/",
    intro:
      "老牌中国代购集运平台，支持全球 82 个国家地区，提供多条物流线路，深圳/香港仓库，90 天免费仓储，提供去包装/加固/保险等增值服务。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳", "香港"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA"],
    quotes: [
      {
        channelName: "DHL 快递(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 130,
        continueWeightKg: 1,
        continueWeightPrice: 130,
        estDaysMin: 3,
        estDaysMax: 7,
        restrictions: "约 $18/kg；3-7 天；服务费为商品价值的 5%",
      },
      {
        channelName: "DHL Paket 德国专线",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 5,
        firstWeightPrice: 336,
        continueWeightKg: 1,
        continueWeightPrice: 67,
        estDaysMin: 7,
        estDaysMax: 14,
        restrictions: "5kg 约 €42(按 1€≈8¥ 换算≈¥336)；三角形运输(包税专线)清关稳定",
      },
      {
        channelName: "EU IOSS 专线",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 94,
        continueWeightKg: 1,
        continueWeightPrice: 94,
        estDaysMin: 7,
        estDaysMax: 13,
        restrictions: "IOSS 合规包税；适合欧盟买家",
      },
      {
        channelName: "EMS",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 86,
        continueWeightKg: 1,
        continueWeightPrice: 86,
        estDaysMin: 7,
        estDaysMax: 14,
        restrictions: "清关风险低；性价比之选",
      },
    ],
  },
  {
    name: "CSSBuy",
    slug: "cssbuy",
    website: "https://www.cssbuy.com/",
    intro:
      "运营多年的中国代购集运老牌平台，提供多条欧洲包税专线(DHL/DPD/EMS/铁路/海运)，服务费较低，免费仓储仅 30 天。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA", "RAIL"],
    quotes: [
      {
        channelName: "DPD 包税专线(3-20kg)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 4,
        firstWeightPrice: 493,
        continueWeightKg: 1,
        continueWeightPrice: 123,
        estDaysMin: 10,
        estDaysMax: 15,
        restrictions: "3-20kg 区间；包税(三角形运输)；可走品牌/复刻",
      },
      {
        channelName: "DHL 包税专线(0-18kg)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 4,
        firstWeightPrice: 577,
        continueWeightKg: 1,
        continueWeightPrice: 144,
        estDaysMin: 13,
        estDaysMax: 25,
        restrictions: "0-18kg；包税专线；可走手表/粉末/保健品/食品/化妆品/香水(≤150ml)",
      },
      {
        channelName: "EMS(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 4,
        firstWeightPrice: 548,
        continueWeightKg: 1,
        continueWeightPrice: 137,
        estDaysMin: 7,
        estDaysMax: 15,
        restrictions: "0-30kg；不接受品牌商品",
      },
      {
        channelName: "中欧铁路专线(15-1000kg)",
        serviceType: "RAIL",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 15,
        firstWeightPrice: 866,
        continueWeightKg: 1,
        continueWeightPrice: 58,
        estDaysMin: 30,
        estDaysMax: 40,
        restrictions: "15kg 起收；包税；不接受品牌；性价比铁路渠道",
      },
      {
        channelName: "中国邮政海运(0-30kg)",
        serviceType: "SEA",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 4,
        firstWeightPrice: 330,
        continueWeightKg: 1,
        continueWeightPrice: 83,
        estDaysMin: 60,
        estDaysMax: 180,
        restrictions: "0-30kg；最慢但最便宜",
      },
    ],
  },
  {
    name: "Pandabuy",
    slug: "pandabuy",
    website: "https://www.pandabuy.com/",
    intro:
      "面向海外买家的中国代购集运平台，提供代购/质检/合箱/全球寄送全流程服务，90 天免费仓储，多线路可选。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA"],
    quotes: [
      {
        channelName: "经济空运(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 32,
        continueWeightKg: 1,
        continueWeightPrice: 32,
        estDaysMin: 15,
        estDaysMax: 30,
        restrictions: "最便宜空运；3kg 约 ¥96；时效较长",
      },
      {
        channelName: "标准空运(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 50,
        continueWeightKg: 1,
        continueWeightPrice: 50,
        estDaysMin: 10,
        estDaysMax: 20,
        restrictions: "速度与价格平衡",
      },
      {
        channelName: "DHL 快递(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 120,
        continueWeightKg: 1,
        continueWeightPrice: 120,
        estDaysMin: 5,
        estDaysMax: 10,
        restrictions: "3kg 约 ¥360；最快但最贵",
      },
      {
        channelName: "海运(德国)",
        serviceType: "SEA",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 80,
        continueWeightKg: 1,
        continueWeightPrice: 80,
        estDaysMin: 45,
        estDaysMax: 60,
        restrictions: "约 $10-14/kg(按 1$≈7.2¥ 换算≈¥72-100)；大货最划算",
      },
    ],
  },
  {
    name: "Fishgoo",
    slug: "fishgoo",
    website: "https://www.fishgoo.com/",
    intro:
      "0% 服务费的中国代购集运平台，支持淘宝/天猫/1688/微店采购，2000+ 条物流线路，5 张免费 QC 照片，100 天免费仓储，支持 PayPal 无附加费。",
    foundedYear: null,
    phone: null,
    wechat: null,
    email: null,
    origins: ["深圳"],
    destinations: ["全德", "全欧"],
    serviceTypes: ["AIR", "SEA"],
    quotes: [
      {
        channelName: "包税经济空运(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 3,
        firstWeightPrice: 192,
        continueWeightKg: 1,
        continueWeightPrice: 64,
        estDaysMin: 15,
        estDaysMax: 28,
        restrictions: "3kg 约 €24(按 1€≈8¥ 换算≈¥192)；包税(IOSS)专线；预付 VAT，到门无额外费用",
      },
      {
        channelName: "包税快线空运(德国)",
        serviceType: "AIR",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 80,
        continueWeightKg: 1,
        continueWeightPrice: 80,
        estDaysMin: 8,
        estDaysMax: 15,
        restrictions: "包税快线，8-15 天到货；具体费率需用官网运费计算器查询",
      },
      {
        channelName: "海运(德国)",
        serviceType: "SEA",
        origin: "深圳",
        destination: "全德",
        firstWeightKg: 1,
        firstWeightPrice: 40,
        continueWeightKg: 1,
        continueWeightPrice: 40,
        estDaysMin: 30,
        estDaysMax: 60,
        restrictions: "约 $5-8/kg；大货最便宜；30-60 天；具体费率需用官网运费计算器查询",
      },
    ],
  },
  {
    name: "中德转运（开元）",
    slug: "kaiyuan-zhongde",
    website: "http://zd.kaiyuan.eu/",
    intro:
      "德国开元旗下的中德专线转运平台，提供中国到德国的专线渠道，以及海淘代收代发服务，24 小时闪电出库，实时包裹状态邮件提醒。",
    foundedYear: null,
    phone: null,
    wechat: "kaiyuan_outao",
    email: null,
    origins: ["深圳"],
    destinations: ["全德"],
    serviceTypes: ["AIR"],
    quotes: [],
  },
];

async function main() {
  console.log("🚀 开始录入真实中德集运公司数据…\n");

  // 1. 删除原占位公司（级联删除其报价/评价）
  console.log("🧹 删除原占位公司（goeast/yuntu/haipai）…");
  const deletedOld = await prisma.company.deleteMany({
    where: {
      slug: {
        in: [
          "xiangdong-wuliu-goest",
          "yuntu-wuliu-yuntu",
          "haipai-sudi-haipai",
        ],
      },
    },
  });
  console.log(`   已删除 ${deletedOld.count} 家占位公司\n`);

  // 2. 清空所有现有公司报价（防止数据残留）
  console.log("🧹 清空所有现有公司报价…");
  const deletedQuotes = await prisma.companyQuote.deleteMany({});
  console.log(`   已删除 ${deletedQuotes.count} 条旧报价\n`);

  // 3. 插入 8 家真实公司
  let totalCompanies = 0;
  let totalQuotes = 0;

  for (const c of companies) {
    const created = await prisma.company.create({
      data: {
        name: c.name,
        slug: c.slug,
        website: c.website,
        intro: c.intro,
        foundedYear: c.foundedYear,
        phone: c.phone,
        wechat: c.wechat,
        email: c.email,
        origins: JSON.stringify(c.origins),
        destinations: JSON.stringify(c.destinations),
        serviceTypes: JSON.stringify(c.serviceTypes),
        verified: false,
        ratingAvg: 0,
        reviewCount: 0,
      },
    });

    for (const q of c.quotes) {
      await prisma.companyQuote.create({
        data: {
          companyId: created.id,
          channelName: q.channelName,
          serviceType: q.serviceType,
          origin: q.origin,
          destination: q.destination,
          firstWeightKg: q.firstWeightKg,
          firstWeightPrice: q.firstWeightPrice,
          continueWeightKg: q.continueWeightKg,
          continueWeightPrice: q.continueWeightPrice,
          estDaysMin: q.estDaysMin,
          estDaysMax: q.estDaysMax,
          restrictions: q.restrictions,
          active: true,
        },
      });
      totalQuotes++;
    }

    totalCompanies++;
    console.log(
      `✅ ${c.name} - ${c.quotes.length} 条报价（官网：${c.website}）`,
    );
  }

  console.log(`\n🎉 录入完成！`);
  console.log(`   公司：${totalCompanies} 家`);
  console.log(`   报价：${totalQuotes} 条`);
  console.log(`\n📌 数据来源说明：`);
  console.log(`   - 雁巢集运：官方营销博客 geesenest.com（高可信）`);
  console.log(`   - 象样集运：官网攻略页（区间价，中等可信）`);
  console.log(`   - CNFans/Superbuy/CSSBuy/Pandabuy：第三方费率指南（中等可信）`);
  console.log(`   - Fishgoo：官方博客案例（低可信，需用户核验）`);
  console.log(`   - 中德转运(开元)：官网无报价，仅录入基本信息`);
}

main()
  .catch((e) => {
    console.error("❌ 录入失败：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
