"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
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

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema) as never,
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "密码重置失败，请重试");
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
              密码重置成功
            </h3>
            <p className="mt-2 text-sm text-emerald-700">
              请使用新密码登录你的账号。
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            前往登录
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>设置新密码</CardTitle>
        <CardDescription>
          请输入你的新密码，密码需至少 8 位且包含字母和数字。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("token")} />

          <div className="space-y-1.5">
            <Label htmlFor="password">新密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 8 位"
              {...register("password")}
            />
            <p className="text-xs text-gray-500">
              至少 8 位，必须包含字母 + 数字。
            </p>
            {errors.password && (
              <p className="text-xs text-brand-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入新密码"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-brand-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            重置密码
          </Button>
        </form>
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
