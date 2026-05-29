"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesiredPrice, setDraftDesiredPrice] = useState("");
  const [draftActualPriceMemo, setDraftActualPriceMemo] = useState("");

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

  function startEdit(item: WishItem) {
    setEditingId(item.id);
    setDraftTitle(item.title);
    setDraftDesiredPrice(item.desiredPrice?.toString() ?? "");
    setDraftActualPriceMemo(item.actualPriceMemo ?? "");
  }

  async function saveEdit(item: WishItem) {
    if (!userId) return;
    await getRepositories().wishlist.update(userId, item.id, {
      title: draftTitle.trim() || item.title,
      desiredPrice: draftDesiredPrice ? Number(draftDesiredPrice) : null,
      actualPriceMemo: draftActualPriceMemo.trim() || null
    });
    setEditingId(null);
    setToast("欲しいものを更新しました。");
    await load();
  }

  async function remove(item: WishItem) {
    if (!userId) {
      return;
    }
    const repositories = getRepositories();
    await repositories.wishlist.remove(userId, item.id);
    await repositories.history.create(userId, {
      type: "deletedWish",
      title: item.title,
      href: null,
      merchantId: item.merchantId,
      occurredAt: new Date().toISOString(),
      memo: "欲しいもの一覧から削除"
    });
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
          <Card key={item.id} className="grid grid-cols-[96px_1fr] gap-4 md:grid-cols-[128px_1fr]">
            <Image src={imagePath(item.placeholderKey)} alt="" width={96} height={96} className="rounded-lg border border-line bg-surface" />
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {editingId === item.id ? (
                    <input
                      className="w-full rounded-md border border-line px-3 py-2 text-sm"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                    />
                  ) : (
                    <p className="font-semibold text-ink">{item.title}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">{merchant?.name ?? item.merchantId}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="min-h-8 px-2" onClick={() => startEdit(item)} aria-label="編集">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="min-h-8 px-2" onClick={() => void remove(item)} aria-label="削除">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {editingId === item.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                    value={draftDesiredPrice}
                    onChange={(event) => setDraftDesiredPrice(event.target.value)}
                    placeholder="希望価格"
                  />
                  <textarea
                    className="min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm"
                    value={draftActualPriceMemo}
                    onChange={(event) => setDraftActualPriceMemo(event.target.value)}
                    placeholder="実質価格メモ"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => void saveEdit(item)}>保存</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>キャンセル</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted">希望価格: {formatPrice(item.desiredPrice)}</p>
                  <p className="mt-1 text-sm text-muted">登録日: {new Date(item.createdAt).toLocaleDateString("ja-JP")}</p>
                  {item.actualPriceMemo ? <p className="mt-2 text-sm leading-6 text-muted">前回メモ: {item.actualPriceMemo}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={item.productUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-accent hover:bg-surface">
                      <ExternalLink className="h-4 w-4" />
                      外部リンク
                    </a>
                    {item.targetSaleEventId ? (
                      <Link href={`/sales/${item.targetSaleEventId}`} className="inline-flex min-h-10 items-center rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-surface">
                        関連セール
                      </Link>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })}
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
