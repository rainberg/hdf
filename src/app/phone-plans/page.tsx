import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEuro, cn } from "@/lib/utils";
import { Smartphone, Wifi, Search, Flame } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "德国电话套餐 - 手机合同/宽带/预付费比价",
  description:
    "Telekom / Vodafone / O2 / 1&1 / congstar 等德国运营商手机合同、预付费、宽带套餐价格与用户评价。",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const carriers = [
  { value: "", label: "全部运营商" },
  { value: "Telekom", label: "Telekom" },
  { value: "Vodafone", label: "Vodafone" },
  { value: "O2", label: "O2" },
  { value: "1&1", label: "1&1" },
  { value: "congstar", label: "congstar" },
];

const types = [
  { value: "", label: "全部" },
  { value: "MOBILE", label: "手机合同" },
  { value: "PREPAID", label: "预付费" },
  { value: "BROADBAND", label: "宽带" },
  { value: "BUNDLE", label: "融合套餐" },
];

const typeLabels: Record<string, string> = {
  MOBILE: "手机合同",
  PREPAID: "预付费",
  BROADBAND: "宽带",
  BUNDLE: "融合套餐",
};

interface SearchParams {
  page?: string;
  carrier?: string;
  type?: string;
  maxFee?: string;
  contractMonths?: string;
  sort?: string;
  q?: string;
}

export default async function PhonePlansPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const sort = sp.sort ?? "fee-asc";

  const where: Record<string, unknown> = {};
  if (sp.carrier) where.carrier = sp.carrier;
  if (sp.type) where.type = sp.type;
  if (sp.maxFee) where.monthlyFee = { lte: Number(sp.maxFee) };
  if (sp.contractMonths === "0")
    where.OR = [{ contractMonths: null }, { contractMonths: 0 }];
  else if (sp.contractMonths)
    where.contractMonths = { gte: Number(sp.contractMonths) };
  if (sp.q) {
    where.OR = [
      { carrier: { contains: sp.q } },
      { planName: { contains: sp.q } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "fee-desc"
      ? { monthlyFee: "desc" }
      : sort === "rating"
        ? { ratingAvg: "desc" }
        : { monthlyFee: "asc" };

  const [total, plans] = await Promise.all([
    prisma.phonePlan.count({ where }),
    prisma.phonePlan.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">德国电话套餐</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} 个套餐 · 价格仅供参考，最终以运营商官网为准
        </p>
      </div>

      {/* 搜索 */}
      <form className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="搜索运营商或套餐名…"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <Button type="submit">搜索</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* 筛选 */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <FilterSection title="运营商">
            {carriers.map((c) => (
              <FilterLink
                key={c.value || "all"}
                href={buildUrl(sp, { carrier: c.value })}
                active={(sp.carrier ?? "") === c.value}
              >
                {c.label}
              </FilterLink>
            ))}
          </FilterSection>

          <FilterSection title="类型">
            {types.map((t) => (
              <FilterLink
                key={t.value || "all"}
                href={buildUrl(sp, { type: t.value })}
                active={(sp.type ?? "") === t.value}
              >
                {t.label}
              </FilterLink>
            ))}
          </FilterSection>

          <FilterSection title="月费上限">
            {[
              { v: "10", l: "≤ €10" },
              { v: "20", l: "≤ €20" },
              { v: "30", l: "≤ €30" },
              { v: "50", l: "≤ €50" },
              { v: "", l: "不限" },
            ].map((m) => (
              <FilterLink
                key={m.v || "all"}
                href={buildUrl(sp, { maxFee: m.v })}
                active={(sp.maxFee ?? "") === m.v}
              >
                {m.l}
              </FilterLink>
            ))}
          </FilterSection>

          <FilterSection title="合约期">
            {[
              { v: "0", l: "无合约" },
              { v: "1", l: "≥ 1 个月" },
              { v: "24", l: "≥ 24 个月" },
              { v: "", l: "不限" },
            ].map((m) => (
              <FilterLink
                key={m.v || "all"}
                href={buildUrl(sp, { contractMonths: m.v })}
                active={(sp.contractMonths ?? "") === m.v}
              >
                {m.l}
              </FilterLink>
            ))}
          </FilterSection>
        </aside>

        {/* 列表 */}
        <div>
          {/* 排序 */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500">排序：</span>
            <Link
              href={buildUrl(sp, { sort: "fee-asc" })}
              className={cn(
                "rounded-md px-2 py-1",
                sort === "fee-asc"
                  ? "text-red-600 font-medium"
                  : "text-gray-600 hover:text-red-600",
              )}
            >
              价格低到高
            </Link>
            <Link
              href={buildUrl(sp, { sort: "fee-desc" })}
              className={cn(
                "rounded-md px-2 py-1",
                sort === "fee-desc"
                  ? "text-red-600 font-medium"
                  : "text-gray-600 hover:text-red-600",
              )}
            >
              价格高到低
            </Link>
            <Link
              href={buildUrl(sp, { sort: "rating" })}
              className={cn(
                "rounded-md px-2 py-1",
                sort === "rating"
                  ? "text-red-600 font-medium"
                  : "text-gray-600 hover:text-red-600",
              )}
            >
              评分最高
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <Smartphone className="mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">暂无符合条件的套餐</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/phone-plans">清除筛选</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <Link
                    key={n}
                    href={buildUrl(sp, { page: String(n) })}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm",
                      n === page
                        ? "bg-red-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {n}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 text-xs font-medium text-gray-500">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2 py-1 text-sm",
        active
          ? "bg-red-50 font-medium text-red-600"
          : "text-gray-700 hover:bg-gray-50",
      )}
    >
      {children}
    </Link>
  );
}

function buildUrl(
  sp: SearchParams,
  overrides: Partial<SearchParams>,
): string {
  const params = new URLSearchParams(sp as Record<string, string>);
  Object.entries(overrides).forEach(([k, v]) => {
    if (v) params.set(k, v);
    else params.delete(k);
  });
  if (!overrides.page) params.delete("page");
  return `/phone-plans?${params.toString()}`;
}

function PlanCard({
  plan,
}: {
  plan: {
    id: string;
    carrier: string;
    planName: string;
    type: string;
    monthlyFee: number;
    dataGb: number | null;
    isUnlimited: boolean;
    network: string;
    contractMonths: number | null;
    promoPrice: number | null;
    promoMonths: number | null;
    restorePrice: number | null;
    officialUrl: string | null;
    ratingAvg: number;
    reviewCount: number;
  };
}) {
  const hasPromo = plan.promoPrice !== null && plan.promoMonths !== null;
  return (
    <Link
      href={`/phone-plans/${plan.id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {plan.type === "BROADBAND" ? <Wifi size={20} /> : <Smartphone size={20} />}
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-red-600">
              {plan.carrier}
            </div>
            <div className="text-xs text-gray-500">{plan.planName}</div>
          </div>
        </div>
        <Badge variant="outline">{typeLabels[plan.type] ?? plan.type}</Badge>
      </div>

      {/* 价格 */}
      <div className="mt-4 flex items-end justify-between">
        <div>
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
                前 {plan.promoMonths} 个月，之后 {formatEuro(plan.restorePrice ?? plan.monthlyFee)}
              </div>
            </>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              {formatEuro(plan.monthlyFee)}
              <span className="text-sm font-normal text-gray-500">/月</span>
            </div>
          )}
        </div>
        {hasPromo && (
          <Badge variant="red" className="gap-1">
            <Flame size={10} />
            促销
          </Badge>
        )}
      </div>

      {/* 规格 */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded-md bg-gray-50 px-2 py-1">
          {plan.isUnlimited ? "无限流量" : `${plan.dataGb ?? 0} GB`}
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-1">{plan.network}</span>
        <span className="rounded-md bg-gray-50 px-2 py-1">
          {plan.contractMonths ? `${plan.contractMonths} 个月合约` : "无合约"}
        </span>
      </div>

      {/* 评分 */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <StarRating value={plan.ratingAvg} showValue size={14} />
        <span className="text-xs text-gray-400">
          {plan.reviewCount} 条评价
        </span>
      </div>
    </Link>
  );
}
