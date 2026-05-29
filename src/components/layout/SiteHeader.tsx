import Link from "next/link";

const navItems = [
  { href: "/calendar", label: "カレンダー" },
  { href: "/wishlist", label: "欲しいもの" },
  { href: "/history", label: "履歴" },
  { href: "/articles", label: "記事" },
  { href: "/settings/notifications", label: "通知" }
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-bold text-ink">
          セールカレンダー比較ナビ
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-muted hover:bg-surface hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
