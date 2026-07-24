"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeAdminActionsProps {
  codeId: string;
  currentStatus: string;
}

export function CodeAdminActions({
  codeId,
  currentStatus,
}: CodeAdminActionsProps) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  const update = async (status: "ACTIVE" | "EXPIRED" | "REMOVED") => {
    setActing(status);
    try {
      const res = await fetch(`/api/admin/codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "操作失败");
        return;
      }
      router.refresh();
    } catch {
      alert("网络错误");
    } finally {
      setActing(null);
    }
  };

  const remove = async () => {
    if (!confirm("确定要彻底删除该优惠码？此操作不可恢复。")) return;
    setActing("DELETE");
    try {
      const res = await fetch(`/api/admin/codes/${codeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "删除失败");
        return;
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
      {currentStatus !== "ACTIVE" && (
        <Button
          size="sm"
          onClick={() => update("ACTIVE")}
          disabled={acting !== null}
        >
          {acting === "ACTIVE" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          标为有效
        </Button>
      )}
      {currentStatus !== "EXPIRED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update("EXPIRED")}
          disabled={acting !== null}
        >
          {acting === "EXPIRED" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <X size={14} />
          )}
          标为失效
        </Button>
      )}
      {currentStatus !== "REMOVED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update("REMOVED")}
          disabled={acting !== null}
        >
          {acting === "REMOVED" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          隐藏
        </Button>
      )}
      <Button
        size="sm"
        variant="danger"
        onClick={remove}
        disabled={acting !== null}
      >
        {acting === "DELETE" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        删除
      </Button>
    </div>
  );
}
