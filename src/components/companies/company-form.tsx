"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CompanyFormProps {
  mode: "create" | "edit";
  companyId?: string;
  initial?: {
    name?: string;
    logo?: string | null;
    website?: string | null;
    intro?: string | null;
    foundedYear?: number | null;
    phone?: string | null;
    wechat?: string | null;
    email?: string | null;
    origins?: string[];
    destinations?: string[];
    serviceTypes?: string[];
  };
}

const serviceTypeOptions = [
  { value: "AIR", label: "空运" },
  { value: "SEA", label: "海运" },
  { value: "RAIL", label: "铁运" },
  { value: "SPECIAL", label: "专线" },
];

const commonOrigins = ["上海", "广州", "深圳", "北京", "杭州", "成都", "重庆", "青岛"];
const commonDestinations = [
  "法兰克福",
  "柏林",
  "慕尼黑",
  "汉堡",
  "科隆",
  "杜塞尔多夫",
  "斯图加特",
];

export function CompanyForm({ mode, companyId, initial }: CompanyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    logo: initial?.logo ?? "",
    website: initial?.website ?? "",
    intro: initial?.intro ?? "",
    foundedYear: initial?.foundedYear ?? "",
    phone: initial?.phone ?? "",
    wechat: initial?.wechat ?? "",
    email: initial?.email ?? "",
  });
  const [origins, setOrigins] = useState<string[]>(initial?.origins ?? []);
  const [destinations, setDestinations] = useState<string[]>(
    initial?.destinations ?? [],
  );
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    initial?.serviceTypes ?? [],
  );
  const [customOrigin, setCustomOrigin] = useState("");
  const [customDest, setCustomDest] = useState("");

  const toggle = (
    list: string[],
    value: string,
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (origins.length === 0) {
      setError("请至少选择一个起运地");
      return;
    }
    if (destinations.length === 0) {
      setError("请至少选择一个目的地");
      return;
    }
    if (serviceTypes.length === 0) {
      setError("请至少选择一种服务类型");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        foundedYear: form.foundedYear
          ? Number(form.foundedYear)
          : undefined,
        origins,
        destinations,
        serviceTypes,
      };
      const url =
        mode === "create"
          ? "/api/companies"
          : `/api/companies/${companyId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "提交失败");
        return;
      }
      if (mode === "create") {
        router.push(`/merchant/companies/${json.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          基本信息
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              公司名 <span className="text-brand-500">*</span>
            </Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：华德福物流"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foundedYear">成立年份</Label>
            <Input
              id="foundedYear"
              type="number"
              min={1990}
              max={new Date().getFullYear()}
              value={form.foundedYear}
              onChange={(e) =>
                setForm({ ...form, foundedYear: e.target.value })
              }
              placeholder="如：2018"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              type="url"
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">官网</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="intro">公司简介</Label>
            <Textarea
              id="intro"
              rows={3}
              maxLength={2000}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
              placeholder="简要介绍公司业务、特色等"
            />
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          联系方式
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">电话</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+49 ..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wechat">微信号</Label>
            <Input
              id="wechat"
              value={form.wechat}
              onChange={(e) => setForm({ ...form, wechat: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 服务范围 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          服务范围
        </h2>

        <div className="mb-4">
          <Label className="mb-2 block">
            服务类型 <span className="text-brand-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {serviceTypeOptions.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggle(serviceTypes, t.value, setServiceTypes)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  serviceTypes.includes(t.value)
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">
            起运地 <span className="text-brand-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {commonOrigins.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => toggle(origins, o, setOrigins)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  origins.includes(o)
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={customOrigin}
              onChange={(e) => setCustomOrigin(e.target.value)}
              placeholder="自定义城市"
              className="h-9 max-w-[200px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (customOrigin.trim() && !origins.includes(customOrigin.trim())) {
                  setOrigins([...origins, customOrigin.trim()]);
                  setCustomOrigin("");
                }
              }}
            >
              添加
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">
            目的地 <span className="text-brand-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {commonDestinations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(destinations, d, setDestinations)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  destinations.includes(d)
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              placeholder="自定义城市"
              className="h-9 max-w-[200px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (customDest.trim() && !destinations.includes(customDest.trim())) {
                  setDestinations([...destinations, customDest.trim()]);
                  setCustomDest("");
                }
              }}
            >
              添加
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "创建公司" : "保存修改"}
        </Button>
      </div>
    </form>
  );
}
