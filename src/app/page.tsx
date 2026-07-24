import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/utils";
import {
  Search,
  Package,
  Smartphone,
  Ticket,
  ArrowRight,
  Flame,
  TrendingUp,
  ShieldCheck,
  Users,
  Star,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "华点 - 在德华人生活指南 | 转运点评 · 优惠码 · 电话套餐",
  description:
    "面向在德华人的本地化生活信息聚合平台：中德转运公司报价与真实评价、邀请码/打折码分享、德国电话套餐比价。",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 首页聚合：取最高评分公司 / 最新优惠码 / 最便宜套餐
  const [topCompanies, recentCodes, cheapPlans, stats] = await Promise.all([
    prisma.company.findMany({
      where: { reviewCount: { gte: 1 } },
      orderBy: { ratingAvg: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        intro: true,
        ratingAvg: true,
        reviewCount: true,
        verified: true,
        serviceTypes: true,
      },
    }),
    prisma.code.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        platform: true,
        benefitDescription: true,
        type: true,
        codeValue: true,
        upvotes: true,
      },
    }),
    prisma.phonePlan.findMany({
      orderBy: { monthlyFee: "asc" },
      take: 4,
      select: {
        id: true,
        carrier: true,
        planName: true,
        monthlyFee: true,
        promoPrice: true,
        dataGb: true,
        isUnlimited: true,
        contractMonths: true,
      },
    }),
    Promise.all([
      prisma.company.count(),
      prisma.review.count({ where: { status: "PUBLISHED" } }),
      prisma.code.count({ where: { status: "ACTIVE" } }),
      prisma.phonePlan.count(),
    ]).then(([companies, reviews, codes, plans]) => ({
      companies,
      reviews,
      codes,
      plans,
    })),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-red-50 via-white to-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="red" className="mb-4 gap-1">
              <Flame size={12} />
              在德华人专属
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              在德生活，<span className="text-red-600">一点就通</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              转运公司比价与点评 · 优惠码共享 · 电话套餐对比 ·
              帮你避坑省钱，少走弯路。
            </p>

            {/* 全局搜索 */}
            <form
              action="/search"
              className="mx-auto mt-8 flex max-w-xl items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="搜索公司 / 套餐 / 优惠码…"
                  className="h-12 w-full rounded-full border border-gray-300 bg-white pl-11 pr-4 text-base shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full">
                搜索
              </Button>
            </form>

            {/* 快速入口 */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link
                href="/companies"
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-gray-200 hover:text-red-600"
              >
                <Package size={14} />
                转运公司
              </Link>
              <Link
                href="/phone-plans"
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-gray-200 hover:text-red-600"
              >
                <Smartphone size={14} />
                电话套餐
              </Link>
              <Link
                href="/codes"
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-gray-200 hover:text-red-600"
              >
                <Ticket size={14} />
                优惠码
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          <StatCard
            icon={<Package size={20} />}
            label="收录转运公司"
            value={stats.companies}
            color="text-red-600"
          />
          <StatCard
            icon={<Star size={20} />}
            label="真实用户评价"
            value={stats.reviews}
            color="text-amber-500"
          />
          <StatCard
            icon={<Ticket size={20} />}
            label="可用优惠码"
            value={stats.codes}
            color="text-green-600"
          />
          <StatCard
            icon={<Smartphone size={20} />}
            label="电话套餐"
            value={stats.plans}
            color="text-blue-600"
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 高分转运公司 */}
        <section className="mb-12">
          <SectionHeader
            title="高分转运公司"
            icon={<TrendingUp size={20} className="text-red-600" />}
            href="/companies"
          />
          {topCompanies.length === 0 ? (
            <EmptyState message="暂无高分公司，快去添加评价吧" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCompanies.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-red-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600">
                      {c.name}
                    </h3>
                    {c.verified && (
                      <ShieldCheck size={16} className="text-blue-500" />
                    )}
                  </div>
                  {c.intro && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                      {c.intro}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <StarRating value={c.ratingAvg} showValue size={14} />
                    <span className="text-xs text-gray-400">
                      {c.reviewCount} 条评价
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 最便宜电话套餐 */}
        <section className="mb-12">
          <SectionHeader
            title="低价电话套餐"
            icon={<Smartphone size={20} className="text-blue-600" />}
            href="/phone-plans"
          />
          {cheapPlans.length === 0 ? (
            <EmptyState message="暂无套餐数据" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cheapPlans.map((p) => {
                const price = p.promoPrice ?? p.monthlyFee;
                return (
                  <Link
                    key={p.id}
                    href={`/phone-plans/${p.id}`}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="text-xs text-gray-500">{p.carrier}</div>
                    <div className="mt-1 truncate font-medium text-gray-900 group-hover:text-blue-600">
                      {p.planName}
                    </div>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatEuro(price)}
                      </span>
                      <span className="text-xs text-gray-500">/月</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-gray-500">
                      <span className="rounded bg-gray-50 px-1.5 py-0.5">
                        {p.isUnlimited
                          ? "无限流量"
                          : p.dataGb !== null
                            ? `${p.dataGb} GB`
                            : "—"}
                      </span>
                      <span className="rounded bg-gray-50 px-1.5 py-0.5">
                        {p.contractMonths ? `${p.contractMonths}月合约` : "无合约"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 最新优惠码 */}
        <section>
          <SectionHeader
            title="最新优惠码"
            icon={<Ticket size={20} className="text-green-600" />}
            href="/codes"
          />
          {recentCodes.length === 0 ? (
            <EmptyState message="暂无优惠码，第一个来分享吧" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentCodes.map((c) => (
                <Link
                  key={c.id}
                  href="/codes"
                  className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-green-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 group-hover:text-green-600">
                      {c.platform}
                    </span>
                    <Badge variant="outline">
                      {c.type === "INVITE"
                        ? "邀请码"
                        : c.type === "DISCOUNT"
                          ? "打折码"
                          : "返利"}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {c.benefitDescription}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {c.codeValue ? (
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                          {c.codeValue}
                        </code>
                      ) : (
                        "链接可用"
                      )}
                    </span>
                    <span>{c.upvotes} 赞</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 价值主张 */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <ValueProp
              icon={<ShieldCheck size={24} />}
              title="真实可信"
              desc="评价由在德华人实名贡献，结合用户信用分加权展示，严防刷分刷评。"
              color="bg-blue-50 text-blue-600"
            />
            <ValueProp
              icon={<Users size={24} />}
              title="社区共建"
              desc="邀请码、打折码、转运体验… 都来自社区分享，互助共赢。"
              color="bg-green-50 text-green-600"
            />
            <ValueProp
              icon={<TrendingUp size={24} />}
              title="数据透明"
              desc="所有报价、套餐价格公开对比，告别信息差，明明白白消费。"
              color="bg-amber-50 text-amber-600"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        {icon}
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
      >
        查看全部
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function ValueProp({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}
