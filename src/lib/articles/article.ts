import type { Article } from "@/lib/repositories/types";

export const ARTICLE_OG_IMAGE_OPTIONS = [
  "/images/placeholders/og-sale-calendar.svg",
  "/images/placeholders/blue-box.svg",
  "/images/placeholders/red-bag.svg"
] as const;

export function isPublishedArticle(article: Article): boolean {
  return article.status !== "draft";
}

export function getPublishedArticles(items: Article[]): Article[] {
  return items.filter(isPublishedArticle);
}

export function sortArticles(items: Article[]): Article[] {
  return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
