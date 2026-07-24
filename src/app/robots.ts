import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // 允许全部公开内容抓取
        userAgent: "*",
        allow: ["/", "/companies", "/phone-plans", "/codes", "/search"],
        // 私人/后台路径禁止抓取
        disallow: [
          "/admin",
          "/merchant",
          "/me",
          "/login",
          "/register",
          "/api",
          "/reviews/new",
          "/codes/new",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
