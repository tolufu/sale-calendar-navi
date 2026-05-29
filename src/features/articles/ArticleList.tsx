import Link from "next/link";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { formatDate } from "@/lib/utils/date";

export function ArticleList() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} href={`/articles/${article.slug}`}>
            <Card className="h-full hover:bg-surface">
              <p className="text-sm text-muted">{formatDate(article.publishedAt)}</p>
              <h2 className="mt-2 text-lg font-bold">{article.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{article.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <AdPlaceholder label="記事一覧広告枠" slot="articles-list-sidebar" />
    </div>
  );
}
