import Link from "next/link";
import { CalendarDays, FileText, Heart, History, Home } from "lucide-react";

const navItems = [
  { href: "/calendar", label: "カレンダー" },
  { href: "/wishlist", label: "欲しいもの" },
  { href: "/history", label: "履歴" },
  { href: "/articles", label: "記事" },
  { href: "/settings/notifications", label: "通知" }
];

const mobileNavItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/wishlist", label: "欲しいもの", icon: Heart },
  { href: "/history", label: "履歴", icon: History },
  { href: "/articles", label: "記事", icon: FileText }
];

export function SiteHeader() {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-ink">
            セールカレンダー比較ナビ
          </Link>
          <nav className="hidden flex-wrap gap-2 text-sm md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-muted hover:bg-surface hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-soft backdrop-blur md:hidden" aria-label="主要ナビゲーション">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold text-muted hover:bg-surface hover:text-accent"
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
