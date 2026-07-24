"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MerchantActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  const act = async (action: "approve" | "reject") => {
    setActing(action);
    try {
      const res = await fetch(`/api/admin/merchants/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "APPROVED" : "REJECTED",
        }),
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

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => act("approve")}
        disabled={acting !== null}
      >
        {acting === "approve" ? (
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
    </div>
  );
}
