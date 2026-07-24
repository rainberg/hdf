import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CodeForm } from "@/components/codes/code-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "发布优惠码" };

export const dynamic = "force-dynamic";

export default async function NewCodePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/codes/new");
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">发布优惠码</h1>
        <p className="mt-1 text-sm text-gray-500">
          分享你发现的邀请码、打折码或返利链接。请如实填写，含返利请勾选「含返利」以透明披露。
        </p>
      </div>
      <CodeForm />
    </div>
  );
}
