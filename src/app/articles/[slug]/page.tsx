import type { Metadata } from "next";
import { articles } from "@/data/articles";
import { ArticleDetail } from "@/features/articles/ArticleDetail";
import { buildPageMetadata, truncateDescription } from "@/lib/utils/metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return buildPageMetadata({
    title: article?.title ?? "記事",
    description: truncateDescription(article?.description ?? "セール前の買い物メモに関する記事です。"),
    path: `/articles/${slug}`,
    ogImage: article?.ogImage
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArticleDetail slug={slug} />;
}
