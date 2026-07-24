import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeAdminActions } from "@/components/admin/code-actions";
import { relativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "优惠码管理" };
export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  q?: string;
}

const categoryLabels: Record<string, string> = {
  ecommerce: "电商",
  streaming: "流媒体",
  tool: "工具",
  transport: "转运",
  telecom: "通讯",
  other: "其他",
};

const typeLabels: Record<string, string> = {
  INVITE: "邀请码",
  DISCOUNT: "打折码",
  REFERRAL: "返利码",
};

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "ACTIVE";
  const q = sp.q?.trim();

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { platform: { contains: q } },
      { benefitDescription: { contains: q } },
      { codeValue: { contains: q } },
    ];
  }

  const [total, codes] = await Promise.all([
    prisma.code.count({ where }),
    prisma.code.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { id: true, nickname: true, email: true, creditScore: true },
        },
      },
    }),
  ]);

  const tabs = [
    { value: "ACTIVE", label: "有效" },
    { value: "EXPIRED", label: "已失效" },
    { value: "REMOVED", label: "已删除" },
    { value: "ALL", label: "全部" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">优惠码管理</h2>
        <span className="text-sm text-gray-500">共 {total} 条</span>
      </div>

      {/* 搜索 */}
      <form className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜索平台、优惠内容或码值"
          className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          搜索
        </button>
      </form>

      {/* 状态筛选 Tab */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/codes?status=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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

      {codes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            暂无优惠码
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => {
            const downvoteRate =
              c.upvotes + c.downvotes > 0
                ? c.downvotes / (c.upvotes + c.downvotes)
                : 0;
            const flagged = downvoteRate >= 0.6 && c.upvotes + c.downvotes >= 3;
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {c.platform}
                        </span>
                        <Badge variant="outline">
                          {typeLabels[c.type] ?? c.type}
                        </Badge>
                        <Badge variant="outline">
                          {categoryLabels[c.platformCategory] ?? c.platformCategory}
                        </Badge>
                        <Badge
                          variant={
                            c.status === "ACTIVE"
                              ? "green"
                              : c.status === "EXPIRED"
                                ? "amber"
                                : "outline"
                          }
                        >
                          {c.status === "ACTIVE"
                            ? "有效"
                            : c.status === "EXPIRED"
                              ? "已失效"
                              : "已删除"}
                        </Badge>
                        {flagged && (
                          <Badge variant="red">用户举报过多</Badge>
                        )}
                        {c.hasReferral && (
                          <Badge variant="amber">含返利</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {c.benefitDescription}
                      </p>
                      {c.codeValue && (
                        <p className="mt-1 font-mono text-sm text-gray-900">
                          码值：<span className="rounded bg-gray-100 px-1.5 py-0.5">{c.codeValue}</span>
                        </p>
                      )}
                      <div className="mt-2 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                        <div>
                          <span className="text-gray-400">发布者：</span>
                          {c.user.nickname} ({c.user.email}) · 信用 {c.user.creditScore}
                        </div>
                        <div>
                          <span className="text-gray-400">投票：</span>
                          👍 {c.upvotes} / 👎 {c.downvotes}
                          {downvoteRate > 0 && (
                            <span className="ml-1 text-amber-600">
                              (失效率 {Math.round(downvoteRate * 100)}%)
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-400">有效期：</span>
                          {c.validUntil
                            ? new Date(c.validUntil).toLocaleDateString("zh-CN")
                            : "长期"}
                        </div>
                        <div>
                          <span className="text-gray-400">发布：</span>
                          {relativeTime(c.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <CodeAdminActions
                        codeId={c.id}
                        currentStatus={c.status}
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
