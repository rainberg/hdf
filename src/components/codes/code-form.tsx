"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { codeSchema, type CodeInput } from "@/lib/validations";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { value: "INVITE", label: "邀请码" },
  { value: "DISCOUNT", label: "打折码" },
  { value: "REFERRAL", label: "返利链接" },
];

const categories = [
  { value: "ecommerce", label: "电商" },
  { value: "streaming", label: "流媒体" },
  { value: "tool", label: "工具软件" },
  { value: "transport", label: "转运" },
  { value: "telecom", label: "通信" },
  { value: "other", label: "其他" },
];

const commonPlatforms = [
  "Amazon",
  "OTTO",
  "MediaMarkt",
  "Netflix",
  "Spotify",
  "YouTube Premium",
  "Disney+",
  "淘宝集运",
  "京东全球购",
];

export function CodeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CodeInput>({
    resolver: zodResolver(codeSchema) as never,
    defaultValues: {
      type: "DISCOUNT",
      platformCategory: "ecommerce",
      hasReferral: false,
    },
  });

  const type = watch("type");
  const category = watch("platformCategory");
  const hasReferral = watch("hasReferral");

  const onSubmit = async (data: CodeInput) => {
    setError(null);
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "提交失败");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/codes"), 1500);
    } catch {
      setError("网络错误，请重试");
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h3 className="text-lg font-semibold text-green-900">优惠码已发布</h3>
        <p className="mt-1 text-sm text-green-700">正在跳转到优惠码列表…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 类型 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-3 block">类型</Label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue("type", t.value as CodeInput["type"])}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                type === t.value
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 平台 + 分类 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-2 block">
          适用平台 <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("platform")}
          placeholder="如：Amazon / Netflix / 淘宝集运"
          list="common-platforms"
        />
        <datalist id="common-platforms">
          {commonPlatforms.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        {errors.platform && (
          <p className="mt-1 text-xs text-red-500">{errors.platform.message}</p>
        )}

        <Label className="mb-2 mt-4 block">分类</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() =>
                setValue("platformCategory", c.value as CodeInput["platformCategory"])
              }
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                category === c.value
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 优惠内容 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-2 block">
          优惠内容 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("benefitDescription")}
          placeholder="如：首月免费 / 满 50 减 10 / 新用户 10 欧礼包"
          rows={2}
        />
        {errors.benefitDescription && (
          <p className="mt-1 text-xs text-red-500">
            {errors.benefitDescription.message}
          </p>
        )}
      </div>

      {/* 码值 + 链接 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-2 block">码值（可选）</Label>
        <Input
          {...register("codeValue")}
          placeholder="如：HUADIAN2024"
          className="font-mono"
        />
        <Label className="mb-2 mt-4 block">链接（可选）</Label>
        <Input
          {...register("link")}
          placeholder="https://..."
          type="url"
        />
        <p className="mt-2 text-xs text-gray-400">
          码值与链接至少填写一项。
        </p>
      </div>

      {/* 有效期 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-3 block">有效期（可选）</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs text-gray-500">开始日期</Label>
            <Input type="date" {...register("validFrom")} />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-gray-500">截止日期</Label>
            <Input type="date" {...register("validUntil")} />
          </div>
        </div>
      </div>

      {/* 返利披露 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasReferral}
            onChange={(e) => setValue("hasReferral", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          此码/链接含返利（点击购买后我会获得佣金）
        </label>
        <p className="mt-2 text-xs text-gray-400">
          平台不参与分成，但要求发布者透明披露是否含返利，维护社区信任。
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          发布
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
