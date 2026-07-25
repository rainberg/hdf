import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertCircle, MailX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  verifyEmailVerificationToken,
  consumeEmailVerificationToken,
} from "@/lib/tokens";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "验证邮箱",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  token?: string;
}

type VerifyResult =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "success" };

async function handleVerify(token: string): Promise<VerifyResult> {
  const userId = await verifyEmailVerificationToken(token);
  if (!userId) {
    return { status: "invalid" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  await consumeEmailVerificationToken(token);

  return { status: "success" };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token.trim() : "";

  let result: VerifyResult;
  if (!token) {
    result = { status: "missing" };
  } else {
    result = await handleVerify(token);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      {result.status === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2
            className="mx-auto mb-3 text-emerald-600"
            size={48}
          />
          <h1 className="text-lg font-semibold text-emerald-900">
            邮箱验证成功
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            你的邮箱已成功验证，现在可以使用全部功能。
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/login">前往登录</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-8 text-center">
          {result.status === "missing" ? (
            <MailX className="mx-auto mb-3 text-brand-600" size={48} />
          ) : (
            <AlertCircle className="mx-auto mb-3 text-brand-600" size={48} />
          )}
          <h1 className="text-lg font-semibold text-brand-900">
            {result.status === "missing" ? "缺少验证令牌" : "验证链接无效"}
          </h1>
          <p className="mt-1 text-sm text-brand-700">
            {result.status === "missing"
              ? "请通过邮件中的链接打开此页面，或登录后重新发送验证邮件。"
              : "验证链接无效或已过期，请登录后重新发送验证邮件。"}
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/login">前往登录</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
