"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  profileSchema,
  type ProfileInput,
} from "@/lib/validations";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface ProfileFormProps {
  defaultNickname: string;
  defaultAvatar: string;
  defaultBio: string;
}

export function ProfileForm({
  defaultNickname,
  defaultAvatar,
  defaultBio,
}: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      nickname: defaultNickname,
      avatar: defaultAvatar,
      bio: defaultBio,
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存失败，请重试");
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("网络错误，请重试");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>编辑资料</CardTitle>
        <CardDescription>
          修改你的昵称、头像与个人简介。这些信息会展示在你的评价与优惠码中。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              autoComplete="nickname"
              placeholder="2-30 个字符"
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register("nickname")}
            />
            {errors.nickname && (
              <p className="text-xs text-brand-500">
                {errors.nickname.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatar">头像 URL</Label>
            <Input
              id="avatar"
              type="url"
              autoComplete="photo"
              placeholder="https://example.com/avatar.png"
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register("avatar")}
            />
            {errors.avatar && (
              <p className="text-xs text-brand-500">
                {errors.avatar.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="介绍一下自己（最多 200 字）"
              className="focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-xs text-brand-500">{errors.bio.message}</p>
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
              资料已保存
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            保存修改
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
