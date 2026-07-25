import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// 精致字体组合：Fraunces 现代衬线（标题/数字）+ Manrope 几何无衬线（UI/正文）
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "华德福 - 在德华人生活指南",
    template: "%s | 华德福",
  },
  description:
    "面向在德华人的本地化生活信息聚合与点评平台：中德转运公司报价与评价、邀请码/打折码分享、电话合同套餐比价。",
  keywords: [
    "在德华人",
    "中德转运",
    "德国转运",
    "中欧班列",
    "德国电话卡",
    "德国宽带",
    "德国手机套餐",
    "优惠码",
    "打折码",
    "邀请码",
    "华人点评",
    "Telekom",
    "Vodafone",
    "O2",
  ],
  authors: [{ name: "华德福 HuaDeFu" }],
  applicationName: "华德福",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "华德福 - 在德华人生活指南",
    description: "中德转运点评、优惠码分享、电话套餐比价",
    type: "website",
    locale: "zh_CN",
    siteName: "华德福",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "华德福 - 在德华人生活指南",
    description: "中德转运点评、优惠码分享、电话套餐比价",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "生活服务",
};

export const viewport: Viewport = {
  themeColor: "#1b3a5b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
