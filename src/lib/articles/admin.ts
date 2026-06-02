import { ARTICLE_OG_IMAGE_OPTIONS } from "@/lib/articles/article";
import type { Article, ArticleStatus } from "@/lib/repositories/types";

export type ArticleFormValues = {
  slug: string;
  title: string;
  description: string;
  body: string;
  ogImage: string;
  tags: string;
  publishedAt: string;
  relatedSlugs: string;
  status: ArticleStatus;
};

export type ArticleFormErrors = Partial<Record<keyof ArticleFormValues, string>>;

export function splitCommaSeparated(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function toDateTimeLocal(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function createArticleFormValues(article?: Article): ArticleFormValues {
  return {
    slug: article?.slug ?? "",
    title: article?.title ?? "",
    description: article?.description ?? "",
    body: article?.body ?? "",
    ogImage: article?.ogImage ?? ARTICLE_OG_IMAGE_OPTIONS[0],
    tags: article?.tags.join(", ") ?? "",
    publishedAt: toDateTimeLocal(article?.publishedAt ?? new Date().toISOString()),
    relatedSlugs: article?.relatedSlugs?.join(", ") ?? "",
    status: article?.status ?? "published"
  };
}

export function validateArticleForm(values: ArticleFormValues): ArticleFormErrors {
  const errors: ArticleFormErrors = {};

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
    errors.slug = "slugは半角英小文字・数字・ハイフンで入力してください。";
  }
  if (!values.title.trim()) errors.title = "タイトルを入力してください。";
  if (!values.description.trim()) errors.description = "説明を入力してください。";
  if (!values.body.trim()) errors.body = "本文を入力してください。";
  if (!ARTICLE_OG_IMAGE_OPTIONS.includes(values.ogImage as (typeof ARTICLE_OG_IMAGE_OPTIONS)[number])) {
    errors.ogImage = "OG画像はプレースホルダーから選択してください。";
  }
  if (Number.isNaN(new Date(values.publishedAt).getTime())) {
    errors.publishedAt = "公開日時を入力してください。";
  }
  if (values.status !== "draft" && values.status !== "published") {
    errors.status = "公開状態を選択してください。";
  }

  return errors;
}

export function buildArticle(values: ArticleFormValues): Article {
  return {
    slug: values.slug,
    title: values.title.trim(),
    description: values.description.trim(),
    body: values.body.trim(),
    ogImage: values.ogImage,
    tags: splitCommaSeparated(values.tags),
    publishedAt: new Date(values.publishedAt).toISOString(),
    relatedSlugs: splitCommaSeparated(values.relatedSlugs),
    status: values.status
  };
}
