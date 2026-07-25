"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResendVerificationButtonProps {
  emailConfigured: boolean;
}

export function ResendVerificationButton({
  emailConfigured,
}: ResendVerificationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "发送失败");
        return;
      }
      setMessage(json.message ?? "验证邮件已发送");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
        ✓ {message}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleResend}
        disabled={loading}
        className="h-7 px-2 text-xs"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Mail size={12} />
        )}
        重新发送验证邮件
      </Button>
      {error && <span className="text-xs text-brand-500">{error}</span>}
      {!emailConfigured && (
        <span className="text-xs text-gray-400">
          （未配置邮件服务，请联系管理员）
        </span>
      )}
    </div>
  );
}
