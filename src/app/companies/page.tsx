import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CompanyCard } from "@/components/companies/company-card";
import { CompanyFilters } from "@/components/companies/company-filters";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "中德转运公司点评 - 报价对比与真实评价",
  description:
    "收录所有中德转运公司的报价、时效与真实用户评价，支持按空运/海运/铁运筛选与横向对比，帮您避坑选对转运。",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface SearchParams {
  page?: string;
  serviceType?: string;
  origin?: string;
  destination?: string;
  verified?: string;
  minRating?: string;
  sort?: string;
  q?: string;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const sort = sp.sort ?? "rating";

  const where: Record<string, unknown> = {};
  if (sp.serviceType) where.serviceTypes = { contains: sp.serviceType };
  if (sp.origin) where.origins = { contains: sp.origin };
  if (sp.destination) where.destinations = { contains: sp.destination };
  if (sp.verified === "true") where.verified = true;
  if (sp.minRating) where.ratingAvg = { gte: Number(sp.minRating) };
  if (sp.q) {
    where.OR = [{ name: { contains: sp.q } }, { intro: { contains: sp.q } }];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "reviews"
      ? { reviewCount: "desc" }
      : sort === "newest"
        ? { createdAt: "desc" }
        : { ratingAvg: "desc" };

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        quotes: {
          where: { active: true },
          take: 1,
          orderBy: { firstWeightPrice: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">中德转运公司</h1>
        <p className="mt-1 text-sm text-gray-500">
          收录 {total} 家中德转运公司的报价与真实评价，帮您避坑选对转运。
        </p>
      </div>

      {/* 搜索栏 */}
      <form className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="搜索公司名或关键词…"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button type="submit">搜索</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CompanyFilters />
        </aside>

        <div>
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <Package className="mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">暂无符合条件的转运公司</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/companies">清除筛选</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {companies.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                const params = new URLSearchParams(sp as Record<string, string>);
                params.set("page", String(n));
                return (
                  <Link
                    key={n}
                    href={`/companies?${params.toString()}`}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm ${
                      n === page
                        ? "bg-brand-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
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
