import { describe, expect, it } from "vitest";
import { getPublishedArticles } from "@/lib/articles/article";
import {
  buildArticle,
  createArticleFormValues,
  splitCommaSeparated,
  validateArticleForm
} from "@/lib/articles/admin";
import type { Article } from "@/lib/repositories/types";

describe("article admin utilities", () => {
  it("省略statusを公開扱いにし、下書きを公開一覧から除外する", () => {
    const published = createArticle({ slug: "published" });
    const draft = createArticle({ slug: "draft", status: "draft" });

    expect(getPublishedArticles([published, draft])).toEqual([published]);
  });

  it("slugとOG画像を検証する", () => {
    const values = createArticleFormValues();
    const errors = validateArticleForm({
      ...values,
      slug: "Invalid Slug",
      title: "タイトル",
      description: "説明",
      body: "本文",
      ogImage: "https://example.com/external.png"
    });

    expect(errors.slug).toBeTruthy();
    expect(errors.ogImage).toBeTruthy();
  });

  it("カンマ区切りを整理して記事を組み立てる", () => {
    const article = buildArticle({
      ...createArticleFormValues(),
      slug: "new-article",
      title: "  タイトル  ",
      description: " 説明 ",
      body: " 本文 ",
      tags: "攻略, 攻略, メモ",
      relatedSlugs: "related-one, related-two"
    });

    expect(splitCommaSeparated("攻略, 攻略, メモ")).toEqual(["攻略", "メモ"]);
    expect(article).toMatchObject({
      slug: "new-article",
      title: "タイトル",
      description: "説明",
      body: "本文",
      tags: ["攻略", "メモ"],
      relatedSlugs: ["related-one", "related-two"]
    });
  });
});

function createArticle(patch: Partial<Article>): Article {
  return {
    slug: "article",
    title: "タイトル",
    description: "説明",
    body: "本文",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: [],
    publishedAt: "2026-06-02T00:00:00.000Z",
    ...patch
  };
}
