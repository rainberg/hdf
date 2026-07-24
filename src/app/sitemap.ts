import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 站点地图：列出全部公开页面与动态详情页
// sitemap.ts 由 Next.js 在构建/请求时生成 /sitemap.xml
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/companies`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/phone-plans`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/codes`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // 动态公司详情
  const companies = await prisma.company
    .findMany({
      where: { verified: true },
      select: { id: true, updatedAt: true },
      take: 1000,
    })
    .catch(() => [] as { id: string; updatedAt: Date }[]);

  const companyEntries: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${siteUrl}/companies/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 动态套餐详情
  const plans = await prisma.phonePlan
    .findMany({
      select: { id: true, updatedAt: true },
      take: 500,
    })
    .catch(() => [] as { id: string; updatedAt: Date }[]);

  const planEntries: MetadataRoute.Sitemap = plans.map((p) => ({
    url: `${siteUrl}/phone-plans/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...companyEntries, ...planEntries];
}
