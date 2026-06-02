import type { Metadata } from "next";
import { ArticleDetail } from "@/features/articles/ArticleDetail";
import { getPublishedArticleForServer } from "@/lib/articles/public-server";
import { buildPageMetadata, truncateDescription } from "@/lib/utils/metadata";

// 管理コンソールの公開記事をサーバー描画へ反映するため、定期的に再生成する。
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleForServer(slug);
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
