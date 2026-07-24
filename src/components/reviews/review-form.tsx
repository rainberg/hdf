"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { StarInput } from "@/components/ui/star-rating";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ReviewFormProps {
  entityType: "COMPANY" | "PHONE_PLAN";
  entityId: string;
  entityName: string;
}

const dimensionFields: Array<{
  key: keyof ReviewInput["dimensions"];
  label: string;
}> = [
  { key: "price", label: "价格合理性" },
  { key: "speed", label: "时效准确性" },
  { key: "package", label: "包装质量" },
  { key: "service", label: "客服响应" },
  { key: "loss", label: "丢件/破损" },
  { key: "customs", label: "清关顺畅" },
];

export function ReviewForm({ entityType, entityId, entityName }: ReviewFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema) as never,
    defaultValues: {
      entityType,
      entityId,
      overallRating: 0,
      dimensions: {
        price: 0,
        speed: 0,
        package: 0,
        service: 0,
        loss: 0,
        customs: 0,
      },
      images: [],
      recommend: true,
    },
  });

  const overall = watch("overallRating");
  const dimensions = watch("dimensions");
  const recommend = watch("recommend");

  const onSubmit = async (data: ReviewInput) => {
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
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
      setTimeout(() => {
        if (entityType === "COMPANY") {
          router.push(`/companies/${entityId}`);
        } else {
          router.push(`/phone-plans/${entityId}`);
        }
      }, 1500);
    } catch {
      setError("网络错误，请重试");
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h3 className="text-lg font-semibold text-green-900">评价已提交</h3>
        <p className="mt-1 text-sm text-green-700">
          正在跳转回 {entityName} 详情页…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("entityType")} />
      <input type="hidden" {...register("entityId")} />

      {/* 总体评分 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-3 block">
          总体评分 <span className="text-red-500">*</span>
        </Label>
        <StarInput
          value={overall}
          onChange={(v) => setValue("overallRating", v, { shouldValidate: true })}
          size={32}
        />
        {errors.overallRating && (
          <p className="mt-2 text-xs text-red-500">
            {errors.overallRating.message}
          </p>
        )}
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recommend}
            onChange={(e) => setValue("recommend", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          推荐这家{entityType === "COMPANY" ? "公司" : "套餐"}
        </label>
      </div>

      {/* 多维度评分 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-3 block">多维度评分</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          {dimensionFields.map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{f.label}</span>
              <StarInput
                value={dimensions[f.key]}
                onChange={(v) =>
                  setValue(`dimensions.${f.key}`, v, { shouldValidate: true })
                }
                size={20}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 评价内容 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-2 block">
          评价内容 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("content")}
          placeholder="分享您的真实体验：时效、包装、客服响应、丢件情况等。至少 10 字。"
          rows={6}
        />
        {errors.content && (
          <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
        )}
      </div>

      {/* 使用场景 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Label className="mb-3 block">使用场景（可选）</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs text-gray-500">寄送品类</Label>
            <Input {...register("scenario")} placeholder="如：食品、衣物、电子产品" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-gray-500">线路</Label>
            <Input {...register("route")} placeholder="如：上海 → 法兰克福" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-gray-500">实际重量 (kg)</Label>
            <Input type="number" step="0.1" {...register("weight", { valueAsNumber: true })} />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-gray-500">实际花费 (¥)</Label>
            <Input type="number" step="0.01" {...register("cost", { valueAsNumber: true })} />
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          图片上传功能在 MVP 阶段需接入对象存储（Cloudflare R2 / S3），暂未开放。
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
          提交评价
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
