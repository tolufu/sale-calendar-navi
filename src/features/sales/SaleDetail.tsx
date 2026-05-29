"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { SaleEvent, WishItem } from "@/lib/repositories/types";
import { formatDateTime } from "@/lib/utils/date";
import { formatPrice } from "@/lib/utils/price";

export function SaleDetail({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<SaleEvent | null>(null);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const userId = await getAnonymousUserId();
      const [saleItem, wishItems] = await Promise.all([repositories.sales.get(saleId), repositories.wishlist.list(userId)]);
      setSale(saleItem);
      setWishes(wishItems.filter((item) => item.targetSaleEventId === saleId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "セール詳細を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (!sale) {
    return <EmptyState title="セール予定が見つかりません" description="カレンダーから別の予定を選び直してください。" />;
  }

  return (
    <div className="space-y-5">
      <Card>
        <Badge>{sale.saleType}</Badge>
        <h1 className="mt-4 text-2xl font-bold">{sale.title}</h1>
        <p className="mt-2 text-sm text-muted">{formatDateTime(sale.startAt)} - {formatDateTime(sale.endAt)}</p>
        <p className="mt-4 leading-7 text-ink">{sale.description}</p>
        <div className="mt-5">
          <Link href={`/wishlist/new?saleId=${sale.id}&merchantId=${sale.merchantId}`}>
            <Button>この予定に欲しいものを登録</Button>
          </Link>
        </div>
      </Card>
      {wishes.length === 0 ? (
        <EmptyState title="紐づく欲しいものはまだありません" description="商品URLと希望価格を登録して、セール前に見直せるようにします。" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {wishes.map((item) => (
            <Card key={item.id}>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-muted">希望価格: {formatPrice(item.desiredPrice)}</p>
              {item.actualPriceMemo ? <p className="mt-2 text-sm text-muted">{item.actualPriceMemo}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
