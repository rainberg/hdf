import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { QuoteTable } from "@/components/companies/quote-table";
import { ReviewList } from "@/components/reviews/review-list";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { safeParseJson } from "@/lib/utils";
import {
  CheckCircle2,
  Globe,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  PenLine,
  AlertTriangle,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: { name: true, intro: true },
  });
  if (!company) return { title: "公司不存在" };
  return {
    title: `${company.name} - 报价、评价与详情`,
    description:
      company.intro?.slice(0, 160) ??
      `${company.name} 的中德转运报价、用户评价与详情信息。`,
  };
}

const serviceTypeLabels: Record<string, string> = {
  AIR: "空运",
  SEA: "海运",
  RAIL: "铁运",
  SPECIAL: "专线",
};

export default async function CompanyDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      quotes: {
        where: { active: true },
        orderBy: [{ serviceType: "asc" }, { firstWeightPrice: "asc" }],
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: {
          user: {
            select: { nickname: true, avatar: true, creditScore: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      aggregatedReviews: {
        orderBy: { likes: "desc" },
        take: 10,
      },
    },
  });

  if (!company) notFound();

  const origins = safeParseJson<string[]>(company.origins, []);
  const destinations = safeParseJson<string[]>(company.destinations, []);
  const serviceTypes = safeParseJson<string[]>(company.serviceTypes, []);

  const sampleInsufficient = company.reviewCount < 5;

  // JSON-LD 结构化数据：帮助搜索引擎理解公司信息与评分
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.intro ?? undefined,
    url: company.website ?? undefined,
    email: company.email ?? undefined,
    telephone: company.phone ?? undefined,
    foundingDate: company.foundedYear?.toString(),
    aggregateRating:
      company.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: company.ratingAvg,
            reviewCount: company.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 面包屑 */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/companies" className="hover:text-brand-600">
          转运公司
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{company.name}</span>
      </nav>

      {/* 头部 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-3xl font-bold text-brand-600">
            {company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo}
                alt={company.name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              company.name.slice(0, 1)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h1>
              {company.verified && (
                <Badge variant="blue" className="gap-1">
                  <CheckCircle2 size={12} />
                  官方认证
                </Badge>
              )}
              {company.foundedYear && (
                <Badge variant="outline">
                  成立于 {company.foundedYear}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <StarRating value={company.ratingAvg} showValue size={18} />
                <span className="text-sm text-gray-500">
                  ({company.reviewCount} 条评价)
                </span>
                {sampleInsufficient && company.reviewCount > 0 && (
                  <span className="text-xs text-gold-600">样本不足</span>
                )}
              </div>
            </div>
            {company.intro && (
              <p className="mt-3 text-sm text-gray-600">{company.intro}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {serviceTypes.map((t) => (
                <Badge key={t} variant="brand">
                  {serviceTypeLabels[t] ?? t}
                </Badge>
              ))}
              {origins.map((o) => (
                <Badge key={`o-${o}`} variant="outline">
                  {o}
                </Badge>
              ))}
              <span className="text-gray-400">→</span>
              {destinations.map((d) => (
                <Badge key={`d-${d}`} variant="outline">
                  {d}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {session?.user ? (
              <Button asChild>
                <Link href={`/reviews/new?entityType=COMPANY&entityId=${company.id}`}>
                  <PenLine size={16} />
                  写评价
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">登录后写评价</Link>
              </Button>
            )}
            {company.website && (
              <Button asChild variant="outline">
                <a href={company.website} target="_blank" rel="noopener noreferrer nofollow">
                  <Globe size={16} />
                  访问官网
                  <ExternalLink size={12} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* 联系方式 */}
        {(company.phone || company.wechat || company.email) && (
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
            {company.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                {company.phone}
              </div>
            )}
            {company.wechat && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageCircle size={16} className="text-gray-400" />
                微信：{company.wechat}
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                {company.email}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 报价 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">报价表</h2>
          <span className="text-xs text-gray-400">
            * 价格仅供参考，以商家最新报价为准
          </span>
        </div>
        <QuoteTable quotes={company.quotes} />
      </section>

      {/* 用户评价 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            用户评价 ({company.reviewCount})
          </h2>
          {session?.user && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/reviews/new?entityType=COMPANY&entityId=${company.id}`}>
                <PenLine size={14} />
                写评价
              </Link>
            </Button>
          )}
        </div>
        <ReviewList reviews={company.reviews} />
      </section>

      {/* 网络聚合评价 */}
      {company.aggregatedReviews.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              网络评价聚合
            </h2>
            <span className="text-xs text-gray-400">
              来源：知乎 / 小红书 / 贴吧等
            </span>
          </div>
          <div className="space-y-3">
            {company.aggregatedReviews.map((ar) => (
              <a
                key={ar.id}
                href={ar.originalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="blue">{ar.source}</Badge>
                  <span className="text-xs text-gray-400">
                    {ar.publishedAt
                      ? new Date(ar.publishedAt).toLocaleDateString("zh-CN")
                      : "日期未知"}
                  </span>
                </div>
                <h3 className="mt-2 font-medium text-gray-900">{ar.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {ar.summary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <ExternalLink size={12} />
                  查看原文
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 免责声明 */}
      <div className="mt-8 flex items-start gap-2 rounded-lg bg-gold-50 p-4 text-xs text-gold-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>
          本页信息（报价、评价等）由用户与商家共同维护，仅供参考。下单前请与商家核实最新价格与条款，本平台不承担任何交易纠纷责任。
        </p>
      </div>
    </div>
  );
}
