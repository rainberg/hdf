import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import {
  Package,
  Star,
  Users,
  Ticket,
  Smartphone,
  Store,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "运营概览" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    companyCount,
    reviewCount,
    pendingReviewCount,
    userCount,
    codeCount,
    planCount,
    merchantCount,
    pendingMerchantCount,
    recentReviews,
    recentUsers,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.code.count(),
    prisma.phonePlan.count(),
    prisma.merchantProfile.count({
      where: { status: "APPROVED" },
    }),
    prisma.merchantProfile.count({
      where: { status: "PENDING" },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { nickname: true } },
        company: { select: { name: true } },
        phonePlan: { select: { planName: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        creditScore: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = [
    { label: "转运公司", value: companyCount, icon: Package, color: "text-brand-600 bg-brand-50" },
    { label: "电话套餐", value: planCount, icon: Smartphone, color: "text-blue-600 bg-blue-50" },
    { label: "优惠码", value: codeCount, icon: Ticket, color: "text-green-600 bg-green-50" },
    { label: "用户总数", value: userCount, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "已通过商家", value: merchantCount, icon: Store, color: "text-amber-600 bg-amber-50" },
    { label: "评价总数", value: reviewCount, icon: Star, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div>
      {/* 待办提醒 */}
      {(pendingReviewCount > 0 || pendingMerchantCount > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {pendingReviewCount > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
            >
              <AlertCircle size={16} />
              {pendingReviewCount} 条评价待审核
              <ArrowRight size={14} />
            </Link>
          )}
          {pendingMerchantCount > 0 && (
            <Link
              href="/admin/merchants"
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 hover:bg-blue-100"
            >
              <AlertCircle size={16} />
              {pendingMerchantCount} 个商家申请待审核
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近评价 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          最近评价
        </h2>
        <Card>
          <CardContent className="divide-y divide-gray-100 p-0">
            {recentReviews.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                暂无评价
              </div>
            ) : (
              recentReviews.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {r.user.nickname}
                      </span>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-sm text-gray-600">
                        {r.company?.name ?? r.phonePlan?.planName ?? "已删除"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {relativeTime(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                    {r.content}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${
                      r.status === "PUBLISHED"
                        ? "bg-green-50 text-green-600"
                        : r.status === "PENDING"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {r.status === "PUBLISHED"
                      ? "已发布"
                      : r.status === "PENDING"
                        ? "待审核"
                        : "已拒绝"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* 最近注册用户 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          最近注册用户
        </h2>
        <Card>
          <CardContent className="divide-y divide-gray-100 p-0">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                暂无用户
              </div>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {u.nickname}
                    </div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {u.role === "ADMIN"
                        ? "管理员"
                        : u.role === "MERCHANT"
                          ? "商家"
                          : "用户"}
                    </span>
                    <span>信用 {u.creditScore}</span>
                    <span>{relativeTime(u.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
