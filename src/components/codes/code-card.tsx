"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { creditLevel } from "@/lib/utils";
import { Copy, Check, ThumbsUp, ThumbsDown, ExternalLink, Clock } from "lucide-react";

interface CodeCardProps {
  code: {
    id: string;
    type: string;
    platform: string;
    platformCategory: string;
    benefitDescription: string;
    codeValue?: string | null;
    link?: string | null;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    upvotes: number;
    downvotes: number;
    hasReferral: boolean;
    createdAt: string | Date;
    user: { nickname: string; creditScore: number };
  };
}

const typeLabels: Record<string, string> = {
  INVITE: "邀请码",
  DISCOUNT: "打折码",
  REFERRAL: "返利链接",
};

const categoryLabels: Record<string, string> = {
  ecommerce: "电商",
  streaming: "流媒体",
  tool: "工具软件",
  transport: "转运",
  telecom: "通信",
  other: "其他",
};

export function CodeCard({ code }: CodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [voteState, setVoteState] = useState<"up" | "down" | null>(null);
  const [counts, setCounts] = useState({
    upvotes: code.upvotes,
    downvotes: code.downvotes,
  });

  const credit = creditLevel(code.user.creditScore);
  // 时间相关计算放进 useState 初始化器，避免 React Compiler 视为 render 期副作用
  const [{ isExpired, daysLeft }] = useState(() => {
    if (!code.validUntil) return { isExpired: false, daysLeft: null };
    const until = new Date(code.validUntil);
    const now = Date.now();
    return {
      isExpired: until.getTime() < now,
      daysLeft: Math.ceil((until.getTime() - now) / (1000 * 60 * 60 * 24)),
    };
  });

  const copyCode = async () => {
    if (!code.codeValue) return;
    try {
      await navigator.clipboard.writeText(code.codeValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const vote = async (value: 1 | -1) => {
    const newState = value === 1 ? "up" : "down";
    if (voteState === newState) {
      // 取消
      setVoteState(null);
      setCounts((c) => ({
        upvotes: c.upvotes - (value === 1 ? 1 : 0),
        downvotes: c.downvotes - (value === -1 ? 1 : 0),
      }));
    } else {
      // 翻转/新增
      const prev = voteState;
      setVoteState(newState);
      setCounts((c) => ({
        upvotes:
          c.upvotes +
          (value === 1 ? 1 : 0) -
          (prev === "up" ? 1 : 0),
        downvotes:
          c.downvotes +
          (value === -1 ? 1 : 0) -
          (prev === "down" ? 1 : 0),
      }));
    }
    try {
      await fetch(`/api/codes/${code.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
    } catch {
      // 静默失败，前端已乐观更新
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="red">{typeLabels[code.type] ?? code.type}</Badge>
            <Badge variant="outline">
              {categoryLabels[code.platformCategory] ?? code.platformCategory}
            </Badge>
            <span className="font-semibold text-gray-900">{code.platform}</span>
            {code.hasReferral && (
              <Badge variant="amber">含返利</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {code.benefitDescription}
          </p>
        </div>
        {code.validUntil && (
          <div className="shrink-0 text-right">
            {isExpired ? (
              <Badge variant="default">已过期</Badge>
            ) : (
              <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {daysLeft === 0 ? "今日截止" : `剩 ${daysLeft} 天`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 码值/链接 */}
      <div className="mt-4 flex items-center gap-2">
        {code.codeValue && (
          <div className="flex flex-1 items-center justify-between rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
            <code className="font-mono text-sm text-gray-800">
              {code.codeValue}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyCode}
              className="h-8 gap-1"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={14} />
                  复制
                </>
              )}
            </Button>
          </div>
        )}
        {code.link && (
          <Button asChild size="sm" variant="outline">
            <a href={code.link} target="_blank" rel="noopener noreferrer nofollow">
              <ExternalLink size={14} />
              打开链接
            </a>
          </Button>
        )}
      </div>

      {/* 底部：发布者 + 投票 */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="text-xs text-gray-500">
          由 <span className="font-medium text-gray-700">{code.user.nickname}</span>
          <span className={`ml-1 ${credit.color}`}>· {credit.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => vote(1)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              voteState === "up"
                ? "bg-green-100 text-green-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <ThumbsUp size={12} />
            {counts.upvotes}
          </button>
          <button
            onClick={() => vote(-1)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              voteState === "down"
                ? "bg-red-100 text-red-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <ThumbsDown size={12} />
            {counts.downvotes}
          </button>
        </div>
      </div>
    </div>
  );
}
