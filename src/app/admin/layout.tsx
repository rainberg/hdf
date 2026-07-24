import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LayoutDashboard, Star, Users, Store, Ticket } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/reviews", label: "评价审核", icon: Star },
  { href: "/admin/merchants", label: "商家申请", icon: Store },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/codes", label: "优惠码管理", icon: Ticket },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">运营后台</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理评价审核、商家入驻、用户与数据统计
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 lg:flex-col">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-red-600"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
