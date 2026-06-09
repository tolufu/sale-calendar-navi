"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAdminRepositories } from "@/lib/repositories";
import type { Article } from "@/lib/repositories/types";
import { formatDate } from "@/lib/utils/date";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; articles: Article[] };

export function AdminArticleList() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "success", articles: await getAdminRepositories().articles.listAll() });
    } catch {
      setState({ status: "error", message: "記事一覧を読み込めませんでした。" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(article: Article) {
    if (!window.confirm(`「${article.title}」を削除しますか？`)) {
      return;
    }

    try {
      await getAdminRepositories().articles.remove(article.slug);
      setToast("記事を削除しました。");
      await load();
    } catch {
      setState({ status: "error", message: "記事を削除できませんでした。" });
    }
  }

  return (
    <div>
      <PageHeader
        title="記事管理"
        description="下書きを含む記事を管理します。公開状態の記事だけが公開画面に表示されます。"
        action={
          <Link className="inline-flex min-h-10 items-center rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark" href="/admin/articles/new">
            記事を作成
          </Link>
        }
      />

      <Link href="/admin" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">管理者コンソールへ戻る</Link>

      {state.status === "loading" ? <Skeleton className="h-44 w-full" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={() => void load()} /> : null}
      {state.status === "success" && state.articles.length === 0 ? (
        <EmptyState
          title="記事はまだありません"
          description="記事を作成し、下書きまたは公開状態で保存してください。"
        />
      ) : null}
      {state.status === "success" && state.articles.length > 0 ? (
        <div className="space-y-3">
          {state.articles.map((article) => (
            <Card key={article.slug} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={article.status === "draft" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                    {article.status === "draft" ? "下書き" : "公開"}
                  </Badge>
                  <span className="text-xs text-muted">{formatDate(article.publishedAt)}</span>
                </div>
                <h2 className="mt-2 font-bold text-ink">{article.title}</h2>
                <p className="mt-1 text-sm text-muted">/{article.slug}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link className="inline-flex min-h-10 items-center rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface" href={`/admin/articles/${article.slug}/edit`}>
                  編集
                </Link>
                <Button variant="danger" onClick={() => void handleRemove(article)}>削除</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
