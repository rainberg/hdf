"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  const act = async (action: "publish" | "reject" | "delete") => {
    setActing(action);
    try {
      if (action === "delete") {
        if (!confirm("确定要删除该评价吗？删除将扣减发布者信用分 5 分。")) {
          setActing(null);
          return;
        }
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json();
          alert(json.error ?? "删除失败");
          return;
        }
      } else {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "publish" ? "PUBLISHED" : "REJECTED",
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          alert(json.error ?? "操作失败");
          return;
        }
      }
      router.refresh();
    } catch {
      alert("网络错误");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        onClick={() => act("publish")}
        disabled={acting !== null}
      >
        {acting === "publish" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Check size={14} />
        )}
        通过
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => act("reject")}
        disabled={acting !== null}
      >
        {acting === "reject" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <X size={14} />
        )}
        拒绝
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => act("delete")}
        disabled={acting !== null}
      >
        {acting === "delete" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        删除
      </Button>
    </div>
  );
}
