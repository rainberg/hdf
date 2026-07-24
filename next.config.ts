import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境压缩
  compress: true,
  // 默认开启 React 19 + Next 16 的优化
  reactStrictMode: true,
  // poweredByHeader 关闭以减少信息泄露
  poweredByHeader: false,
  // 图片优化：本地无外部图床时关闭远程图片优化以避免误用
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 实验性：分包优化（仅在内存敏感场景启用）
  experimental: {
    // 优化服务端依赖打包，减少初始启动时间
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 安全头
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // 静态资源长期缓存（Next 自带 _next/static 已处理，这里覆盖 public）
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // sitemap 与 robots 短缓存
        source: "/(sitemap.xml|robots.txt|manifest.webmanifest)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 兼容旧路由（如有需要可在此扩展）
    ];
  },
};

export default nextConfig;
