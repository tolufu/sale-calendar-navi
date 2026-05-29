"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, WishItem } from "@/lib/repositories/types";
import { formatPrice } from "@/lib/utils/price";

function imagePath(key: string): string {
  return `/images/placeholders/${key}.svg`;
}

export function WishlistList() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const uid = await getAnonymousUserId();
      const [wishItems, merchantItems] = await Promise.all([repositories.wishlist.list(uid), repositories.merchants.list()]);
      setUserId(uid);
      setItems(wishItems);
      setMerchants(merchantItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "欲しいものを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!userId) {
      return;
    }
    await getRepositories().wishlist.remove(userId, id);
    setToast("欲しいものを削除しました。");
    await load();
  }

  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="欲しいものはまだありません"
        description="商品URL、希望価格、実質価格メモを登録してセール前に見直せるようにします。"
        action={<Link href="/wishlist/new"><Button>登録する</Button></Link>}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const merchant = merchants.find((entry) => entry.merchantId === item.merchantId);
        return (
          <Card key={item.id} className="grid grid-cols-[96px_1fr] gap-4">
            <Image src={imagePath(item.placeholderKey)} alt="" width={96} height={96} className="rounded-lg border border-line bg-surface" />
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">{merchant?.name ?? item.merchantId}</p>
                </div>
                <Button variant="ghost" className="min-h-8 px-2" onClick={() => void remove(item.id)} aria-label="削除">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted">希望価格: {formatPrice(item.desiredPrice)}</p>
              {item.actualPriceMemo ? <p className="mt-2 text-sm leading-6 text-muted">{item.actualPriceMemo}</p> : null}
              <a href={item.productUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-accent">
                商品URLを開く
              </a>
            </div>
          </Card>
        );
      })}
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
