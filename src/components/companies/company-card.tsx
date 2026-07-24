import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatRMB, safeParseJson } from "@/lib/utils";
import { CheckCircle2, MessageSquare } from "lucide-react";

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    intro?: string | null;
    verified: boolean;
    ratingAvg: number;
    reviewCount: number;
    origins: string;
    destinations: string;
    serviceTypes: string;
    quotes?: Array<{ firstWeightPrice: number }>;
  };
}

const serviceTypeLabels: Record<string, string> = {
  AIR: "空运",
  SEA: "海运",
  RAIL: "铁运",
  SPECIAL: "专线",
};

export function CompanyCard({ company }: CompanyCardProps) {
  const origins = safeParseJson<string[]>(company.origins, []);
  const destinations = safeParseJson<string[]>(company.destinations, []);
  const serviceTypes = safeParseJson<string[]>(company.serviceTypes, []);
  const startingPrice = company.quotes?.[0]?.firstWeightPrice;

  return (
    <Link
      href={`/companies/${company.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xl font-bold text-red-600">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt={company.name} className="h-full w-full rounded-lg object-cover" />
          ) : (
            company.name.slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-red-600">
              {company.name}
            </h3>
            {company.verified && (
              <CheckCircle2 size={16} className="shrink-0 text-blue-500" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <StarRating value={company.ratingAvg} showValue />
            <span className="text-gray-400">·</span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              <MessageSquare size={14} />
              {company.reviewCount} 条评价
            </span>
          </div>
          {company.intro && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-500">
              {company.intro}
            </p>
          )}
        </div>
        {startingPrice !== undefined && (
          <div className="shrink-0 text-right">
            <div className="text-xs text-gray-400">起步价</div>
            <div className="text-lg font-bold text-red-600">
              {formatRMB(startingPrice)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {serviceTypes.map((t) => (
          <Badge key={t} variant="red">
            {serviceTypeLabels[t] ?? t}
          </Badge>
        ))}
        {origins.slice(0, 2).map((o) => (
          <Badge key={`o-${o}`} variant="outline">
            {o}
          </Badge>
        ))}
        {destinations.slice(0, 2).map((d) => (
          <Badge key={`d-${d}`} variant="outline">
            → {d}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
