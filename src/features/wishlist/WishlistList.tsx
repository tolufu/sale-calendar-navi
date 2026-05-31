"use client";

import Image from "next/image";
import { isAllowedRakutenImageUrl } from "@/lib/utils/rakuten-image";
import Link from "next/link";
import { Bell, ExternalLink, LinkIcon, Pencil, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, PriceCandidate, SaleEvent, WishItem } from "@/lib/repositories/types";
import { buildAffiliateUrl } from "@/lib/utils/affiliate";
import { calculateBuyTimingScore, type SaleImportance } from "@/lib/utils/buy-timing-score";
import { getMerchantToneClass } from "@/lib/utils/merchant";
import { formatPrice, pickCandidateEffectivePrice, pickEffectivePriceDiff } from "@/lib/utils/price";
import { buildCompareShareText, buildXIntentUrl } from "@/lib/utils/share";

function imagePath(key: string): string {
  return `/images/placeholders/${key}.svg`;
}

function merchantName(merchants: Merchant[], merchantId: string): string {
  return merchants.find((merchant) => merchant.merchantId === merchantId)?.name ?? merchantId;
}

function parseDesiredPrice(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

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

type SortKey = "created_desc" | "desired_price_asc" | "sale_start_asc";

type CandidateEditDraft = {
  id: string;
  merchantId: string;
  originalUrl: string;
  affiliateUrl: string | null;
  imageSource: "placeholder" | "rakuten_api";
  imageUrl: string | null;
  productPrice: string;
  shippingFee: string;
  couponDiscount: string;
  grantedPoints: string;
  pointRate: string;
  priceMemo: string;
};

function toCandidateDraft(candidate: PriceCandidate): CandidateEditDraft {
  return {
    id: crypto.randomUUID(),
    merchantId: candidate.merchantId,
    originalUrl: candidate.originalUrl,
    affiliateUrl: candidate.affiliateUrl,
    imageSource: candidate.imageSource,
    imageUrl: candidate.imageUrl ?? null,
    productPrice: candidate.breakdown.productPrice?.toString() ?? "",
    shippingFee: candidate.breakdown.shippingFee?.toString() ?? "",
    couponDiscount: candidate.breakdown.couponDiscount?.toString() ?? "",
    grantedPoints: candidate.breakdown.grantedPoints?.toString() ?? "",
    pointRate: candidate.breakdown.pointRate?.toString() ?? "1",
    priceMemo: candidate.priceMemo ?? ""
  };
}

function createCandidateDraft(merchantId: string): CandidateEditDraft {
  return {
    id: crypto.randomUUID(),
    merchantId,
    originalUrl: "",
    affiliateUrl: null,
    imageSource: "placeholder",
    imageUrl: null,
    productPrice: "",
    shippingFee: "",
    couponDiscount: "",
    grantedPoints: "",
    pointRate: "1",
    priceMemo: ""
  };
}

function parseCandidateDrafts(drafts: CandidateEditDraft[], merchants: Merchant[]): PriceCandidate[] {
  const now = new Date().toISOString();
  return drafts
    .filter((draft) => draft.originalUrl.trim())
    .map((draft) => {
      const merchant = merchants.find((entry) => entry.merchantId === draft.merchantId);
      if (!merchant) {
        throw new Error("候補のECを選択してください。");
      }
      try {
        const parsedUrl = new URL(draft.originalUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("unsupported protocol");
        }
      } catch {
        throw new Error("候補URLの形式を確認してください。");
      }

      const breakdown = {
        productPrice: parseOptionalAmount(draft.productPrice),
        shippingFee: parseOptionalAmount(draft.shippingFee),
        couponDiscount: parseOptionalAmount(draft.couponDiscount),
        grantedPoints: parseOptionalAmount(draft.grantedPoints),
        pointRate: parseOptionalAmount(draft.pointRate)
      };

      return {
        merchantId: draft.merchantId,
        originalUrl: draft.originalUrl,
        affiliateUrl: draft.affiliateUrl ?? buildAffiliateUrl(draft.originalUrl, merchant.affiliate),
        breakdown,
        priceMemo: draft.priceMemo.trim() || null,
        lastCheckedAt: breakdown.productPrice === null ? null : now,
        imageSource: draft.imageSource,
        imageUrl: draft.imageSource === "rakuten_api" ? draft.imageUrl : null
      };
    });
}

function getSaleStatus(sale: SaleEvent | undefined): { label: string; className: string } {
  if (!sale) {
    return { label: "セール未指定", className: "border-line bg-surface text-muted" };
  }
  const now = Date.now();
  const start = new Date(sale.startAt).getTime();
  const end = new Date(sale.endAt).getTime();
  if (now >= start && now <= end) {
    return { label: "開催中", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (now < start) {
    return { label: "開催予定", className: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  return { label: "終了", className: "border-line bg-surface text-muted" };
}

function desiredPriceStatus(item: WishItem, effectivePrice: number | null): string | null {
  if (item.desiredPrice === null || effectivePrice === null) {
    return null;
  }
  if (effectivePrice <= item.desiredPrice) {
    return "希望価格内";
  }
  return `希望価格まで ${formatPrice(effectivePrice - item.desiredPrice)}`;
}

function saleImportance(sale: SaleEvent | undefined): SaleImportance {
  if (!sale) {
    return "low";
  }
  const now = Date.now();
  const start = new Date(sale.startAt).getTime();
  const end = new Date(sale.endAt).getTime();
  if (now >= start && now <= end) {
    return "high";
  }
  if (now < start) {
    return "medium";
  }
  return "low";
}

export function WishlistList() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("created_desc");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesiredPrice, setDraftDesiredPrice] = useState("");
  const [draftActualPriceMemo, setDraftActualPriceMemo] = useState("");
  const [draftCandidates, setDraftCandidates] = useState<CandidateEditDraft[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const uid = await getAnonymousUserId();
      const [wishItems, merchantItems, saleItems] = await Promise.all([
        repositories.wishlist.list(uid),
        repositories.merchants.list(),
        repositories.sales.list()
      ]);
      setUserId(uid);
      setItems(wishItems);
      setMerchants(merchantItems);
      setSales(saleItems);
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
    setDraftCandidates((item.candidates?.length ? item.candidates : []).map(toCandidateDraft));
  }

  async function saveEdit(item: WishItem) {
    if (!userId) return;
    try {
      const candidates = parseCandidateDrafts(draftCandidates, merchants);
      await getRepositories().wishlist.update(userId, item.id, {
        title: draftTitle.trim() || item.title,
        desiredPrice: parseDesiredPrice(draftDesiredPrice),
        actualPriceMemo: draftActualPriceMemo.trim() || null,
        candidates: candidates.length ? candidates : undefined
      });
      setEditingId(null);
      setToast({ message: "欲しいものを更新しました。" });
      await load();
    } catch (saveError) {
      setToast({
        message: saveError instanceof Error ? saveError.message : "欲しいものを更新できませんでした。",
        variant: "error"
      });
    }
  }

  async function remove(item: WishItem) {
    if (!userId) {
      return;
    }
    const confirmed = window.confirm(`「${item.title}」を欲しいもの一覧から削除します。よろしいですか？`);
    if (!confirmed) {
      return;
    }

    try {
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
      setToast({ message: "欲しいものを削除しました。" });
      await load();
    } catch (removeError) {
      setToast({
        message: removeError instanceof Error ? removeError.message : "欲しいものを削除できませんでした。",
        variant: "error"
      });
    }
  }

  function shareCompare(item: WishItem, effectivePrice: number | null) {
    const confirmed = window.confirm("共有文面には保存URL、匿名ID、非公開メモを含めません。Xの投稿画面を開きますか？");
    if (!confirmed) {
      return;
    }
    window.open(buildXIntentUrl(buildCompareShareText(item, effectivePrice)), "_blank", "noopener,noreferrer");
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

  const sortedItems = [...items].sort((a, b) => {
    if (sortKey === "desired_price_asc") {
      return (a.desiredPrice ?? Number.MAX_SAFE_INTEGER) - (b.desiredPrice ?? Number.MAX_SAFE_INTEGER);
    }
    if (sortKey === "sale_start_asc") {
      const aSale = sales.find((sale) => sale.id === a.targetSaleEventId);
      const bSale = sales.find((sale) => sale.id === b.targetSaleEventId);
      return (aSale ? new Date(aSale.startAt).getTime() : Number.MAX_SAFE_INTEGER) -
        (bSale ? new Date(bSale.startAt).getTime() : Number.MAX_SAFE_INTEGER);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">登録 {items.length} 件</p>
        <label className="text-sm font-semibold">
          並び替え
          <select className="ml-0 mt-2 w-full rounded-md border border-line px-3 py-2 text-sm sm:ml-2 sm:mt-0 sm:w-auto" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="created_desc">登録が新しい順</option>
            <option value="desired_price_asc">希望価格が低い順</option>
            <option value="sale_start_asc">関連セールが近い順</option>
          </select>
        </label>
      </div>
      <div className="space-y-4">
      {sortedItems.map((item) => {
        const merchant = merchants.find((entry) => entry.merchantId === item.merchantId);
        const primaryCandidate = item.candidates?.[0] ?? null;
        const primaryEffectivePrice = primaryCandidate ? pickCandidateEffectivePrice(primaryCandidate) : null;
        const diff = item.candidates ? pickEffectivePriceDiff(item.candidates) : null;
        const relatedSale = sales.find((sale) => sale.id === item.targetSaleEventId);
        const saleStatus = getSaleStatus(relatedSale);
        const priceStatus = desiredPriceStatus(item, primaryEffectivePrice);
        const buyTimingScore = calculateBuyTimingScore({
          desiredPrice: item.desiredPrice,
          currentEffectivePrice: primaryEffectivePrice,
          saleImportance: saleImportance(relatedSale),
          previousEffectivePrice: null,
          checkedAt: item.lastCheckedAt ?? null
        });
        const linkLabel = item.merchantId === "rakuten" ? "楽天で見る" : "外部リンク";
        const showRakutenImage = primaryCandidate?.imageSource === "rakuten_api" && primaryCandidate.imageUrl && isAllowedRakutenImageUrl(primaryCandidate.imageUrl);
        return (
          <Card key={item.id} className="flex flex-col gap-4 lg:flex-row">
            {/* 画像 */}
            <div className="shrink-0">
              {showRakutenImage && primaryCandidate?.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- 楽天公式APIの許可ホスト画像URLのみを描画時に再検証して表示する。 */}
                  <img src={primaryCandidate.imageUrl} alt="" className="h-28 w-28 rounded-lg border border-line object-cover" />
                  <p className="mt-1 text-[11px] text-muted" title="楽天APIから返された画像URLのみ表示しています。">画像: 楽天API</p>
                </>
              ) : (
                <Image src={imagePath(item.placeholderKey)} alt="" width={112} height={112} className="h-28 w-28 rounded-lg border border-line bg-surface" />
              )}
            </div>

            {editingId === item.id ? (
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  aria-label="商品名を編集"
                />
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
                <div className="space-y-3 rounded-lg border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">候補と内訳</p>
                    <Button type="button" variant="secondary" className="min-h-8 px-3 py-1" onClick={() => setDraftCandidates((current) => [...current, createCandidateDraft(merchants[0]?.merchantId ?? item.merchantId)])}>候補追加</Button>
                  </div>
                  {draftCandidates.map((candidate, index) => (
                    <div key={candidate.id} className="rounded-md border border-line bg-white p-3">
                      <div className="grid gap-2 md:grid-cols-[120px_1fr_auto]">
                        <select aria-label="編集候補EC" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.merchantId} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, merchantId: event.target.value } : entry))}>
                          {merchants.map((entry) => <option key={entry.merchantId} value={entry.merchantId}>{entry.name}</option>)}
                        </select>
                        <input aria-label="編集候補URL" type="url" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.originalUrl} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, originalUrl: event.target.value } : entry))} placeholder="https://..." />
                        <Button type="button" variant="ghost" className="min-h-8 px-2" onClick={() => setDraftCandidates((current) => current.filter((_, currentIndex) => currentIndex !== index))} aria-label="候補を削除"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-5">
                        <input aria-label="編集商品価格" type="number" min="0" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.productPrice} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, productPrice: event.target.value } : entry))} placeholder="商品価格" />
                        <input aria-label="編集送料" type="number" min="0" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.shippingFee} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, shippingFee: event.target.value } : entry))} placeholder="送料" />
                        <input aria-label="編集クーポン値引き" type="number" min="0" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.couponDiscount} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, couponDiscount: event.target.value } : entry))} placeholder="クーポン" />
                        <input aria-label="編集付与ポイント" type="number" min="0" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.grantedPoints} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, grantedPoints: event.target.value } : entry))} placeholder="付与pt" />
                        <input aria-label="編集ポイント換算率" type="number" min="0" step="0.1" className="rounded-md border border-line px-3 py-2 text-sm" value={candidate.pointRate} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, pointRate: event.target.value } : entry))} placeholder="換算率" />
                      </div>
                      <textarea aria-label="編集候補メモ" className="mt-2 min-h-16 w-full rounded-md border border-line px-3 py-2 text-sm" value={candidate.priceMemo} onChange={(event) => setDraftCandidates((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, priceMemo: event.target.value } : entry))} placeholder="候補メモ" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void saveEdit(item)}>保存</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>キャンセル</Button>
                </div>
              </div>
            ) : (
              <>
                {/* 情報 */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge merchant={merchant} />
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${saleStatus.className}`}>{saleStatus.label}</span>
                    {priceStatus ? <span className="inline-flex rounded-full border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted">{priceStatus}</span> : null}
                  </div>
                  <p className="mt-2 font-semibold text-ink">{item.title}</p>
                  <div className="mt-3 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2">
                    <p>希望価格: <span className="font-semibold text-ink">{formatPrice(item.desiredPrice)}</span></p>
                    <p>計算済み実質価格: <span className="font-semibold text-ink">{primaryEffectivePrice === null ? "未計算" : formatPrice(primaryEffectivePrice)}</span></p>
                    <p>最終確認日: {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleDateString("ja-JP") : "未確認"}</p>
                    {relatedSale ? <p>関連セール: {relatedSale.title}</p> : null}
                  </div>
                  <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
                    {buyTimingScore.status === "scored" ? (
                      <p className="text-sm font-semibold text-ink">買い時スコア: {buyTimingScore.score} / 100（{buyTimingScore.label}）</p>
                    ) : (
                      <p className="text-sm font-semibold text-ink">{buyTimingScore.label}</p>
                    )}
                    <p className="mt-1 text-xs leading-5 text-muted">{buyTimingScore.reasons[0]}</p>
                  </div>
                  {item.actualPriceMemo ? <p className="mt-2 text-sm leading-6 text-muted">前回メモ: {item.actualPriceMemo}</p> : null}
                  {item.referenceLinks?.length ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-semibold text-muted">
                      <LinkIcon className="h-3.5 w-3.5" />
                      参考リンク {item.referenceLinks.length}件
                    </p>
                  ) : null}
                  {diff ? (
                    <p className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted">
                      差額目安: {merchantName(merchants, diff.lowerMerchantId)}が{formatPrice(diff.amount)}低い見込み（手入力値）
                    </p>
                  ) : null}
                  {item.referenceLinks?.length ? (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-accent">参考リンクと元URL</summary>
                      <div className="mt-2 space-y-2 rounded-md border border-line bg-surface p-3">
                        {primaryCandidate?.originalUrl ? (
                          <a href={primaryCandidate.originalUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-xs text-muted underline">
                            元URLを確認
                          </a>
                        ) : null}
                        {item.referenceLinks.map((link) => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block break-all text-xs font-semibold text-accent underline">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>

                {/* 操作導線 */}
                <div className="flex flex-wrap gap-2 lg:w-52 lg:flex-col">
                  <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-btn bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accentDark lg:flex-none lg:w-full">
                    <ExternalLink className="h-4 w-4" />
                    {linkLabel}
                  </a>
                  <Button variant="secondary" className="flex-1 gap-2 lg:flex-none lg:w-full" onClick={() => startEdit(item)}>
                    <Pencil className="h-4 w-4" />
                    価格・メモを更新
                  </Button>
                  {item.targetSaleEventId ? (
                    <Link href={`/sales/${item.targetSaleEventId}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-btn border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface lg:flex-none lg:w-full">
                      関連セール
                    </Link>
                  ) : null}
                  <Link href="/settings/notifications" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-btn border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface lg:flex-none lg:w-full">
                    <Bell className="h-4 w-4" />
                    通知設定
                  </Link>
                  <Button variant="secondary" className="flex-1 gap-2 lg:flex-none lg:w-full" onClick={() => shareCompare(item, primaryEffectivePrice)}>
                    <Share2 className="h-4 w-4" />
                    Xで共有
                  </Button>
                  <Button variant="danger" className="flex-1 gap-2 lg:flex-none lg:w-full" onClick={() => void remove(item)}>
                    <Trash2 className="h-4 w-4" />
                    削除
                  </Button>
                </div>
              </>
            )}
          </Card>
        );
      })}
      {toast ? <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /> : null}
      </div>
    </div>
  );
}

function Badge({ merchant }: { merchant: Merchant | undefined }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getMerchantToneClass(merchant)}`}>
      {merchant?.name ?? "EC未設定"}
    </span>
  );
}
