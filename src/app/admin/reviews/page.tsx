import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewActions } from "@/components/admin/review-actions";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { relativeTime, creditLevel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "评价审核" };
export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { nickname: true, creditScore: true } },
      company: { select: { id: true, name: true } },
      phonePlan: { select: { id: true, planName: true } },
    },
  });

  const tabs = [
    { value: "PENDING", label: "待审核" },
    { value: "PUBLISHED", label: "已发布" },
    { value: "REJECTED", label: "已拒绝" },
    { value: "ALL", label: "全部" },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">评价审核</h2>

      {/* Tab 切换 */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/reviews?status=${t.value}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ${
              status === t.value
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            暂无评价
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const credit = creditLevel(r.user.creditScore);
            const targetName = r.company?.name ?? r.phonePlan?.planName ?? "已删除";
            const targetHref = r.company
              ? `/companies/${r.company.id}`
              : r.phonePlan
                ? `/phone-plans/${r.phonePlan.id}`
                : "#";
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {r.user.nickname}
                        </span>
                        <Badge variant="outline" className={credit.color}>
                          {credit.label}
                        </Badge>
                        <span className="text-xs text-gray-400">·</span>
                        <Link
                          href={targetHref}
                          className="text-sm text-gray-600 hover:text-red-600"
                        >
                          {targetName}
                        </Link>
                        <StarRating value={r.overallRating} size={12} />
                        <Badge
                          variant={
                            r.status === "PUBLISHED"
                              ? "red"
                              : r.status === "PENDING"
                                ? "outline"
                                : "outline"
                          }
                        >
                          {r.status === "PUBLISHED"
                            ? "已发布"
                            : r.status === "PENDING"
                              ? "待审核"
                              : "已拒绝"}
                        </Badge>
                      </div>
                      <p className="prose-review mt-2 text-sm text-gray-700">
                        {r.content}
                      </p>
                      {r.scenario && (
                        <p className="mt-1 text-xs text-gray-500">
                          品类：{r.scenario}
                          {r.route && ` · 线路：${r.route}`}
                          {r.weight && ` · 重量：${r.weight}kg`}
                          {r.cost && ` · 花费：¥${r.cost}`}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {relativeTime(r.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <ReviewActions reviewId={r.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
