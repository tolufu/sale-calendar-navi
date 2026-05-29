import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { articles } from "@/data/articles";
import { formatDate } from "@/lib/utils/date";

export function ArticleDetail({ slug }: { slug: string }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    notFound();
  }

  return (
    <Card>
      <div className="flex flex-wrap gap-2">
        {article.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{article.title}</h1>
      <p className="mt-2 text-sm text-muted">{formatDate(article.publishedAt)}</p>
      <p className="mt-6 leading-8">{article.body}</p>
    </Card>
  );
}
