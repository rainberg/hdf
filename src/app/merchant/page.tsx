import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { relativeTime, safeParseJson } from "@/lib/utils";
import {
  Store,
  Package,
  Star,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "商家中心" };
export const dynamic = "force-dynamic";

export default async function MerchantDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/merchant");
  }

  // 非商家用户跳转到申请页
  if (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN") {
    redirect("/merchant/apply");
  }

  const userId = session.user.id;

  const [profile, companies, pendingReviews] = await Promise.all([
    prisma.merchantProfile.findUnique({ where: { userId } }),
    prisma.company.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        quotes: {
          where: { active: true },
          select: { id: true },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        status: "PUBLISHED",
        company: { ownerUserId: userId },
        merchantReply: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { nickname: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalQuotes = companies.reduce((sum, c) => sum + c.quotes.length, 0);
  const totalReviews = companies.reduce((sum, c) => sum + c.reviewCount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Store className="text-brand-600" size={24} />
            商家中心
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {profile?.businessName ?? session.user.name} · 管理您的公司与报价
          </p>
        </div>
        <Button asChild>
          <Link href="/merchant/companies/new">
            <Plus size={16} />
            入驻新公司
          </Link>
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Package size={14} />
              我的公司
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {companies.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Package size={14} />
              报价数量
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {totalQuotes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Star size={14} />
              收到评价
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {totalReviews}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare size={14} />
              待回复评价
            </div>
            <div className="mt-2 text-2xl font-bold text-gold-600">
              {pendingReviews.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 我的公司列表 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          我的公司
        </h2>
        {companies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Package size={40} className="text-gray-300" />
              <p className="text-gray-500">您还没有入驻任何公司</p>
              <Button asChild>
                <Link href="/merchant/companies/new">
                  <Plus size={16} />
                  立即入驻
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {companies.map((c) => {
              const serviceTypes = safeParseJson<string[]>(
                c.serviceTypes,
                [],
              );
              const typeLabels: Record<string, string> = {
                AIR: "空运",
                SEA: "海运",
                RAIL: "铁运",
                SPECIAL: "专线",
              };
              return (
                <Card key={c.id}>
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/companies/${c.id}`}
                          className="font-semibold text-gray-900 hover:text-brand-600"
                        >
                          {c.name}
                        </Link>
                        {c.verified ? (
                          <Badge variant="blue">已认证</Badge>
                        ) : (
                          <Badge variant="outline">未认证</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {c.quotes.length} 条报价
                        </span>
                      </div>
                      {c.intro && (
                        <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                          {c.intro}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <StarRating value={c.ratingAvg} showValue size={12} />
                        <span>{c.reviewCount} 条评价</span>
                        <span>·</span>
                        <span>创建于 {relativeTime(c.createdAt)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {serviceTypes.map((t) => (
                          <Badge key={t} variant="brand">
                            {typeLabels[t] ?? t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/merchant/companies/${c.id}`}>
                          管理资料与报价
                          <ArrowRight size={14} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 待回复评价 */}
      {pendingReviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            待回复评价
          </h2>
          <div className="grid gap-3">
            {pendingReviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/companies/${r.company?.id ?? ""}`}
                        className="font-medium text-gray-900 hover:text-brand-600"
                      >
                        {r.company?.name ?? "未知公司"}
                      </Link>
                      <StarRating value={r.overallRating} size={12} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {relativeTime(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {r.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    — {r.user.nickname}
                  </p>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/merchant/companies/${r.company?.id ?? ""}`}>
                        去回复
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
