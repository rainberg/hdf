import { Badge } from "@/components/ui/badge";
import { formatRMB } from "@/lib/utils";

interface QuoteTableProps {
  quotes: Array<{
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
    restrictions?: string | null;
  }>;
}

const serviceTypeLabels: Record<string, string> = {
  AIR: "空运",
  SEA: "海运",
  RAIL: "铁运",
  SPECIAL: "专线",
};

const serviceTypeVariants: Record<string, "red" | "blue" | "green" | "amber"> = {
  AIR: "blue",
  SEA: "green",
  RAIL: "amber",
  SPECIAL: "red",
};

export function QuoteTable({ quotes }: QuoteTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        该公司暂未上传报价，请联系商家或参考评价获取最新价格。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">渠道</th>
            <th className="px-4 py-3 text-left">类型</th>
            <th className="px-4 py-3 text-left">线路</th>
            <th className="px-4 py-3 text-right">首重</th>
            <th className="px-4 py-3 text-right">续重</th>
            <th className="px-4 py-3 text-right">时效</th>
            <th className="px-4 py-3 text-left">限制</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {quotes.map((q) => (
            <tr key={q.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {q.channelName}
              </td>
              <td className="px-4 py-3">
                <Badge variant={serviceTypeVariants[q.serviceType] ?? "default"}>
                  {serviceTypeLabels[q.serviceType] ?? q.serviceType}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {q.origin} → {q.destination}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="font-semibold text-red-600">
                  {formatRMB(q.firstWeightPrice)}
                </div>
                <div className="text-xs text-gray-400">
                  / {q.firstWeightKg}kg
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="text-gray-700">
                  {formatRMB(q.continueWeightPrice)}
                </div>
                <div className="text-xs text-gray-400">
                  / {q.continueWeightKg}kg
                </div>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {q.estDaysMin}-{q.estDaysMax} 天
              </td>
              <td className="max-w-[200px] px-4 py-3 text-xs text-gray-500">
                {q.restrictions || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
