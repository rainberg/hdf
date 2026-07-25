import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "重置密码",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  token?: string;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() || "";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">重置密码</h1>
        <p className="mt-1 text-sm text-gray-500">
          为你的账号设置一个新密码。
        </p>
      </div>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-brand-900">
            重置链接无效
          </h3>
          <p className="mt-2 text-sm text-brand-600">
            链接中缺少必要的重置令牌。请确认你打开的是邮件中提供的完整链接。
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block font-medium text-brand-600 hover:underline"
          >
            重新申请重置链接
          </a>
        </div>
      )}
    </div>
  );
}
