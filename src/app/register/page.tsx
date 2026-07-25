import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  callbackUrl?: string;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const sp = await searchParams;
  const callbackUrl = sp.callbackUrl || "/";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">注册华德福</h1>
        <p className="mt-1 text-sm text-gray-500">
          创建账号，加入在德华人生活社区。
        </p>
      </div>
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  );
}
