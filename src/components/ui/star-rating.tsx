import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

// 只读星级展示
export function StarRating({
  value,
  max = 5,
  size = 16,
  className,
  showValue = false,
}: StarRatingProps) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex">
        {Array.from({ length: max }).map((_, i) => {
          const isFull = i < full;
          const isHalf = i === full && hasHalf;
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              <Star
                size={size}
                className="absolute inset-0 text-gray-300"
                fill="currentColor"
              />
              {(isFull || isHalf) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isHalf ? size / 2 : size }}
                >
                  <Star
                    size={size}
                    className="text-gold-400"
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}

// 可交互星级评分（受控）
interface StarInputProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: number;
  className?: string;
}

export function StarInput({
  value,
  onChange,
  max = 5,
  size = 24,
  className,
}: StarInputProps) {
  return (
    <span className={cn("inline-flex", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} 星`}
          >
            <Star
              size={size}
              className={active ? "text-gold-400" : "text-gray-300"}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </span>
  );
}
