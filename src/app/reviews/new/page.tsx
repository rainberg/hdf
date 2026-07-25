import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ReviewForm } from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface SearchParams {
  entityType?: string;
  entityId?: string;
}

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/reviews/new");
  }

  const sp = await searchParams;
  const entityType = sp.entityType === "PHONE_PLAN" ? "PHONE_PLAN" : "COMPANY";
  const entityId = sp.entityId;

  if (!entityId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">缺少评价对象</h1>
        <p className="mt-2 text-sm text-gray-500">
          请从公司或套餐详情页进入评价。
        </p>
        <Button asChild className="mt-4">
          <Link href="/companies">浏览转运公司</Link>
        </Button>
      </div>
    );
  }

  // 取实体名称用于显示
  let entityName: string;
  if (entityType === "COMPANY") {
    const c = await prisma.company.findUnique({
      where: { id: entityId },
      select: { name: true },
    });
    if (!c) redirect("/companies");
    entityName = c.name;
  } else {
    const p = await prisma.phonePlan.findUnique({
      where: { id: entityId },
      select: { planName: true },
    });
    if (!p) redirect("/phone-plans");
    entityName = p.planName;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link
          href={entityType === "COMPANY" ? `/companies/${entityId}` : `/phone-plans/${entityId}`}
          className="hover:text-brand-600"
        >
          {entityName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">写评价</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          为「{entityName}」写评价
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          分享真实体验，帮助其他华人避坑。评价需客观公正，禁止人身攻击与广告。
        </p>
      </div>

      <ReviewForm
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </div>
  );
}
