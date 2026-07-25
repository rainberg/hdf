"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, MailWarning } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface ForgotPasswordFormProps {
  emailConfigured: boolean;
}

export function ForgotPasswordForm({ emailConfigured }: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema) as never,
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "发送重置邮件失败，请重试");
        return;
      }
      setSuccess(true);
    } catch {
      setError("网络错误，请重试");
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <CheckCircle2
              className="mx-auto mb-3 text-emerald-600"
              size={48}
            />
            <h3 className="text-lg font-semibold text-emerald-900">
              重置链接已发送
            </h3>
            <p className="mt-2 text-sm text-emerald-700">
              如果该邮箱已注册，重置链接已发送到你的邮箱。请检查收件箱（包括垃圾邮件文件夹）。
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            返回登录
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>找回密码</CardTitle>
        <CardDescription>
          输入你的注册邮箱，我们将向你发送重置密码的链接。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!emailConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-gold-50 p-3 text-sm text-gold-700">
            <MailWarning size={16} className="mt-0.5 shrink-0" />
            <span>
              当前为邮件降级模式，请联系管理员协助重置密码。
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-brand-500">{errors.email.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            发送重置链接
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          想起来了？{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            返回登录
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
