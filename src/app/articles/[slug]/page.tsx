import type { Metadata } from "next";
import { articles } from "@/data/articles";
import { ArticleDetail } from "@/features/articles/ArticleDetail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return {
    title: article?.title ?? "記事",
    description: article?.body,
    openGraph: {
      title: article?.title,
      description: article?.body,
      images: article ? [article.ogImage] : []
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArticleDetail slug={slug} />;
}
