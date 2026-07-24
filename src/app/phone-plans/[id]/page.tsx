import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ReviewList } from "@/components/reviews/review-list";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import {
  Smartphone,
  Wifi,
  Globe,
  ExternalLink,
  PenLine,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Signal,
  CalendarDays,
  Database,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { id } = await params;
  const plan = await prisma.phonePlan.findUnique({
    where: { id },
    select: { carrier: true, planName: true },
  });
  if (!plan) return { title: "套餐不存在" };
  return {
    title: `${plan.carrier} ${plan.planName} - 套餐详情与用户评价`,
    description: `${plan.carrier} ${plan.planName} 德国电话套餐详情、资费、合约期与真实用户评价。`,
  };
}

const typeLabels: Record<string, string> = {
  MOBILE: "手机合同",
  PREPAID: "预付费",
  BROADBAND: "宽带",
  BUNDLE: "融合套餐",
};

export default async function PhonePlanDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const plan = await prisma.phonePlan.findUnique({
    where: { id },
    include: {
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
    },
  });

  if (!plan) notFound();

  const hasPromo =
    plan.promoPrice !== null &&
    plan.promoMonths !== null &&
    plan.promoMonths > 0;
  const sampleInsufficient = plan.reviewCount < 5;
  // 月均资费（考虑促销期）：粗略估算 12 个月平均
  let monthlyAvg = plan.monthlyFee;
  if (hasPromo && plan.promoMonths && plan.promoPrice !== null) {
    const restore = plan.restorePrice ?? plan.monthlyFee;
    monthlyAvg =
      (plan.promoPrice * plan.promoMonths +
        restore * Math.max(0, 12 - plan.promoMonths)) /
      12;
  }

  // JSON-LD 结构化数据：Product + Offer + AggregateRating
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${plan.carrier} ${plan.planName}`,
    description: `${plan.carrier} ${plan.planName}，${typeLabels[plan.type] ?? "电话套餐"}，${plan.isUnlimited ? "无限流量" : `${plan.dataGb ?? 0}GB`}，${plan.network} 网络。`,
    brand: { "@type": "Brand", name: plan.carrier },
    offers: {
      "@type": "Offer",
      price: monthlyAvg.toFixed(2),
      priceCurrency: "EUR",
      url: plan.officialUrl ?? undefined,
    },
  };
  if (plan.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: plan.ratingAvg,
      reviewCount: plan.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 面包屑 */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/phone-plans" className="hover:text-red-600">
          电话套餐
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">
          {plan.carrier} {plan.planName}
        </span>
      </nav>

      {/* 头部 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {plan.type === "BROADBAND" ? (
              <Wifi size={28} />
            ) : (
              <Smartphone size={28} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {plan.carrier} {plan.planName}
              </h1>
              <Badge variant="outline">{typeLabels[plan.type] ?? plan.type}</Badge>
              {hasPromo && (
                <Badge variant="red" className="gap-1">
                  <Flame size={10} />
                  促销中
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <StarRating value={plan.ratingAvg} showValue size={18} />
                <span className="text-sm text-gray-500">
                  ({plan.reviewCount} 条评价)
                </span>
                {sampleInsufficient && plan.reviewCount > 0 && (
                  <span className="text-xs text-amber-600">样本不足</span>
                )}
              </div>
            </div>

            {/* 规格条 */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SpecItem
                icon={<Database size={14} />}
                label="流量"
                value={
                  plan.isUnlimited
                    ? "无限流量"
                    : plan.dataGb !== null
                      ? `${plan.dataGb} GB`
                      : "—"
                }
              />
              <SpecItem
                icon={<Signal size={14} />}
                label="网络"
                value={plan.network}
              />
              <SpecItem
                icon={<CalendarDays size={14} />}
                label="合约期"
                value={plan.contractMonths ? `${plan.contractMonths} 个月` : "无合约"}
              />
              <SpecItem
                icon={<Smartphone size={14} />}
                label="类型"
                value={typeLabels[plan.type] ?? plan.type}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {session?.user ? (
              <Button asChild>
                <Link href={`/reviews/new?entityType=PHONE_PLAN&entityId=${plan.id}`}>
                  <PenLine size={16} />
                  写评价
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">登录后写评价</Link>
              </Button>
            )}
            {plan.officialUrl && (
              <Button asChild variant="outline">
                <a
                  href={plan.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  <Globe size={16} />
                  官网办理
                  <ExternalLink size={12} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* 价格区 */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-gray-400">月费</div>
            {hasPromo ? (
              <>
                <div className="text-xs text-gray-400 line-through">
                  {formatEuro(plan.monthlyFee)}/月
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatEuro(plan.promoPrice!)}
                  <span className="text-sm font-normal text-gray-500">/月</span>
                </div>
                <div className="text-xs text-amber-600">
                  前 {plan.promoMonths} 个月，之后{" "}
                  {formatEuro(plan.restorePrice ?? plan.monthlyFee)}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {formatEuro(plan.monthlyFee)}
                <span className="text-sm font-normal text-gray-500">/月</span>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400">12 个月平均</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatEuro(Math.round(monthlyAvg * 100) / 100)}
              <span className="text-sm font-normal text-gray-500">/月</span>
            </div>
            <div className="text-xs text-gray-500">含促销期摊销</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">首年总花费</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatEuro(Math.round(monthlyAvg * 12))}
            </div>
            <div className="text-xs text-gray-500">未含一次性费用</div>
          </div>
        </div>
      </div>

      {/* 用户评价 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            用户评价 ({plan.reviewCount})
          </h2>
          {session?.user && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/reviews/new?entityType=PHONE_PLAN&entityId=${plan.id}`}>
                <PenLine size={14} />
                写评价
              </Link>
            </Button>
          )}
        </div>
        <ReviewList reviews={plan.reviews} />
      </section>

      {/* 提示 */}
      <div className="mt-8 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-xs text-amber-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>
          套餐信息（价格、流量、合约期等）仅供参考，最终以运营商官网为准。本平台不承担任何签约纠纷责任。
        </p>
      </div>

      {/* 推荐提示 */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-xs text-blue-700">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        <p>
          评价前请确保已实际使用过该套餐。虚假或刷分评价将被扣除信用分，严重者封禁账号。
        </p>
      </div>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
