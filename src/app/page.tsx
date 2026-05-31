import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Heart, JapaneseYen, LinkIcon, NotebookPen, Tag } from "lucide-react";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { getMerchantToneClass } from "@/lib/utils/merchant";

export const metadata = buildPageMetadata({
  title: "セール予定と買い物メモをひとつに",
  description: "Amazon・楽天・Yahoo!ショッピングのセール予定を起点に、商品URL、希望価格、実質価格メモを手入力で保存できます。",
  path: "/"
});

export default function HomePage() {
  const featuredSales = saleEvents.slice(0, 3);
  const featuredArticles = articles.slice(0, 3);
  const merchantById = new Map(merchants.map((merchant) => [merchant.merchantId, merchant]));

  return (
    <div className="space-y-10">
      {/* ヒーロー: 大きな青見出し＋説明＋青/オレンジCTA */}
      <section className="overflow-hidden rounded-card border border-line bg-gradient-to-br from-accentSoft via-white to-surface shadow-card">
        <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              手入力でかしこく管理
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-accent sm:text-4xl">
              セール時期を見逃さず、
              <br className="hidden sm:block" />
              買い時をかしこく比較
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
              Amazon・楽天・Yahoo!ショッピングのセール予定をカレンダーで確認しながら、欲しい商品のURL・希望価格・実質価格メモを手入力で残せます。価格や商品画像の自動取得は行いません。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/calendar">
                <Button className="w-full gap-1.5 sm:w-auto">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  セールを見る
                </Button>
              </Link>
              <Link href="/wishlist/new">
                <Button variant="cta" className="w-full gap-1.5 sm:w-auto">
                  <Heart className="h-4 w-4" aria-hidden />
                  欲しいものを登録
                </Button>
              </Link>
            </div>
          </div>
          {/* 装飾イラスト枠（実在画像は使わず、自作の図形とアイコンで表現） */}
          <div className="relative hidden h-44 rounded-card border border-line bg-white/70 p-4 shadow-card lg:block" aria-hidden>
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-btn bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm">
              <CalendarDays className="h-4 w-4" />
              セール
            </div>
            <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-btn bg-cta px-3 py-2 text-sm font-semibold text-white shadow-sm">
              <JapaneseYen className="h-4 w-4" />
              ¥12,800 メモ
            </div>
            <div className="absolute bottom-5 right-5 grid h-16 w-16 place-items-center rounded-full bg-accentSoft text-accent">
              <Tag className="h-7 w-7" />
            </div>
          </div>
        </div>
      </section>

      {/* 注目セール（左）＋ 欲しいもの簡単登録（右） */}
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">今月の注目セール</h2>
            <Link href="/calendar" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              すべて見る
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredSales.map((sale) => {
              const merchant = merchantById.get(sale.merchantId);
              return (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="group">
                  <Card className="flex h-full flex-col transition group-hover:border-accent/40 group-hover:shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getMerchantToneClass(merchant)}>{merchant?.name ?? sale.merchantId}</Badge>
                      <Badge>{sale.saleType}</Badge>
                    </div>
                    <h3 className="mt-3 font-bold leading-6 text-ink">{sale.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {formatDateTime(sale.startAt)} 〜 {formatDate(sale.endAt)}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-accent">
                      詳細を見る
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 欲しいものを簡単登録パネル */}
        <Card className="flex h-fit flex-col bg-gradient-to-br from-ctaSoft to-white">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-cta text-white">
              <NotebookPen className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-lg font-bold text-ink">欲しいものを簡単登録</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            商品URLと希望価格、実質価格メモを残しておくと、セール前にまとめて見直せます。
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink">
            <li className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-cta" aria-hidden />
              商品URLを保存
            </li>
            <li className="flex items-center gap-2">
              <JapaneseYen className="h-4 w-4 shrink-0 text-cta" aria-hidden />
              希望価格と実質価格メモ
            </li>
            <li className="flex items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-cta" aria-hidden />
              関連セールに紐づけ
            </li>
          </ul>
          <Link href="/wishlist/new" className="mt-5">
            <Button variant="cta" className="w-full gap-1.5">
              <Heart className="h-4 w-4" aria-hidden />
              今すぐ登録する
            </Button>
          </Link>
        </Card>
      </section>

      {/* 今月のセール攻略まとめ（記事カード） */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">今月のセール攻略まとめ</h2>
          <Link href="/articles" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            記事一覧へ
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredArticles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className="group">
              <Card className="flex h-full flex-col transition group-hover:border-accent/40 group-hover:shadow-soft">
                <p className="text-xs font-semibold text-muted">{formatDate(article.publishedAt)}</p>
                <h3 className="mt-2 font-bold leading-6 text-ink">{article.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{article.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 広告枠 */}
      <AdPlaceholder label="トップページ広告枠" slot="home-footer" />
    </div>
  );
}
