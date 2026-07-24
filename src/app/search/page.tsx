import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/utils";
import { Search, Package, Smartphone, Ticket, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索 - 转运公司 / 电话套餐 / 优惠码",
  description: "在华德福全站搜索中德转运公司、德国电话套餐与优惠码。",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  // 关键词过短时不查询
  const hasQuery = q.length >= 1;

  const [companies, plans, codes] = hasQuery
    ? await Promise.all([
        prisma.company.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { intro: { contains: q } },
            ],
          },
          take: 10,
          orderBy: { ratingAvg: "desc" },
          select: {
            id: true,
            name: true,
            intro: true,
            ratingAvg: true,
            reviewCount: true,
            verified: true,
          },
        }),
        prisma.phonePlan.findMany({
          where: {
            OR: [
              { carrier: { contains: q } },
              { planName: { contains: q } },
            ],
          },
          take: 10,
          orderBy: { monthlyFee: "asc" },
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
        prisma.code.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { platform: { contains: q } },
              { benefitDescription: { contains: q } },
            ],
          },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            platform: true,
            benefitDescription: true,
            type: true,
            codeValue: true,
            upvotes: true,
          },
        }),
      ])
    : [[], [], []];

  const totalCount =
    (companies as unknown[]).length +
    (plans as unknown[]).length +
    (codes as unknown[]).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 搜索栏 */}
      <form className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="搜索公司 / 套餐 / 优惠码…"
            className="h-12 w-full rounded-md border border-gray-300 bg-white pl-11 pr-3 text-base focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-medium text-white hover:bg-red-700"
        >
          搜索
        </button>
      </form>

      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
      >
        <ArrowLeft size={14} />
        返回首页
      </Link>

      {hasQuery && (
        <div className="mb-6 text-sm text-gray-500">
          共找到 <span className="font-semibold text-gray-900">{totalCount}</span> 条与「
          <span className="font-semibold text-gray-900">{q}</span>」相关的结果
        </div>
      )}

      {!hasQuery && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <Search className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">输入关键词开始搜索</p>
        </div>
      )}

      {/* 公司结果 */}
      {hasQuery && (companies as unknown[]).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Package size={18} className="text-red-600" />
            转运公司
            <Badge variant="outline">{(companies as unknown[]).length}</Badge>
          </h2>
          <div className="space-y-2">
            {(companies as Array<{
              id: string;
              name: string;
              intro: string | null;
              ratingAvg: number;
              reviewCount: number;
              verified: boolean;
            }>).map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-red-200 hover:bg-red-50/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.verified && <Badge variant="blue">已认证</Badge>}
                </div>
                {c.intro && (
                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                    {c.intro}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <StarRating value={c.ratingAvg} showValue size={12} />
                  <span>{c.reviewCount} 条评价</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 套餐结果 */}
      {hasQuery && (plans as unknown[]).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Smartphone size={18} className="text-blue-600" />
            电话套餐
            <Badge variant="outline">{(plans as unknown[]).length}</Badge>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(plans as Array<{
              id: string;
              carrier: string;
              planName: string;
              monthlyFee: number;
              promoPrice: number | null;
              dataGb: number | null;
              isUnlimited: boolean;
              contractMonths: number | null;
            }>).map((p) => (
              <Link
                key={p.id}
                href={`/phone-plans/${p.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {p.carrier} {p.planName}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatEuro(p.promoPrice ?? p.monthlyFee)}
                    <span className="text-xs font-normal text-gray-500">/月</span>
                  </span>
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
            ))}
          </div>
        </section>
      )}

      {/* 优惠码结果 */}
      {hasQuery && (codes as unknown[]).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Ticket size={18} className="text-green-600" />
            优惠码
            <Badge variant="outline">{(codes as unknown[]).length}</Badge>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(codes as Array<{
              id: string;
              platform: string;
              benefitDescription: string;
              type: string;
              codeValue: string | null;
              upvotes: number;
            }>).map((c) => (
              <Link
                key={c.id}
                href="/codes"
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-200 hover:bg-green-50/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{c.platform}</span>
                  <Badge variant="outline">
                    {c.type === "INVITE"
                      ? "邀请码"
                      : c.type === "DISCOUNT"
                        ? "打折码"
                        : "返利"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                  {c.benefitDescription}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
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
        </section>
      )}

      {/* 无结果 */}
      {hasQuery && totalCount === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <Search className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">没有找到相关结果</p>
          <p className="mt-1 text-sm text-gray-400">
            试试其他关键词，或直接浏览{' '}
            <Link href="/companies" className="text-red-600 hover:underline">
              转运公司
            </Link>
            、
            <Link href="/phone-plans" className="text-red-600 hover:underline">
              电话套餐
            </Link>
            、
            <Link href="/codes" className="text-red-600 hover:underline">
              优惠码
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
