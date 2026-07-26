import type { MetadataRoute } from "next";

// PWA manifest，允许用户"添加到主屏幕"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "华德福 - 在德华人生活指南",
    short_name: "华德福",
    description:
      "中德转运点评、优惠码分享、电话套餐比价，面向在德华人的生活信息聚合平台。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9a1f1f",
    lang: "zh-CN",
    categories: ["lifestyle", "shopping", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
