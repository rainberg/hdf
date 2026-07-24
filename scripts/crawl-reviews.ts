/**
 * 网络评价聚合爬虫占位脚本
 * 运行：npm run crawl:reviews
 *
 * 设计目标：
 *   定期抓取知乎 / 小红书 / 贴吧 / 微博等公开页面中
 *   提及"中德转运"、"中欧班列"、"国际物流"等的帖子，
 *   经去重（simhash）和情感分析后写入 AggregatedReview 表。
 *
 * 注意：
 *   本文件是【占位实现】，仅给出框架与接口契约；
 *   生产部署时需要：
 *     1. 接入合法的数据源 API 或合规的爬虫管道；
 *     2. 实现真正的 HTML/正文解析；
 *     3. 引入情感分析模型（如本地 transformers 或第三方 NLP API）；
 *     4. 实现 simhash 计算与近重复过滤；
 *     5. 配置定时任务（cron / GitHub Actions）。
 *
 * 合规声明：
 *   仅抓取公开可访问内容；遵守各平台 robots.txt 与服务条款；
 *   不抓取需要登录或付费的内容；不存储用户隐私信息。
 */

// 直接复用 src/lib/prisma 的 PrismaPg 实例，避免重复配置适配器
import { prisma } from "../src/lib/prisma";

interface RawReview {
  source: "zhihu" | "xiaohongshu" | "tieba" | "weibo";
  title: string;
  summary: string;
  url: string;
  publishedAt?: Date;
  likes?: number;
  mentionedCompanies: string[]; // 公司名关键词
}

/** 计算简易 simhash（占位实现，生产环境应替换为成熟的 simhash 算法） */
function computeSimhash(text: string): string {
  // 简化：取文本长度 + 前 32 字符的字符码累加，仅用于演示
  let hash = 0;
  const sample = text.slice(0, 200);
  for (let i = 0; i < sample.length; i++) {
    hash = (hash << 5) - hash + sample.charCodeAt(i);
    hash |= 0;
  }
  return `${sample.length}-${hash.toString(16)}`;
}

/** 极简情感分析占位：根据关键词粗判 */
function detectSentiment(text: string): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  const positive = ["推荐", "靠谱", "快", "稳定", "好评", "满意", "便宜", "性价比"];
  const negative = ["差评", "丢失", "破损", "慢", "拖延", "避雷", "踩雷", "投诉"];
  let score = 0;
  for (const k of positive) if (text.includes(k)) score++;
  for (const k of negative) if (text.includes(k)) score--;
  if (score > 0) return "POSITIVE";
  if (score < 0) return "NEGATIVE";
  return "NEUTRAL";
}

/** 数据源抓取占位：实际生产替换为真实抓取逻辑 */
async function fetchFromSource(_source: string): Promise<RawReview[]> {
  // TODO: 接入真实数据源
  // 例如：
  //   - 知乎：使用官方搜索 API（需申请）或合规的 RSS
  //   - 小红书：仅采集公开笔记，遵守平台条款
  //   - 贴吧：通过合规的搜索结果
  //   - 微博：使用开放平台 API
  return [];
}

/** 公司名匹配：从文本中提取提及的公司 */
async function matchCompanies(
  text: string,
): Promise<{ id: string; name: string }[]> {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  return companies.filter((c) => text.includes(c.name));
}

async function main() {
  console.log("🕷️  开始抓取网络评价（占位实现）…");

  const sources = ["zhihu", "xiaohongshu", "tieba", "weibo"] as const;
  let inserted = 0;
  let skippedDup = 0;

  for (const source of sources) {
    const reviews = await fetchFromSource(source);
    console.log(`  [${source}] 抓取到 ${reviews.length} 条`);

    for (const r of reviews) {
      const simhash = computeSimhash(r.title + r.summary);

      // 近重复过滤：同一公司 + 相同 simhash 跳过
      const companies = await matchCompanies(r.title + " " + r.summary);
      if (companies.length === 0) {
        skippedDup++;
        continue;
      }

      for (const company of companies) {
        const exists = await prisma.aggregatedReview.findFirst({
          where: { companyId: company.id, simhash },
          select: { id: true },
        });
        if (exists) {
          skippedDup++;
          continue;
        }

        await prisma.aggregatedReview.create({
          data: {
            companyId: company.id,
            source: r.source,
            title: r.title,
            summary: r.summary,
            originalUrl: r.url,
            publishedAt: r.publishedAt ?? null,
            likes: r.likes ?? 0,
            sentiment: detectSentiment(r.title + r.summary),
            simhash,
          },
        });
        inserted++;
      }
    }
  }

  console.log(`\n✅ 完成：写入 ${inserted} 条，跳过 ${skippedDup} 条（无公司或重复）`);
  console.log("⚠️  当前为占位实现，未实际抓取数据。请参考脚本注释接入真实数据源。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
