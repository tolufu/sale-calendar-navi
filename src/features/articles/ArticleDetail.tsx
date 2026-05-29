import { notFound } from "next/navigation";
import Link from "next/link";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { HistoryRecorder } from "@/features/history/HistoryRecorder";
import type { Article } from "@/lib/repositories/types";
import { formatDate } from "@/lib/utils/date";
import { buildXIntentUrl } from "@/lib/utils/share";

function isArticle(article: Article | undefined): article is Article {
  return Boolean(article);
}

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
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <HistoryRecorder input={{ type: "article", title: article.title, href: `/articles/${article.slug}`, merchantId: null, occurredAt: "", memo: "記事を表示" }} />
      <article className="space-y-5">
        <nav className="text-sm text-muted" aria-label="パンくず">
          <Link href="/" className="hover:text-accent">ホーム</Link>
          <span className="mx-2">/</span>
          <Link href="/articles" className="hover:text-accent">記事</Link>
          <span className="mx-2">/</span>
          <span>{article.title}</span>
        </nav>
        <Card className="bg-blue-50">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-blue-900">{article.title}</h1>
          <p className="mt-3 leading-7 text-blue-950">{article.description}</p>
          <p className="mt-2 text-sm text-muted">{formatDate(article.publishedAt)}</p>
        </Card>
        <Card>
          <h2 className="font-bold">目次</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>セール前に見る項目</li>
            <li>希望価格と実質価格メモ</li>
            <li>当日の確認手順</li>
          </ol>
        </Card>
        <Card>
          <h2 className="font-bold">早見表</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            {["URL", "希望価格", "実質価格メモ"].map((label) => (
              <div key={label} className="rounded-md border border-line bg-surface p-3 font-semibold">{label}</div>
            ))}
          </div>
        </Card>
        <Card>
          {sections.map((section) => <p key={section} className="leading-8">{section}</p>)}
        </Card>
        <AdPlaceholder label="記事本文中広告枠" slot="article-inline" />
        <Card>
          <h2 className="font-bold">前後の記事</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {previous ? <Link href={`/articles/${previous.slug}`} className="rounded-md border border-line p-3 text-sm font-semibold hover:bg-surface">前の記事: {previous.title}</Link> : <span className="rounded-md border border-line p-3 text-sm text-muted">前の記事はありません</span>}
            {next ? <Link href={`/articles/${next.slug}`} className="rounded-md border border-line p-3 text-sm font-semibold hover:bg-surface">次の記事: {next.title}</Link> : <span className="rounded-md border border-line p-3 text-sm text-muted">次の記事はありません</span>}
          </div>
        </Card>
      </article>
      <aside className="space-y-4">
        <Card>
          <h2 className="font-bold">関連記事</h2>
          <div className="mt-3 space-y-2">
            {related.map((relatedArticle) => (
              <Link key={relatedArticle.slug} href={`/articles/${relatedArticle.slug}`} className="block rounded-md border border-line p-3 text-sm font-semibold hover:bg-surface">
                {relatedArticle.title}
              </Link>
            ))}
          </div>
          <Link href="/articles" className="mt-3 block text-sm font-semibold text-accent">記事一覧へ</Link>
        </Card>
        <AdPlaceholder label="サイドバー広告枠" slot="article-sidebar" />
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 lg:hidden">
        <a
          href={buildXIntentUrl(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Xで共有
        </a>
      </div>
    </div>
  );
}
