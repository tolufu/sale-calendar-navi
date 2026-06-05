"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { ComponentType } from "react";
import { CalendarDays, Heart, History, Home, Plus, Search } from "lucide-react";

type MobileNavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

function MobileNavLink({ item, active }: { item: MobileNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-btn px-1 text-[11px] font-semibold transition",
        active ? "text-accent" : "text-muted hover:text-accent"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

const navItems = [
  { href: "/calendar", label: "カレンダー" },
  { href: "/compare", label: "価格比較" },
  { href: "/wishlist", label: "欲しいもの" },
  { href: "/history", label: "履歴" },
  { href: "/articles", label: "記事" },
  { href: "/settings/notifications", label: "通知" }
];

const mobileNavLeft = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays }
];

const mobileNavRight = [
  { href: "/compare", label: "比較", icon: Search },
  { href: "/wishlist", label: "欲しいもの", icon: Heart },
  { href: "/history", label: "履歴", icon: History }
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-accent text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            セールカレンダー比較ナビ
          </Link>
          <nav className="ml-2 hidden flex-wrap items-center gap-1 text-sm md:flex" aria-label="主要ナビゲーション">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "rounded-btn px-3 py-2 font-medium transition",
                    active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/compare"
              aria-label="参考価格を比較"
              className="hidden items-center gap-2 rounded-btn bg-white/15 px-3 py-2 text-sm text-white/90 hover:bg-white/25 sm:flex"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span>価格比較</span>
            </Link>
            <Link
              href="/wishlist/new"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-btn bg-cta px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ctaDark"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">欲しいものを登録</span>
              <span className="sm:hidden">登録</span>
            </Link>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-soft backdrop-blur md:hidden"
        aria-label="主要ナビゲーション"
      >
        <div className="mx-auto grid max-w-md grid-cols-6 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {mobileNavLeft.map((item) => (
            <MobileNavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
          ))}
          <div className="flex justify-center">
            <Link
              href="/wishlist/new"
              aria-label="欲しいものを登録"
              className="-mt-7 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-cta text-white shadow-soft ring-4 ring-white transition hover:bg-ctaDark"
            >
              <Plus className="h-6 w-6" aria-hidden />
              <span className="text-[10px] font-semibold leading-none">登録</span>
            </Link>
          </div>
          {mobileNavRight.map((item) => (
            <MobileNavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}
