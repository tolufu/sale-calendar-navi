import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Heart, ListOrdered, Share2, Tag } from "lucide-react";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { merchants } from "@/data/merchants";
import { HistoryRecorder } from "@/features/history/HistoryRecorder";
import type { Article } from "@/lib/repositories/types";
import { getMerchantIntegrationLabel } from "@/lib/merchants/capabilities";
import { formatDate } from "@/lib/utils/date";
import { getMerchantToneClass } from "@/lib/utils/merchant";
import { buildXIntentUrl } from "@/lib/utils/share";

function isArticle(article: Article | undefined): article is Article {
  return Boolean(article);
}

const tocItems = [
  { id: "summary", label: "記事概要" },
  { id: "quick-table", label: "セール早見表" },
  { id: "body", label: "本文" },
  { id: "related", label: "前後の記事" }
];

export function ArticleDetail({ slug }: { slug: string }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    notFound();
  }

  const sections = article.body.split("\n\n").filter(Boolean);
  const currentIndex = articles.findIndex((item) => item.slug === slug);
  const previous = articles[currentIndex + 1] ?? null;
  const next = articles[currentIndex - 1] ?? null;
  const related = (article.relatedSlugs ?? [])
    .map((relatedSlug) => articles.find((item) => item.slug === relatedSlug))
    .filter(isArticle)
    .slice(0, 3);
  const shareText = `${article.title} #セールカレンダー比較ナビ`;

  return (
    <div id="top" className="pb-28 lg:pb-0">
      <HistoryRecorder input={{ type: "article", title: article.title, href: `/articles/${article.slug}`, merchantId: null, occurredAt: "", memo: "記事を表示" }} />
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <article className="space-y-5">
          <nav className="text-sm text-muted" aria-label="パンくず">
            <Link href="/" className="hover:text-accent">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/articles" className="hover:text-accent">記事</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{article.title}</span>
          </nav>

          {/* ヒーロー */}
          <Card className="bg-gradient-to-br from-accentSoft via-white to-surface">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => <Badge key={tag} className="border-accent/20 bg-white text-accent">{tag}</Badge>)}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight text-accent sm:text-3xl">{article.title}</h1>
            <p className="mt-3 leading-7 text-ink">{article.description}</p>
            <p className="mt-3 text-sm text-muted">{formatDate(article.publishedAt)} 公開</p>
          </Card>

          {/* 目次 */}
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <ListOrdered className="h-5 w-5 text-accent" aria-hidden />
              目次
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="font-semibold text-accent hover:underline">{item.label}</a>
                </li>
              ))}
            </ol>
          </Card>

          {/* 記事概要 */}
          <Card id="summary" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-ink">記事概要</h2>
            <p className="mt-3 leading-7 text-ink">{article.description}</p>
          </Card>

          {/* セール早見表 */}
          <Card id="quick-table" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-ink">セール早見表</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              ECごとの確認ポイントの一覧です。価格や割引は保証せず、購入前に各サイトで最新条件を確認してください。
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="py-2 pr-3 font-semibold">EC</th>
                    <th className="py-2 pr-3 font-semibold">連携状況</th>
                    <th className="py-2 font-semibold">確認のヒント</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.merchantId} className="border-b border-line/70 align-top">
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getMerchantToneClass(merchant)}`}>
                          {merchant.name}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-muted">{getMerchantIntegrationLabel(merchant) ?? "リンク保存・カレンダー対応"}</td>
                      <td className="py-2 text-muted">送料・クーポン・ポイント条件を分けてメモしておくと比較しやすくなります。</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 本文 */}
          <Card id="body" className="scroll-mt-20">
            <div className="space-y-4">
              {sections.map((section) => <p key={section} className="leading-8 text-ink">{section}</p>)}
            </div>
          </Card>

          <AdPlaceholder label="記事本文中広告枠" slot="article-inline" />

          {/* 前後の記事 */}
          <Card id="related" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-ink">前後の記事</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {previous ? <Link href={`/articles/${previous.slug}`} className="rounded-card border border-line p-3 text-sm font-semibold transition hover:bg-surface">前の記事: {previous.title}</Link> : <span className="rounded-card border border-line p-3 text-sm text-muted">前の記事はありません</span>}
              {next ? <Link href={`/articles/${next.slug}`} className="rounded-card border border-line p-3 text-sm font-semibold transition hover:bg-surface">次の記事: {next.title}</Link> : <span className="rounded-card border border-line p-3 text-sm text-muted">次の記事はありません</span>}
            </div>
          </Card>
        </article>

        {/* サイドバー */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="bg-gradient-to-br from-ctaSoft to-white">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cta text-white">
                <Heart className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="text-base font-bold text-ink">欲しいものに登録</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">気になる商品を欲しいものに保存して、セール前に希望価格や実質価格メモを見直せます。</p>
            <Link href="/wishlist/new" className="mt-4 block">
              <Button variant="cta" className="w-full gap-1.5">
                <Tag className="h-4 w-4" aria-hidden />
                欲しいものを登録
              </Button>
            </Link>
          </Card>

          {related.length ? (
            <Card>
              <h2 className="text-base font-bold text-ink">関連記事</h2>
              <div className="mt-3 space-y-2">
                {related.map((relatedArticle) => (
                  <Link key={relatedArticle.slug} href={`/articles/${relatedArticle.slug}`} className="flex items-center justify-between gap-2 rounded-btn border border-line p-3 text-sm font-semibold transition hover:bg-surface">
                    <span className="min-w-0 truncate">{relatedArticle.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  </Link>
                ))}
              </div>
              <Link href="/articles" className="mt-3 block text-sm font-semibold text-accent hover:underline">記事一覧へ</Link>
            </Card>
          ) : null}

          <AdPlaceholder label="サイドバー広告枠" slot="article-sidebar" />
        </aside>
      </div>

      {/* スマホ固定シェアバー（下部ナビと重ならないよう余白を確保） */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white/95 p-3 backdrop-blur md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <a
            href={buildXIntentUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Xでシェア
          </a>
          <a
            href="#top"
            className="inline-flex min-h-11 items-center justify-center rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
          >
            上部へ戻る
          </a>
        </div>
      </div>
    </div>
  );
}
