"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ARTICLE_OG_IMAGE_OPTIONS } from "@/lib/articles/article";
import {
  buildArticle,
  createArticleFormValues,
  validateArticleForm,
  type ArticleFormErrors,
  type ArticleFormValues
} from "@/lib/articles/admin";
import { getAdminRepositories } from "@/lib/repositories";

type LoadState = "loading" | "success" | "not-found" | "error";

export function AdminArticleForm({ slug }: { slug?: string }) {
  const [values, setValues] = useState<ArticleFormValues>(() => createArticleFormValues());
  const [errors, setErrors] = useState<ArticleFormErrors>({});
  const [loadState, setLoadState] = useState<LoadState>(slug ? "loading" : "success");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [savedSlug, setSavedSlug] = useState(slug);

  const load = useCallback(async () => {
    if (!slug) {
      return;
    }

    setLoadState("loading");
    try {
      const article = await getAdminRepositories().articles.get(slug);
      if (!article) {
        setLoadState("not-found");
        return;
      }
      setValues(createArticleFormValues(article));
      setSavedSlug(article.slug);
      setLoadState("success");
    } catch {
      setLoadState("error");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateArticleForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const repository = getAdminRepositories().articles;
      const articles = await repository.listAll();
      if (!savedSlug && articles.some((article) => article.slug === values.slug)) {
        setErrors({ slug: "同じslugの記事がすでにあります。" });
        return;
      }

      const saved = await repository.upsert(buildArticle(values));
      setValues(createArticleFormValues(saved));
      setSavedSlug(saved.slug);
      setToast("記事を保存しました。");
    } catch {
      setToast("記事を保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadState === "loading") {
    return <Skeleton className="h-96 w-full" />;
  }
  if (loadState === "error") {
    return <ErrorState message="記事を読み込めませんでした。" onRetry={() => void load()} />;
  }
  if (loadState === "not-found") {
    return <EmptyState title="記事が見つかりません" description="記事一覧から編集対象を選び直してください。" />;
  }

  return (
    <div>
      <PageHeader
        title={savedSlug ? "記事を編集" : "記事を作成"}
        description="本文は空行で段落を区切ります。OG画像は自作プレースホルダーから選択してください。"
      />
      <Link href="/admin/articles" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">記事一覧へ戻る</Link>
      <Card>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field label="slug" error={errors.slug}>
            <input className={inputClass} name="slug" value={values.slug} onChange={handleChange} disabled={Boolean(savedSlug)} required />
          </Field>
          <Field label="タイトル" error={errors.title}>
            <input className={inputClass} name="title" value={values.title} onChange={handleChange} required />
          </Field>
          <Field label="説明" error={errors.description}>
            <textarea className={inputClass} name="description" rows={3} value={values.description} onChange={handleChange} required />
          </Field>
          <Field label="本文" error={errors.body}>
            <textarea className={inputClass} name="body" rows={14} value={values.body} onChange={handleChange} required />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="OG画像" error={errors.ogImage}>
              <select className={inputClass} name="ogImage" value={values.ogImage} onChange={handleChange}>
                {ARTICLE_OG_IMAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="公開状態" error={errors.status}>
              <select className={inputClass} name="status" value={values.status} onChange={handleChange}>
                <option value="draft">下書き</option>
                <option value="published">公開</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="タグ（カンマ区切り）" error={errors.tags}>
              <input className={inputClass} name="tags" value={values.tags} onChange={handleChange} />
            </Field>
            <Field label="公開日時" error={errors.publishedAt}>
              <input className={inputClass} type="datetime-local" name="publishedAt" value={values.publishedAt} onChange={handleChange} required />
            </Field>
          </div>
          <Field label="関連記事slug（カンマ区切り・任意）" error={errors.relatedSlugs}>
            <input className={inputClass} name="relatedSlugs" value={values.relatedSlugs} onChange={handleChange} />
          </Field>
          <Button type="submit" disabled={isSaving}>{isSaving ? "保存中..." : "保存"}</Button>
        </form>
      </Card>
      {toast ? <Toast message={toast} variant={toast.includes("できません") ? "error" : "success"} onClose={() => setToast("")} /> : null}
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-btn border border-line bg-white px-3 py-2 text-sm text-ink disabled:bg-surface disabled:text-muted";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}
