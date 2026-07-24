"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  creditScore: number;
}

export function UserActions({
  userId,
  currentRole,
  creditScore,
}: UserActionsProps) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  const update = async (data: { role?: string; creditScore?: number }) => {
    setActing(JSON.stringify(data));
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    <div className="flex flex-wrap gap-2">
      {currentRole === "USER" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update({ role: "MERCHANT" })}
          disabled={acting !== null}
        >
          {acting === '{"role":"MERCHANT"}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          设为商家
        </Button>
      )}
      {currentRole === "MERCHANT" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update({ role: "USER" })}
          disabled={acting !== null}
        >
          {acting === '{"role":"USER"}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          降为普通
        </Button>
      )}
      {currentRole !== "ADMIN" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update({ role: "ADMIN" })}
          disabled={acting !== null}
        >
          {acting === '{"role":"ADMIN"}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          设为管理员
        </Button>
      )}
      {creditScore > 0 && (
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (confirm("确定要将信用分清零？该用户将被限制发布评价。")) {
              update({ creditScore: 0 });
            }
          }}
          disabled={acting !== null}
        >
          {acting === '{"creditScore":0}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          封禁(清零信用)
        </Button>
      )}
    </div>
  );
}
