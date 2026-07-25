import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantActions } from "@/components/admin/merchant-actions";
import { relativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "商家申请审核" };
export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
}

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;

  const profiles = await prisma.merchantProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { id: true, email: true, nickname: true, role: true },
      },
    },
  });

  const tabs = [
    { value: "PENDING", label: "待审核" },
    { value: "APPROVED", label: "已通过" },
    { value: "REJECTED", label: "已拒绝" },
    { value: "ALL", label: "全部" },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        商家申请审核
      </h2>

      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/merchants?status=${t.value}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ${
              status === t.value
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            暂无申请
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {p.businessName}
                      </span>
                      <Badge
                        variant={
                          p.status === "APPROVED"
                            ? "brand"
                            : p.status === "PENDING"
                              ? "outline"
                              : "outline"
                        }
                      >
                        {p.status === "APPROVED"
                          ? "已通过"
                          : p.status === "PENDING"
                            ? "待审核"
                            : "已拒绝"}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div>
                        <span className="text-gray-400">申请人：</span>
                        {p.user.nickname} ({p.user.email})
                      </div>
                      {p.contactPhone && (
                        <div>
                          <span className="text-gray-400">电话：</span>
                          {p.contactPhone}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">联系邮箱：</span>
                        {p.contactEmail}
                      </div>
                      {p.businessLicense && (
                        <div>
                          <span className="text-gray-400">执照：</span>
                          {p.businessLicense}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      申请于 {relativeTime(p.createdAt)}
                    </p>
                  </div>
                  {p.status === "PENDING" && (
                    <div className="shrink-0">
                      <MerchantActions profileId={p.id} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
