import type { Metadata } from "next";
import { emailConfigured } from "@/lib/email";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "忘记密码",
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">忘记密码</h1>
        <p className="mt-1 text-sm text-gray-500">
          输入注册邮箱，我们会向你发送密码重置链接。
        </p>
      </div>
      <ForgotPasswordForm emailConfigured={emailConfigured} />
    </div>
  );
}
