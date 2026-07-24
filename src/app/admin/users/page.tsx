import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/admin/user-actions";
import { relativeTime, creditLevel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "用户管理" };
export const dynamic = "force-dynamic";

interface SearchParams {
  role?: string;
  q?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const role = sp.role ?? "ALL";
  const q = sp.q?.trim();

  const where: Record<string, unknown> = {};
  if (role !== "ALL") where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { nickname: { contains: q } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        creditScore: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            reviews: true,
            codes: true,
            ownedCompanies: true,
          },
        },
      },
    }),
  ]);

  const tabs = [
    { value: "ALL", label: "全部" },
    { value: "USER", label: "普通用户" },
    { value: "MERCHANT", label: "商家" },
    { value: "ADMIN", label: "管理员" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">用户管理</h2>
        <span className="text-sm text-gray-500">共 {total} 位用户</span>
      </div>

      {/* 搜索 */}
      <form className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜索邮箱或昵称"
          className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          搜索
        </button>
      </form>

      {/* 角色筛选 Tab */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/users?role=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ${
              role === t.value
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            暂无用户
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const credit = creditLevel(u.creditScore);
            return (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {u.nickname}
                        </span>
                        <Badge
                          variant={
                            u.role === "ADMIN"
                              ? "red"
                              : u.role === "MERCHANT"
                                ? "red"
                                : "outline"
                          }
                        >
                          {u.role === "ADMIN"
                            ? "管理员"
                            : u.role === "MERCHANT"
                              ? "商家"
                              : "用户"}
                        </Badge>
                        <Badge variant="outline" className={credit.color}>
                          {credit.label} · {u.creditScore}
                        </Badge>
                        {!u.emailVerified && (
                          <Badge variant="outline" className="text-amber-600">
                            未验证邮箱
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <div>
                          <span className="text-gray-400">邮箱：</span>
                          {u.email}
                        </div>
                        <div>
                          <span className="text-gray-400">注册：</span>
                          {relativeTime(u.createdAt)}
                        </div>
                        <div>
                          <span className="text-gray-400">最近登录：</span>
                          {u.lastLoginAt ? relativeTime(u.lastLoginAt) : "从未"}
                        </div>
                        <div>
                          <span className="text-gray-400">贡献：</span>
                          {u._count.reviews} 评价 · {u._count.codes} 优惠码 ·{" "}
                          {u._count.ownedCompanies} 公司
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <UserActions
                        userId={u.id}
                        currentRole={u.role}
                        creditScore={u.creditScore}
                      />
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
