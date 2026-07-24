import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { relativeTime, safeParseJson, creditLevel } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

export interface ReviewItem {
  id: string;
  overallRating: number;
  dimensions: string;
  content: string;
  images: string;
  recommend: boolean;
  scenario?: string | null;
  route?: string | null;
  weight?: number | null;
  cost?: number | null;
  likes: number;
  createdAt: string | Date;
  merchantReply?: string | null;
  user: {
    nickname: string;
    avatar?: string | null;
    creditScore: number;
  };
}

const dimensionLabels: Record<string, string> = {
  price: "价格",
  speed: "时效",
  package: "包装",
  service: "客服",
  loss: "丢件率",
  customs: "清关",
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        暂无评价，成为第一个评价的人吧。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const dimensions = safeParseJson<Record<string, number>>(
    review.dimensions,
    {},
  );
  const images = safeParseJson<string[]>(review.images, []);
  const credit = creditLevel(review.user.creditScore);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {review.user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.avatar}
              alt={review.user.nickname}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            review.user.nickname.slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {review.user.nickname}
            </span>
            <Badge variant="outline" className={credit.color}>
              {credit.label}
            </Badge>
            <span className="text-xs text-gray-400">
              {relativeTime(review.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.overallRating} size={14} />
            {review.recommend ? (
              <span className="text-xs text-green-600">推荐</span>
            ) : (
              <span className="text-xs text-gray-400">不推荐</span>
            )}
          </div>
        </div>
      </div>

      {/* 多维度评分 */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(dimensionLabels).map(([key, label]) => (
          <div
            key={key}
            className="rounded-md bg-gray-50 px-2 py-1.5 text-center"
          >
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm font-semibold text-gray-900">
              {dimensions[key] ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {/* 内容 */}
      <p className="prose-review mt-4 text-sm text-gray-700">{review.content}</p>

      {/* 图片 */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`评价图片 ${i + 1}`}
              className="h-20 w-20 rounded-md border border-gray-200 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* 元信息 */}
      {(review.scenario || review.route || review.weight || review.cost) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          {review.scenario && <Badge>品类：{review.scenario}</Badge>}
          {review.route && <Badge>线路：{review.route}</Badge>}
          {review.weight && <Badge>重量：{review.weight}kg</Badge>}
          {review.cost && <Badge>花费：¥{review.cost}</Badge>}
        </div>
      )}

      {/* 商家回复 */}
      {review.merchantReply && (
        <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm">
          <div className="mb-1 font-medium text-blue-700">商家回复</div>
          <p className="text-blue-900">{review.merchantReply}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp size={14} />
          {review.likes} 有用
        </span>
      </div>
    </article>
  );
}
