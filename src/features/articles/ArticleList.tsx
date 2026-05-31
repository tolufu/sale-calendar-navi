import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { articles } from "@/data/articles";
import { formatDate } from "@/lib/utils/date";

export function ArticleList() {
  if (articles.length === 0) {
    return (
      <EmptyState
        title="記事はまだありません"
        description="セール前の買い物メモ整理に役立つ記事を順次公開予定です。"
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} href={`/articles/${article.slug}`} className="group">
            <Card className="flex h-full flex-col transition group-hover:border-accent/40 group-hover:shadow-soft">
              <p className="text-xs font-semibold text-muted">{formatDate(article.publishedAt)}</p>
              <h2 className="mt-2 text-lg font-bold leading-6 text-ink">{article.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{article.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-accent">
                記事を読む
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Card>
          </Link>
        ))}
      </div>
      <AdPlaceholder label="記事一覧広告枠" slot="articles-list-sidebar" />
    </div>
  );
}
