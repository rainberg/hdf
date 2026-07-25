"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
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

interface LoginFormProps {
  callbackUrl: string;
  googleEnabled: boolean;
  wechatEnabled: boolean;
}

export function LoginForm({
  callbackUrl,
  googleEnabled,
  wechatEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as never,
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });
      if (!res || res.error) {
        setError("邮箱或密码错误，或账号已被封禁");
        return;
      }
      router.push(callbackUrl || "/");
    } catch {
      setError("网络错误，请重试");
    }
  };

  const showSocial = googleEnabled || wechatEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>账号登录</CardTitle>
        <CardDescription>
          使用邮箱密码登录，或选择第三方账号。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-brand-500">
                {errors.password.message}
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
            登录
          </Button>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-500 hover:text-brand-600"
            >
              忘记密码？
            </Link>
          </div>
        </form>

        {showSocial && (
          <>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">
                  或使用第三方登录
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              {googleEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn("google", { callbackUrl })}
                >
                  使用 Google 登录
                </Button>
              )}
              {wechatEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn("wechat", { callbackUrl })}
                >
                  使用微信登录
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          还没有账号？{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:underline"
          >
            立即注册
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
