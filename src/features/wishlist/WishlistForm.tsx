"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, SaleEvent } from "@/lib/repositories/types";
import { convertRakutenAffiliateUrl } from "@/lib/utils/affiliate";
import { detectMerchantIdFromUrl, extractAmazonAsin } from "@/lib/utils/merchant";

export function WishlistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [title, setTitle] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [merchantId, setMerchantId] = useState(searchParams.get("merchantId") ?? "");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [actualPriceMemo, setActualPriceMemo] = useState("");
  const [targetSaleEventId, setTargetSaleEventId] = useState(searchParams.get("saleId") ?? "");
  const [note, setNote] = useState("");
  const [asin, setAsin] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const [merchantItems, saleItems] = await Promise.all([repositories.merchants.list(), repositories.sales.list()]);
      setMerchants(merchantItems);
      setSales(saleItems);
      setMerchantId((current) => current || merchantItems[0]?.merchantId || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "登録フォームを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const detected = detectMerchantIdFromUrl(productUrl, merchants);
    if (detected) {
      setMerchantId(detected);
    }
    setAsin(extractAmazonAsin(productUrl));
  }, [merchants, productUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const parsedUrl = new URL(productUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("商品URLは http または https で入力してください。");
      }
    } catch {
      setError("商品URLの形式を確認してください。");
      return;
    }

    const selectedMerchant = merchants.find((merchant) => merchant.merchantId === merchantId);
    if (!selectedMerchant) {
      setError("ECを選択してください。");
      return;
    }

    setSaving(true);
    try {
      const repositories = getRepositories();
      const userId = await getAnonymousUserId();
      const convertedUrl =
        selectedMerchant.affiliate?.provider === "rakuten"
          ? convertRakutenAffiliateUrl(productUrl, process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID)
          : productUrl;

      await repositories.wishlist.create(userId, {
        title: title.trim(),
        productUrl: convertedUrl,
        merchantId,
        desiredPrice: desiredPrice ? Number(desiredPrice) : null,
        actualPriceMemo: actualPriceMemo.trim() || null,
        targetSaleEventId: targetSaleEventId || null,
        placeholderKey: selectedMerchant.placeholderKey,
        note: note.trim() || null
      });
      setToast("欲しいものを保存しました。");
      setTimeout(() => router.push("/wishlist"), 700);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存に失敗しました。再試行してください。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
    <Card>
      {error ? <div className="mb-4"><ErrorState message={error} onRetry={load} /></div> : null}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold" htmlFor="title">商品名</label>
          <input id="title" className="mt-2 w-full rounded-md border border-line px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="productUrl">商品URL</label>
          <input id="productUrl" type="url" className="mt-2 w-full rounded-md border border-line px-3 py-2" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} required />
          {asin ? <p className="mt-2 text-xs text-muted">検出したASIN: {asin}</p> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold" htmlFor="merchant">EC</label>
            <select id="merchant" className="mt-2 w-full rounded-md border border-line px-3 py-2" value={merchantId} onChange={(event) => setMerchantId(event.target.value)}>
              {merchants.map((merchant) => <option key={merchant.merchantId} value={merchant.merchantId}>{merchant.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="desiredPrice">希望価格</label>
            <input id="desiredPrice" type="number" min="0" className="mt-2 w-full rounded-md border border-line px-3 py-2" value={desiredPrice} onChange={(event) => setDesiredPrice(event.target.value)} />
          </div>
        </div>
        <button type="button" className="flex items-center gap-2 text-sm font-semibold text-accent" onClick={() => setExpanded((current) => !current)}>
          詳細入力
          <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded ? (
          <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
            <div>
              <label className="text-sm font-semibold" htmlFor="actualPriceMemo">実質価格メモ</label>
              <textarea id="actualPriceMemo" className="mt-2 min-h-24 w-full rounded-md border border-line px-3 py-2" value={actualPriceMemo} onChange={(event) => setActualPriceMemo(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="targetSale">対象セール</label>
              <select id="targetSale" className="mt-2 w-full rounded-md border border-line px-3 py-2" value={targetSaleEventId} onChange={(event) => setTargetSaleEventId(event.target.value)}>
                <option value="">未指定</option>
                {sales.map((sale) => <option key={sale.id} value={sale.id}>{sale.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="note">補足メモ</label>
              <textarea id="note" className="mt-2 min-h-20 w-full rounded-md border border-line px-3 py-2" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
        ) : null}
        <div className="sticky bottom-3 rounded-lg bg-white/90 py-2 backdrop-blur">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? "保存中" : "保存する"}</Button>
        </div>
      </form>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </Card>
    <Card className="h-fit">
      <div className="aspect-square rounded-lg border border-dashed border-line bg-surface" />
      <p className="mt-3 text-sm font-semibold">商品画像はプレースホルダーで表示します</p>
      <p className="mt-2 text-sm leading-6 text-muted">v1では外部サイトの商品画像を取得せず、画像URL入力欄も設けません。</p>
    </Card>
    </div>
  );
}
