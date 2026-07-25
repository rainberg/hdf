"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRMB } from "@/lib/utils";
import { QuoteForm } from "./quote-form";

interface Quote {
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
  active: boolean;
}

const serviceTypeLabels: Record<string, string> = {
  AIR: "空运",
  SEA: "海运",
  RAIL: "铁运",
  SPECIAL: "专线",
};

export function QuoteManager({
  companyId,
  quotes,
}: {
  companyId: string;
  quotes: Quote[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (quoteId: string) => {
    if (!confirm("确定要删除这条报价吗？")) return;
    setDeleting(quoteId);
    try {
      const res = await fetch(
        `/api/companies/${companyId}/quotes/${quoteId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error ?? "删除失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          报价管理（{quotes.length} 条）
        </h2>
        <Button
          size="sm"
          onClick={() => {
            setShowAdd((v) => !v);
            setEditingId(null);
          }}
        >
          {showAdd ? (
            <>
              <X size={14} /> 关闭
            </>
          ) : (
            <>
              <Plus size={14} /> 添加报价
            </>
          )}
        </Button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-medium text-gray-900">新增报价</h3>
          <QuoteForm
            companyId={companyId}
            onDone={() => {
              setShowAdd(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          暂无报价，点击「添加报价」开始创建。
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {q.channelName}
                    </span>
                    <Badge variant="brand">
                      {serviceTypeLabels[q.serviceType] ?? q.serviceType}
                    </Badge>
                    {!q.active && <Badge variant="outline">已下架</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {q.origin} → {q.destination} · {q.estDaysMin}-
                    {q.estDaysMax} 天
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(editingId === q.id ? null : q.id);
                      setShowAdd(false);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                    aria-label="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    disabled={deleting === q.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
                    aria-label="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
                <div className="rounded bg-gray-50 px-2 py-1">
                  <span className="text-gray-400">首重</span>{" "}
                  {q.firstWeightKg}kg = {formatRMB(q.firstWeightPrice)}
                </div>
                <div className="rounded bg-gray-50 px-2 py-1">
                  <span className="text-gray-400">续重</span> +{q.continueWeightKg}kg = {formatRMB(q.continueWeightPrice)}
                </div>
              </div>

              {q.restrictions && (
                <p className="mt-2 text-xs text-gold-600">
                  限制：{q.restrictions}
                </p>
              )}

              {editingId === q.id && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    编辑报价
                  </h4>
                  <QuoteForm
                    companyId={companyId}
                    quote={q}
                    onDone={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
