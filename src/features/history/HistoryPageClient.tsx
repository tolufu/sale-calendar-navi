"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { ViewHistory } from "@/lib/repositories/types";
import { formatDate } from "@/lib/utils/date";

export function HistoryPageClient() {
  const [items, setItems] = useState<ViewHistory[]>([]);
  const [activeType, setActiveType] = useState<"all" | ViewHistory["type"]>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userId = await getAnonymousUserId();
      setUserId(userId);
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

  async function remove(id: string) {
    if (!userId) return;
    await getRepositories().history.remove(userId, id);
    await load();
  }

  async function clear() {
    if (!userId) return;
    await getRepositories().history.clear(userId);
    await load();
  }

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items.length === 0) return <EmptyState title="履歴はまだありません" description="セール詳細や記事を開くと、最近チェックした項目が最大30件まで保存されます。" />;

  const visibleItems = activeType === "all" ? items : items.filter((item) => item.type === activeType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "すべて"],
            ["sale", "セール"],
            ["article", "記事"],
            ["deletedWish", "削除済み"]
          ].map(([value, label]) => (
            <Button key={value} variant={activeType === value ? "primary" : "secondary"} onClick={() => setActiveType(value as typeof activeType)}>
              {label}
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => void clear()}>全削除</Button>
      </div>
      <div className="grid gap-3">
      {visibleItems.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{formatDate(item.occurredAt)} / {item.type}</p>
            </div>
            <div className="flex gap-2">
              {item.href ? <Link href={item.href}><Button variant="secondary">再訪</Button></Link> : null}
              <Button variant="ghost" onClick={() => void remove(item.id)}>削除</Button>
            </div>
          </div>
          {item.memo ? <p className="mt-2 text-sm text-muted">{item.memo}</p> : null}
        </Card>
      ))}
      </div>
    </div>
  );
}
