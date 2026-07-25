"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  creditScore: number;
  currentStatus: string;
}

export function UserActions({
  userId,
  currentRole,
  creditScore,
  currentStatus,
}: UserActionsProps) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  const update = async (data: {
    role?: string;
    creditScore?: number;
    status?: string;
  }) => {
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

  const isBanned = currentStatus === "BANNED";

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

      {/* 信用分微调 */}
      {creditScore > 0 && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update({ creditScore: Math.max(0, creditScore - 10) })}
            disabled={acting !== null || creditScore < 10}
            title="信用分 -10"
          >
            {acting === `{"creditScore":${Math.max(0, creditScore - 10)}}` ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            -10 信用
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update({ creditScore: Math.min(100, creditScore + 10) })}
            disabled={acting !== null || creditScore >= 100}
            title="信用分 +10"
          >
            {acting === `{"creditScore":${Math.min(100, creditScore + 10)}}` ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            +10 信用
          </Button>
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
            清零信用
          </Button>
        </>
      )}

      {/* 封禁/启用 */}
      {currentRole !== "ADMIN" && !isBanned && (
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (confirm("确定要封禁该用户？封禁后无法登录。")) {
              update({ status: "BANNED" });
            }
          }}
          disabled={acting !== null}
        >
          {acting === '{"status":"BANNED"}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          封禁
        </Button>
      )}
      {isBanned && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update({ status: "ACTIVE" })}
          disabled={acting !== null}
        >
          {acting === '{"status":"ACTIVE"}' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          启用
        </Button>
      )}
    </div>
  );
}
