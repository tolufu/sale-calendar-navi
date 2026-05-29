"use client";

import { ChevronDown, LinkIcon, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, ReferenceLink, ReferenceLinkKind, SaleEvent } from "@/lib/repositories/types";
import { buildAffiliateUrl } from "@/lib/utils/affiliate";
import { detectMerchantIdFromUrl, extractAmazonAsin } from "@/lib/utils/merchant";
import { calculateEffectivePrice, formatPrice } from "@/lib/utils/price";

type ReferenceLinkDraft = {
  id: string;
  kind: ReferenceLinkKind;
  label: string;
  url: string;
};

function parseOptionalAmount(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("価格内訳には0以上の数値を入力してください。");
  }
  return parsed;
}

function parseReferenceLinks(drafts: ReferenceLinkDraft[]): ReferenceLink[] {
  return drafts
    .filter((draft) => draft.label.trim() || draft.url.trim())
    .map((draft) => {
      const parsed = new URL(draft.url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("参考リンクは http または https のURLで入力してください。");
      }
      if (!draft.label.trim()) {
        throw new Error("参考リンクの表示名を入力してください。");
      }
      return {
        id: draft.id,
        kind: draft.kind,
        label: draft.label.trim().slice(0, 40),
        url: parsed.toString()
      };
    });
}

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
  const [productPrice, setProductPrice] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [grantedPoints, setGrantedPoints] = useState("");
  const [pointRate, setPointRate] = useState("1");
  const [referenceLinks, setReferenceLinks] = useState<ReferenceLinkDraft[]>([
    { id: crypto.randomUUID(), kind: "kakaku", label: "価格比較メモ", url: "" }
  ]);
  const [targetSaleEventId, setTargetSaleEventId] = useState(searchParams.get("saleId") ?? "");
  const [note, setNote] = useState("");
  const [asin, setAsin] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const effectivePricePreview = (() => {
    try {
      return calculateEffectivePrice({
        productPrice: parseOptionalAmount(productPrice),
        shippingFee: parseOptionalAmount(shippingFee),
        couponDiscount: parseOptionalAmount(couponDiscount),
        grantedPoints: parseOptionalAmount(grantedPoints),
        pointRate: parseOptionalAmount(pointRate)
      });
    } catch {
      return null;
    }
  })();

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
      const breakdown = {
        productPrice: parseOptionalAmount(productPrice),
        shippingFee: parseOptionalAmount(shippingFee),
        couponDiscount: parseOptionalAmount(couponDiscount),
        grantedPoints: parseOptionalAmount(grantedPoints),
        pointRate: parseOptionalAmount(pointRate)
      };
      const parsedReferenceLinks = parseReferenceLinks(referenceLinks);
      const repositories = getRepositories();
      const userId = await getAnonymousUserId();
      const affiliateUrl = buildAffiliateUrl(productUrl, selectedMerchant.affiliate);
      const now = new Date().toISOString();

      await repositories.wishlist.create(userId, {
        title: title.trim(),
        productUrl: affiliateUrl ?? productUrl,
        merchantId,
        desiredPrice: desiredPrice ? Number(desiredPrice) : null,
        actualPriceMemo: actualPriceMemo.trim() || null,
        targetSaleEventId: targetSaleEventId || null,
        placeholderKey: selectedMerchant.placeholderKey,
        note: note.trim() || null,
        candidates: [
          {
            merchantId,
            originalUrl: productUrl,
            affiliateUrl,
            breakdown,
            priceMemo: actualPriceMemo.trim() || null,
            lastCheckedAt: breakdown.productPrice === null ? null : now,
            imageSource: "placeholder"
          }
        ],
        referenceLinks: parsedReferenceLinks,
        lastCheckedAt: breakdown.productPrice === null ? null : now
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
          {expanded ? "詳細入力を閉じる" : "詳細入力を開く"}
          <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded ? (
          <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">実質価格の内訳</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted" htmlFor="productPrice">商品価格</label>
                  <input id="productPrice" type="number" min="0" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted" htmlFor="shippingFee">送料</label>
                  <input id="shippingFee" type="number" min="0" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted" htmlFor="couponDiscount">クーポン値引き</label>
                  <input id="couponDiscount" type="number" min="0" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={couponDiscount} onChange={(event) => setCouponDiscount(event.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted" htmlFor="grantedPoints">付与ポイント</label>
                  <input id="grantedPoints" type="number" min="0" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={grantedPoints} onChange={(event) => setGrantedPoints(event.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted" htmlFor="pointRate">ポイント換算率</label>
                  <input id="pointRate" type="number" min="0" step="0.1" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={pointRate} onChange={(event) => setPointRate(event.target.value)} />
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">
                計算済み実質価格: {effectivePricePreview === null ? "未計算" : formatPrice(effectivePricePreview)}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">手入力値から計算します。外部サイトの価格取得は行いません。</p>
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="actualPriceMemo">実質価格メモ</label>
              <textarea id="actualPriceMemo" className="mt-2 min-h-24 w-full rounded-md border border-line px-3 py-2" value={actualPriceMemo} onChange={(event) => setActualPriceMemo(event.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">参考リンク</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-8 px-3 py-1"
                  onClick={() => setReferenceLinks((current) => [...current, { id: crypto.randomUUID(), kind: "other", label: "", url: "" }])}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>
              <div className="mt-2 space-y-3">
                {referenceLinks.map((link, index) => (
                  <div key={link.id} className="grid gap-2 rounded-lg border border-line bg-white p-3 md:grid-cols-[140px_1fr_1.3fr_auto]">
                    <select
                      className="rounded-md border border-line px-3 py-2 text-sm"
                      value={link.kind}
                      onChange={(event) => setReferenceLinks((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, kind: event.target.value as ReferenceLinkKind } : entry))}
                    >
                      <option value="kakaku">価格比較</option>
                      <option value="maker">公式</option>
                      <option value="other">その他</option>
                    </select>
                    <input
                      className="rounded-md border border-line px-3 py-2 text-sm"
                      value={link.label}
                      onChange={(event) => setReferenceLinks((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, label: event.target.value } : entry))}
                      placeholder="表示名"
                    />
                    <input
                      type="url"
                      className="rounded-md border border-line px-3 py-2 text-sm"
                      value={link.url}
                      onChange={(event) => setReferenceLinks((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, url: event.target.value } : entry))}
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-9 px-2"
                      onClick={() => setReferenceLinks((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                      aria-label="参考リンクを削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                <LinkIcon className="h-3.5 w-3.5" />
                参考リンクは保存のみで、価格や画像は取得しません。
              </p>
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
