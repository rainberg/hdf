"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QuoteFormProps {
  companyId: string;
  quote?: {
    id: string;
    channelName: string;
    serviceType: string;
    origin: string;
    destination: string;
    firstWeightKg: number;
    firstWeightPrice: number;
    continueWeightKg: number;
    continueWeightPrice: number;
    estDaysMin: number;
    estDaysMax: number;
    restrictions: string | null;
  };
  onDone?: () => void;
}

const serviceTypeOptions = [
  { value: "AIR", label: "空运" },
  { value: "SEA", label: "海运" },
  { value: "RAIL", label: "铁运" },
  { value: "SPECIAL", label: "专线" },
];

export function QuoteForm({ companyId, quote, onDone }: QuoteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!quote;
  const [form, setForm] = useState({
    channelName: quote?.channelName ?? "",
    serviceType: quote?.serviceType ?? "AIR",
    origin: quote?.origin ?? "",
    destination: quote?.destination ?? "",
    firstWeightKg: quote?.firstWeightKg?.toString() ?? "1",
    firstWeightPrice: quote?.firstWeightPrice?.toString() ?? "",
    continueWeightKg: quote?.continueWeightKg?.toString() ?? "1",
    continueWeightPrice: quote?.continueWeightPrice?.toString() ?? "",
    estDaysMin: quote?.estDaysMin?.toString() ?? "",
    estDaysMax: quote?.estDaysMax?.toString() ?? "",
    restrictions: quote?.restrictions ?? "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        channelName: form.channelName,
        serviceType: form.serviceType,
        origin: form.origin,
        destination: form.destination,
        firstWeightKg: Number(form.firstWeightKg),
        firstWeightPrice: Number(form.firstWeightPrice),
        continueWeightKg: Number(form.continueWeightKg),
        continueWeightPrice: Number(form.continueWeightPrice),
        estDaysMin: Number(form.estDaysMin),
        estDaysMax: Number(form.estDaysMax),
        restrictions: form.restrictions || undefined,
      };
      const url = isEdit
        ? `/api/companies/${companyId}/quotes/${quote!.id}`
        : `/api/companies/${companyId}/quotes`;
      const method = isEdit ? "PUT" : "POST";
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
      if (onDone) onDone();
      else router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="channelName">
            渠道名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="channelName"
            required
            value={form.channelName}
            onChange={(e) =>
              setForm({ ...form, channelName: e.target.value })
            }
            placeholder="如：经济空运"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceType">服务类型</Label>
          <select
            id="serviceType"
            value={form.serviceType}
            onChange={(e) =>
              setForm({ ...form, serviceType: e.target.value })
            }
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {serviceTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origin">
            起运地 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="origin"
            required
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            placeholder="如：上海"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination">
            目的地 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="destination"
            required
            value={form.destination}
            onChange={(e) =>
              setForm({ ...form, destination: e.target.value })
            }
            placeholder="如：法兰克福"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="firstWeightKg">首重 (kg)</Label>
          <Input
            id="firstWeightKg"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.firstWeightKg}
            onChange={(e) =>
              setForm({ ...form, firstWeightKg: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="firstWeightPrice">首重价 (¥)</Label>
          <Input
            id="firstWeightPrice"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.firstWeightPrice}
            onChange={(e) =>
              setForm({ ...form, firstWeightPrice: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="continueWeightKg">续重单位 (kg)</Label>
          <Input
            id="continueWeightKg"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.continueWeightKg}
            onChange={(e) =>
              setForm({ ...form, continueWeightKg: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="continueWeightPrice">续重单价 (¥)</Label>
          <Input
            id="continueWeightPrice"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.continueWeightPrice}
            onChange={(e) =>
              setForm({ ...form, continueWeightPrice: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estDaysMin">最短天数</Label>
          <Input
            id="estDaysMin"
            type="number"
            min="0"
            required
            value={form.estDaysMin}
            onChange={(e) =>
              setForm({ ...form, estDaysMin: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estDaysMax">最长天数</Label>
          <Input
            id="estDaysMax"
            type="number"
            min="0"
            required
            value={form.estDaysMax}
            onChange={(e) =>
              setForm({ ...form, estDaysMax: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="restrictions">限制/备注</Label>
          <Textarea
            id="restrictions"
            rows={2}
            value={form.restrictions}
            onChange={(e) =>
              setForm({ ...form, restrictions: e.target.value })
            }
            placeholder="如：禁运电池、最大重量 30kg 等"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "保存修改" : "添加报价"}
        </Button>
      </div>
    </form>
  );
}
