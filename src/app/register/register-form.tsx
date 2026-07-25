"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
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

interface RegisterFormProps {
  callbackUrl?: string;
}

export function RegisterForm({ callbackUrl = "/" }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      email: "",
      nickname: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  // 密码强度计算
  const strength = calcPasswordStrength(password);
  const strengthLabel = ["太弱", "弱", "中", "强", "很强"][strength.score];
  const strengthColor = [
    "bg-gray-200",
    "bg-red-400",
    "bg-gold-400",
    "bg-brand-400",
    "bg-emerald-500",
  ][strength.score];

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "注册失败，请重试");
        return;
      }

      // 注册成功后自动登录
      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });
      if (signInRes && !signInRes.error) {
        setSuccess(true);
        setTimeout(() => router.push(callbackUrl), 1000);
      } else {
        // 自动登录失败，退回到登录页
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("网络错误，请重试");
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={48} />
        <h3 className="text-lg font-semibold text-emerald-900">注册成功</h3>
        <p className="mt-1 text-sm text-emerald-700">即将跳转…</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>注册账号</CardTitle>
        <CardDescription>
          注册后即可发布评价、分享优惠码、积累信用分。
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-1.5">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              autoComplete="nickname"
              placeholder="2-30 个字符"
              {...register("nickname")}
            />
            {errors.nickname && (
              <p className="text-xs text-brand-500">
                {errors.nickname.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 8 位，含字母和数字"
              {...register("password", {
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            {password && (
              <div className="flex items-center gap-2">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors ${
                        i < strength.score ? strengthColor : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{strengthLabel}</span>
              </div>
            )}
            {errors.password && (
              <p className="text-xs text-brand-500">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入密码"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-brand-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              {...register("agreeTerms")}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              我已阅读并同意
              <Link
                href="/terms"
                className="mx-1 text-brand-600 hover:underline"
              >
                服务条款
              </Link>
              与
              <Link
                href="/privacy"
                className="ml-1 text-brand-600 hover:underline"
              >
                隐私政策
              </Link>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-brand-500">
              {errors.agreeTerms.message}
            </p>
          )}

          {error && (
            <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            注册并登录
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            去登录
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

/**
 * 密码强度评估，返回 0-4 的分数
 */
function calcPasswordStrength(pw: string): { score: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  else if (/[a-zA-Z]/.test(pw)) score += 0;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score = Math.min(4, score + 1);
  return { score: Math.min(4, score) };
}
