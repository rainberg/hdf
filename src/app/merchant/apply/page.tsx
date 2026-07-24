import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MerchantApplyForm } from "./apply-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "商家入驻申请" };
export const dynamic = "force-dynamic";

export default async function MerchantApplyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/merchant/apply");
  }

  // 已是商家则跳转
  if (session.user.role === "MERCHANT" || session.user.role === "ADMIN") {
    redirect("/merchant");
  }

  const profile = await prisma.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">商家入驻申请</h1>
        <p className="mt-1 text-sm text-gray-500">
          填写以下信息，审核通过后即可入驻平台，自助管理公司与报价。
        </p>
      </div>
      <MerchantApplyForm
        initialProfile={
          profile
            ? {
                businessName: profile.businessName,
                businessLicense: profile.businessLicense ?? "",
                contactEmail: profile.contactEmail,
                contactPhone: profile.contactPhone ?? "",
                status: profile.status,
              }
            : null
        }
      />
    </div>
  );
}
