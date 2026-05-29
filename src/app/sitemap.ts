import type { MetadataRoute } from "next";
import { articles } from "@/data/articles";
import { saleEvents } from "@/data/sales";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/calendar", "/wishlist", "/articles", "/history", "/settings/notifications", "/terms", "/privacy", "/operator", "/contact"];
  return [
    ...staticPaths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() })),
    ...saleEvents.map((sale) => ({ url: `${baseUrl}/sales/${sale.id}`, lastModified: new Date(sale.startAt) })),
    ...articles.map((article) => ({ url: `${baseUrl}/articles/${article.slug}`, lastModified: new Date(article.publishedAt) }))
  ];
}
