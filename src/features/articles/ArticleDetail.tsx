import { notFound } from "next/navigation";
import Link from "next/link";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { formatDate } from "@/lib/utils/date";

export function ArticleDetail({ slug }: { slug: string }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    notFound();
  }

  const sections = article.body.split("\n\n").filter(Boolean);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <article className="space-y-5">
        <Card className="bg-blue-50">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-blue-900">{article.title}</h1>
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
        <AdPlaceholder />
      </article>
      <aside className="space-y-4">
        <Card>
          <h2 className="font-bold">関連記事</h2>
          <Link href="/articles" className="mt-3 block text-sm font-semibold text-accent">記事一覧へ</Link>
        </Card>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 lg:hidden">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
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
