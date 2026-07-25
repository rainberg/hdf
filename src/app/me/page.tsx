import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditLevel, relativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "个人中心",
};

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/me");
  }

  const userId = session.user.id;

  const [user, reviews, codes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        creditScore: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { nickname: true } },
        company: { select: { name: true } },
        phonePlan: { select: { planName: true } },
      },
    }),
    prisma.code.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/me");
  }

  const level = creditLevel(user.creditScore);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">个人中心</h1>

      {/* 用户信息 */}
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-gray-400">
                {user.nickname.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {user.nickname}
              </h2>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {user.role === "ADMIN"
                  ? "管理员"
                  : user.role === "MERCHANT"
                    ? "商家"
                    : "普通用户"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            <p className="mt-1 text-xs text-gray-400">
              注册于 {relativeTime(user.createdAt)}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-500">信用分</p>
            <p className="text-2xl font-bold text-gray-900">
              {user.creditScore}
            </p>
            <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
          </div>
        </CardContent>
      </Card>

      {/* 我的评价 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          我的评价（{reviews.length}）
        </h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-gray-500">
              还没有发布过评价，去分享你的真实体验吧。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {reviews.map((r) => {
              const targetName =
                r.company?.name ?? r.phonePlan?.planName ?? "已删除对象";
              const targetHref = r.company
                ? `/companies/${r.companyId}`
                : r.phonePlan
                  ? `/phone-plans/${r.phonePlanId}`
                  : "#";
              const filled = Math.round(r.overallRating);
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={targetHref}
                        className="font-medium text-gray-900 hover:text-brand-600"
                      >
                        {targetName}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gold-500">
                          {"★".repeat(filled)}
                          <span className="text-gray-300">
                            {"★".repeat(5 - filled)}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {relativeTime(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {r.content}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 我的优惠码 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          我的优惠码（{codes.length}）
        </h2>
        {codes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-gray-500">
              还没有分享过优惠码。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {codes.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        {c.platform}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {c.type === "INVITE"
                          ? "邀请码"
                          : c.type === "DISCOUNT"
                            ? "打折码"
                            : "推荐码"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {c.benefitDescription}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {c.codeValue && (
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {c.codeValue}
                      </code>
                    )}
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${
                        c.status === "ACTIVE"
                          ? "bg-green-50 text-green-600"
                          : c.status === "EXPIRED"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-brand-50 text-brand-600"
                      }`}
                    >
                      {c.status === "ACTIVE"
                        ? "可用"
                        : c.status === "EXPIRED"
                          ? "已过期"
                          : "已删除"}
                    </span>
                    {c.hasReferral && (
                      <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                        含返利
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
