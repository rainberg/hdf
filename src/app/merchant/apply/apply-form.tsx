"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InitialProfile {
  businessName: string;
  businessLicense: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
}

export function MerchantApplyForm({
  initialProfile,
}: {
  initialProfile: InitialProfile | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    businessName: initialProfile?.businessName ?? "",
    businessLicense: initialProfile?.businessLicense ?? "",
    contactEmail: initialProfile?.contactEmail ?? "",
    contactPhone: initialProfile?.contactPhone ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/merchant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "提交失败，请重试");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.refresh(), 1500);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 已有审核中的申请
  if (initialProfile?.status === "PENDING") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Clock className="text-amber-500" size={48} />
          <h3 className="text-lg font-semibold text-gray-900">
            申请审核中
          </h3>
          <p className="text-sm text-gray-500">
            您的商家入驻申请已提交，平台将在 1-3 个工作日内审核。
          </p>
        </CardContent>
      </Card>
    );
  }

  // 已被拒绝，显示提示并允许重新申请
  const rejected = initialProfile?.status === "REJECTED";

  return (
    <>
      {rejected && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>上次的申请未通过审核。请检查信息后重新提交。</p>
        </div>
      )}

      {success && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="text-green-500" size={48} />
            <h3 className="text-lg font-semibold text-gray-900">
              申请提交成功
            </h3>
            <p className="text-sm text-gray-500">
              平台将在 1-3 个工作日内审核，通过后即可使用商家中心。
            </p>
          </CardContent>
        </Card>
      )}

      {!success && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  商家/公司名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  placeholder="如：华点物流 GmbH"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessLicense">营业执照编号（选填）</Label>
                <Input
                  id="businessLicense"
                  value={form.businessLicense}
                  onChange={(e) =>
                    setForm({ ...form, businessLicense: e.target.value })
                  }
                  placeholder="德国 HRB 编号或中国营业执照号"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">
                  联系邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">联系电话（选填）</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  placeholder="+49 ..."
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {rejected ? "重新提交申请" : "提交申请"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
