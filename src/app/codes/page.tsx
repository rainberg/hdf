import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CodeCard } from "@/components/codes/code-card";
import { Button } from "@/components/ui/button";
import { Plus, Ticket } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "优惠码 - 邀请码/打折码分享",
  description:
    "在德华人分享的电商、流媒体、工具、转运等平台的邀请码、打折码与返利链接。",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const categories = [
  { value: "", label: "全部" },
  { value: "ecommerce", label: "电商" },
  { value: "streaming", label: "流媒体" },
  { value: "tool", label: "工具软件" },
  { value: "transport", label: "转运" },
  { value: "telecom", label: "通信" },
  { value: "other", label: "其他" },
];

interface SearchParams {
  page?: string;
  category?: string;
  sort?: string;
  q?: string;
}

export default async function CodesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const page = Math.max(1, Number(sp.page ?? "1"));
  const sort = sp.sort ?? "newest";

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    AND: [
      {
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    ],
  };
  if (sp.category) where.platformCategory = sp.category;
  if (sp.q) {
    where.OR = [
      { platform: { contains: sp.q } },
      { benefitDescription: { contains: sp.q } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "hot" ? { upvotes: "desc" } : { createdAt: "desc" };

  const [total, codes] = await Promise.all([
    prisma.code.count({ where }),
    prisma.code.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { nickname: true, creditScore: true } } },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">优惠码</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} 个有效码 · 由社区共同维护
          </p>
        </div>
        {session?.user && (
          <Button asChild>
            <Link href="/codes/new">
              <Plus size={16} />
              发布优惠码
            </Link>
          </Button>
        )}
      </div>

      {/* 分类 + 搜索 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const params = new URLSearchParams();
            if (c.value) params.set("category", c.value);
            if (sort !== "newest") params.set("sort", sort);
            return (
              <Link
                key={c.value || "all"}
                href={`/codes?${params.toString()}`}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  (sp.category ?? "") === c.value
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="搜索平台或优惠…"
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-56"
          />
          <Button type="submit" size="sm">搜索</Button>
        </form>
      </div>

      {/* 排序 */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">排序：</span>
        <Link
          href={`/codes?${new URLSearchParams({ ...sp, sort: "newest" } as Record<string, string>).toString()}`}
          className={`rounded-md px-2 py-1 ${sort === "newest" ? "text-brand-600 font-medium" : "text-gray-600 hover:text-brand-600"}`}
        >
          最新
        </Link>
        <Link
          href={`/codes?${new URLSearchParams({ ...sp, sort: "hot" } as Record<string, string>).toString()}`}
          className={`rounded-md px-2 py-1 ${sort === "hot" ? "text-brand-600 font-medium" : "text-gray-600 hover:text-brand-600"}`}
        >
          最热
        </Link>
      </div>

      {/* 列表 */}
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <Ticket className="mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">暂无优惠码</p>
          {session?.user && (
            <Button asChild variant="link" className="mt-2">
              <Link href="/codes/new">第一个发布</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {codes.map((c) => (
            <CodeCard key={c.id} code={c} />
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
                href={`/codes?${params.toString()}`}
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
  );
}
