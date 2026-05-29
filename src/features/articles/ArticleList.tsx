import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { formatDate } from "@/lib/utils/date";

export function ArticleList() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {articles.map((article) => (
        <Link key={article.slug} href={`/articles/${article.slug}`}>
          <Card className="h-full hover:bg-surface">
            <p className="text-sm text-muted">{formatDate(article.publishedAt)}</p>
            <h2 className="mt-2 text-lg font-bold">{article.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{article.body}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
