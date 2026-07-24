"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const serviceTypes = [
  { value: "", label: "全部" },
  { value: "AIR", label: "空运" },
  { value: "SEA", label: "海运" },
  { value: "RAIL", label: "铁运" },
  { value: "SPECIAL", label: "专线" },
];

const sorts = [
  { value: "rating", label: "评分最高" },
  { value: "reviews", label: "评价最多" },
  { value: "newest", label: "最新入驻" },
];

export function CompanyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/companies?${params.toString()}`);
    },
    [router, searchParams],
  );

  const currentServiceType = searchParams.get("serviceType") ?? "";
  const currentSort = searchParams.get("sort") ?? "rating";
  const verifiedOnly = searchParams.get("verified") === "true";

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <div className="mb-2 text-xs font-medium text-gray-500">服务类型</div>
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateParam("serviceType", t.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                currentServiceType === t.value
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-gray-500">排序</div>
        <div className="flex flex-wrap gap-2">
          {sorts.map((s) => (
            <button
              key={s.value}
              onClick={() => updateParam("sort", s.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                currentSort === s.value
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => updateParam("verified", e.target.checked ? "true" : "")}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          仅看官方认证
        </label>
      </div>
    </div>
  );
}
