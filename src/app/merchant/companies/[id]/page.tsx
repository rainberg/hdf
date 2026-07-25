import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CompanyForm } from "@/components/companies/company-form";
import { QuoteManager } from "@/components/companies/quote-manager";
import { ReplyForm } from "@/components/reviews/reply-form";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { relativeTime, safeParseJson } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "管理公司" };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function ManageCompanyPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/merchant/companies/${id}`);
  }

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: [{ serviceType: "asc" }, { firstWeightPrice: "asc" }],
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { nickname: true } },
        },
      },
    },
  });

  if (!company) notFound();

  // 权限校验：仅所有者或管理员可管理
  const isOwner = company.ownerUserId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/merchant");
  }

  const origins = safeParseJson<string[]>(company.origins, []);
  const destinations = safeParseJson<string[]>(company.destinations, []);
  const serviceTypes = safeParseJson<string[]>(company.serviceTypes, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/merchant"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft size={14} />
        返回商家中心
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {company.name}
            {company.verified ? (
              <Badge variant="blue">已认证</Badge>
            ) : (
              <Badge variant="outline">待认证</Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            管理公司资料、报价与评价回复
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/companies/${company.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            查看公开页
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* 公司资料编辑 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          公司资料
        </h2>
        <CompanyForm
          mode="edit"
          companyId={company.id}
          initial={{
            name: company.name,
            logo: company.logo,
            website: company.website,
            intro: company.intro,
            foundedYear: company.foundedYear,
            phone: company.phone,
            wechat: company.wechat,
            email: company.email,
            origins,
            destinations,
            serviceTypes,
          }}
        />
      </section>

      {/* 报价管理 */}
      <section className="mb-8">
        <QuoteManager companyId={company.id} quotes={company.quotes} />
      </section>

      {/* 评价回复 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          用户评价（{company.reviews.length}）
        </h2>
        {company.reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            暂无评价
          </div>
        ) : (
          <div className="space-y-3">
            {company.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {r.user.nickname}
                    </span>
                    <StarRating value={r.overallRating} size={12} />
                    <Badge
                      variant={
                        r.status === "PUBLISHED"
                          ? "brand"
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
                  <span className="text-xs text-gray-400">
                    {relativeTime(r.createdAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-gray-700">
                  {r.content}
                </p>
                {r.merchantReply ? (
                  <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm">
                    <div className="mb-1 text-xs font-medium text-blue-700">
                      您的回复
                    </div>
                    <p className="text-blue-900">{r.merchantReply}</p>
                  </div>
                ) : (
                  r.status === "PUBLISHED" && (
                    <ReplyForm reviewId={r.id} />
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
