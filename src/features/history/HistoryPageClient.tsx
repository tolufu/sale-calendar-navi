"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { PurchaseHistory } from "@/lib/repositories/types";
import { formatDate } from "@/lib/utils/date";
import { formatPrice } from "@/lib/utils/price";

export function HistoryPageClient() {
  const [items, setItems] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userId = await getAnonymousUserId();
      setItems(await getRepositories().history.list(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "履歴を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items.length === 0) return <EmptyState title="購入履歴はまだありません" description="v1.2 で欲しいものから履歴化する導線を拡張します。" />;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <p className="font-semibold">{item.title}</p>
          <p className="mt-2 text-sm text-muted">{formatDate(item.purchasedAt)} / {formatPrice(item.purchasedPrice)}</p>
          {item.memo ? <p className="mt-2 text-sm text-muted">{item.memo}</p> : null}
        </Card>
      ))}
    </div>
  );
}
