"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReplyForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 2) {
      setError("回复内容至少 2 字");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/merchant/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "回复失败");
        return;
      }
      setDone(true);
      setReply("");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="text-xs text-green-600">已回复</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <Textarea
        rows={2}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="以商家身份回复这条评价…"
        className="text-sm"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 size={14} className="animate-spin" />}
          回复
        </Button>
      </div>
    </form>
  );
}
