import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "登录",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  callbackUrl?: string;
}

export default async function LoginPage({
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

  // 社交登录 Provider 仅在服务端配置了对应环境变量时启用
  // （这些 env 非 NEXT_PUBLIC_ 前缀，客户端无法读取，需在此判断后传入）
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const wechatEnabled = !!(
    process.env.WECHAT_CLIENT_ID && process.env.WECHAT_CLIENT_SECRET
  );

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">登录华德福</h1>
        <p className="mt-1 text-sm text-gray-500">
          登录后即可发布评价、分享优惠码、管理个人中心。
        </p>
      </div>
      <LoginForm
        callbackUrl={callbackUrl}
        googleEnabled={googleEnabled}
        wechatEnabled={wechatEnabled}
      />
    </div>
  );
}
