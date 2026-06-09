import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "セールカレンダー比較ナビ",
    template: "%s | セールカレンダー比較ナビ"
  },
  description: "セール予定と欲しいものメモをまとめて管理するWebアプリです。価格は手入力で保存します。",
  openGraph: {
    title: "セールカレンダー比較ナビ",
    description: "セール予定、欲しい商品URL、希望価格、実質価格メモを整理できます。",
    images: ["/images/placeholders/og-sale-calendar.svg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-[calc(100vh-180px)] max-w-6xl px-4 pb-24 pt-8 md:pb-8">{children}</main>
        <SiteFooter />
        {/* Vercel Web Analytics（Cookieレス）。Vercel管理画面でAnalyticsをONにすると計測開始。 */}
        <Analytics />
      </body>
    </html>
  );
}
