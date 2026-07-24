import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompanyForm } from "@/components/companies/company-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "入驻新公司" };
export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/merchant/companies/new");
  }
  if (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN") {
    redirect("/merchant/apply");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入驻新公司</h1>
        <p className="mt-1 text-sm text-gray-500">
          填写公司资料与报价信息，提交后即可在平台展示。
        </p>
      </div>
      <CompanyForm mode="create" />
    </div>
  );
}
