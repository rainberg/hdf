import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut, LayoutDashboard, Store } from "lucide-react";

const navLinks = [
  { href: "/companies", label: "转运公司" },
  { href: "/codes", label: "优惠码" },
  { href: "/phone-plans", label: "电话套餐" },
];

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-red-600">华德福</span>
          <span className="hidden text-xs text-gray-500 sm:inline">
            在德华人生活指南
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-red-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="搜索"
          >
            <Search size={20} />
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              {(session.user.role === "ADMIN" ||
                session.user.role === "MERCHANT") && (
                <Link
                  href={
                    session.user.role === "ADMIN" ? "/admin" : "/merchant"
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="后台"
                >
                  {session.user.role === "ADMIN" ? (
                    <LayoutDashboard size={20} />
                  ) : (
                    <Store size={20} />
                  )}
                </Link>
              )}
              <Link
                href="/me"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                aria-label="个人中心"
              >
                <User size={20} />
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="退出登录"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 移动端导航 */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
