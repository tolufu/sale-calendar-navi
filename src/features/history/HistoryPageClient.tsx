"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Newspaper, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, ViewHistory } from "@/lib/repositories/types";
import { HISTORY_LIMIT } from "@/lib/utils/history";
import { formatDate } from "@/lib/utils/date";
import { getMerchantToneClass } from "@/lib/utils/merchant";

const typeLabels: Record<ViewHistory["type"], string> = {
  sale: "セール",
  article: "記事",
  deletedWish: "削除済みの欲しいもの"
};

const filters: { value: "all" | ViewHistory["type"]; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "sale", label: "セール" },
  { value: "article", label: "記事" },
  { value: "deletedWish", label: "削除済み" }
];

export function HistoryPageClient() {
  const [items, setItems] = useState<ViewHistory[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeType, setActiveType] = useState<"all" | ViewHistory["type"]>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userId = await getAnonymousUserId();
      setUserId(userId);
      const [historyItems, merchantItems] = await Promise.all([
        getRepositories().history.list(userId),
        getRepositories().merchants.list()
      ]);
      setItems(historyItems);
      setMerchants(merchantItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "履歴を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!userId) return;
    try {
      await getRepositories().history.remove(userId, id);
      setToast({ message: "履歴を1件削除しました。" });
      await load();
    } catch (removeError) {
      setToast({
        message: removeError instanceof Error ? removeError.message : "履歴を削除できませんでした。",
        variant: "error"
      });
    }
  }

  async function clear() {
    if (!userId) return;
    const confirmed = window.confirm("履歴をすべて削除します。よろしいですか？");
    if (!confirmed) return;
    try {
      await getRepositories().history.clear(userId);
      setToast({ message: "履歴をすべて削除しました。" });
      await load();
    } catch (clearError) {
      setToast({
        message: clearError instanceof Error ? clearError.message : "履歴を削除できませんでした。",
        variant: "error"
      });
    }
  }

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items.length === 0) {
    return <EmptyState title="履歴はまだありません" description={`セール詳細や記事を開くと、最近チェックした項目が最大${HISTORY_LIMIT}件まで保存されます。`} />;
  }

  const visibleItems = activeType === "all" ? items : items.filter((item) => item.type === activeType);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="履歴の種類">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeType === filter.value ? "primary" : "secondary"}
              onClick={() => setActiveType(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <Button variant="danger" className="gap-1.5" onClick={() => void clear()}>
          <Trash2 className="h-4 w-4" aria-hidden />
          全削除
        </Button>
      </div>

      <p className="text-xs text-muted">最近の履歴を最大{HISTORY_LIMIT}件まで保存します。現在 {visibleItems.length} 件を表示中です。</p>

      {visibleItems.length === 0 ? (
        <EmptyState title="この種類の履歴はありません" description="フィルターを切り替えると、ほかの履歴を確認できます。" />
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((item) => {
            const merchant = item.merchantId ? merchants.find((entry) => entry.merchantId === item.merchantId) : undefined;
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted" aria-hidden>
                      {item.type === "article" ? <Newspaper className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                          {typeLabels[item.type]}
                        </span>
                        {merchant ? (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getMerchantToneClass(merchant)}`}>
                            {merchant.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{formatDate(item.occurredAt)}</p>
                      {item.memo ? <p className="mt-1 text-sm text-muted">{item.memo}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {item.href ? (
                      <Link href={item.href}>
                        <Button variant="secondary" className="gap-1.5">
                          <RotateCcw className="h-4 w-4" aria-hidden />
                          再訪
                        </Button>
                      </Link>
                    ) : null}
                    <Button variant="ghost" className="gap-1.5" onClick={() => void remove(item.id)}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {toast ? <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
