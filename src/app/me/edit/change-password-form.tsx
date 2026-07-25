"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema) as never,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "密码修改失败，请重试");
        return;
      }
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("网络错误，请重试");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
        <CardDescription>
          为账号安全，请定期更换密码。使用第三方登录的账号需先设置密码。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">当前密码</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="请输入当前密码"
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-brand-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">新密码</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="至少 8 位，含字母 + 数字"
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register("newPassword")}
            />
            <p className="text-xs text-gray-400">
              密码强度要求：至少 8 位，必须同时包含字母和数字。
            </p>
            {errors.newPassword && (
              <p className="text-xs text-brand-500">
                {errors.newPassword.message}
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
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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

          {success && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-600">
              <CheckCircle2 size={16} />
              密码修改成功
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            修改密码
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
