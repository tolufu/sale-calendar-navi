"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/repositories/types";
import type { ProductSearchProviderResult } from "@/lib/product-search/types";
import { flattenProviderResults, sortCandidatesByEffectivePrice } from "@/lib/product-search/compare";
import { getProductImageSourceLabel, isAllowedProductImageUrl } from "@/lib/utils/product-image";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty"; results: ProductSearchProviderResult[] }
  | { status: "error"; message: string }
  | { status: "success"; results: ProductSearchProviderResult[] };

type CompareApiResponse = {
  query: string;
  results: ProductSearchProviderResult[];
  exchangeMessages?: string[];
  message?: string;
};

export function ComparePageClient() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [query, setQuery] = useState("");
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [exchangeMessages, setExchangeMessages] = useState<string[]>([]);

  useEffect(() => {
    void getRepositories().merchants.list()
      .then((items) => {
        const apiMerchants = items.filter((merchant) => merchant.supportsApi && merchant.supportsPriceAutoFetch);
        setMerchants(apiMerchants);
        setSelectedMerchantIds(apiMerchants.map((merchant) => merchant.merchantId));
      })
      .catch(() => setState({ status: "error", message: "ECマスタを読み込めませんでした。" }))
      .finally(() => setLoadingMerchants(false));
  }, []);

  const merchantById = useMemo(() => new Map(merchants.map((merchant) => [merchant.merchantId, merchant])), [merchants]);
  const providerResults = useMemo(
    () => state.status === "success" || state.status === "empty" ? state.results : [],
    [state]
  );
  const sortedCandidates = useMemo(() => sortCandidatesByEffectivePrice(flattenProviderResults(providerResults)), [providerResults]);

  function toggleMerchant(merchantId: string) {
    setSelectedMerchantIds((current) =>
      current.includes(merchantId) ? current.filter((id) => id !== merchantId) : [...current, merchantId]
    );
  }

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      setState({ status: "error", message: "商品URLまたはキーワードを入力してください。" });
      return;
    }
    if (selectedMerchantIds.length === 0) {
      setState({ status: "error", message: "検索対象のECを1つ以上選択してください。" });
      return;
    }

    setState({ status: "loading" });
    setExchangeMessages([]);
    try {
      const params = new URLSearchParams({
        q: trimmed,
        merchants: selectedMerchantIds.join(",")
      });
      const response = await fetch(`/api/products/compare?${params.toString()}`);
      const body = (await response.json()) as CompareApiResponse;
      if (!response.ok) {
        throw new Error(body.message ?? "商品候補を取得できませんでした。");
      }
      const candidates = flattenProviderResults(body.results);
      setState(candidates.length ? { status: "success", results: body.results } : { status: "empty", results: body.results });
      setExchangeMessages(body.exchangeMessages ?? []);
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "商品候補を取得できませんでした。" });
    }
  }

  if (loadingMerchants) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-ink">商品URLまたはキーワード</span>
            <input
              className="mt-2 w-full rounded-btn border border-line px-3 py-2 text-ink"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: ロボット掃除機 / https://..."
            />
          </label>
          <Button type="button" onClick={() => void handleSearch()} disabled={state.status === "loading"}>
            <Search className="mr-2 h-4 w-4" />
            {state.status === "loading" ? "検索中" : "参考価格を検索"}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {merchants.map((merchant) => (
            <label key={merchant.merchantId} className="inline-flex items-center gap-2 rounded-btn border border-line bg-white px-3 py-2 text-sm">
              <input type="checkbox" checked={selectedMerchantIds.includes(merchant.merchantId)} onChange={() => toggleMerchant(merchant.merchantId)} />
              {merchant.name}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          価格・送料・ポイントは各公式APIの取得時点の参考値です。外貨候補はFrankfurterの為替レートでJPY参考値も表示します。購入前にリンク先で商品、送料、クーポン、ポイント条件を確認してください。
        </p>
      </Card>

      {state.status === "loading" ? <Skeleton className="h-72 w-full" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} /> : null}
      {state.status === "idle" ? (
        <EmptyState title="商品を検索してください" description="楽天、Yahoo!ショッピング、eBayの公式APIから候補を取得し、取得時点の参考値として表示します。" />
      ) : null}
      {state.status === "empty" ? (
        <EmptyState title="候補が見つかりませんでした" description="検索語を変えるか、欲しいもの登録で手入力してください。" />
      ) : null}

      {providerResults.length > 0 ? (
        <Card>
          <h2 className="text-lg font-bold text-ink">EC別の取得状況</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {providerResults.map((result) => (
              <div key={result.merchantId} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <p className="font-semibold text-ink">{merchantById.get(result.merchantId)?.name ?? result.merchantId}</p>
                <p className="mt-1 text-muted">{result.candidates.length}件 / {result.configured ? "API設定あり" : "API未設定または手入力対象"}</p>
                {result.message ? <p className="mt-1 text-xs leading-5 text-muted">{result.message}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {exchangeMessages.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <h2 className="font-bold text-amber-900">為替換算の補足</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {exchangeMessages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </Card>
      ) : null}

      {state.status === "success" ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-ink">実質価格が安い順</h2>
            <p className="text-sm text-muted">価格未取得の候補は末尾に表示します。</p>
          </div>
          <div className="grid gap-4">
            {sortedCandidates.map((candidate) => {
              const merchant = merchantById.get(candidate.provider);
              const imageAllowed = candidate.imageSource !== "placeholder" && isAllowedProductImageUrl(candidate.imageSource, candidate.imageUrl);
              return (
                <Card key={`${candidate.provider}-${candidate.itemCode}`} className="grid gap-4 md:grid-cols-[112px_1fr_auto]">
                  {imageAllowed && candidate.imageUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 公式APIの許可ホスト画像URLのみを表示する。 */}
                      <img src={candidate.imageUrl} alt="" className="h-28 w-28 rounded-lg border border-line object-cover" />
                      <p className="mt-1 text-[11px] text-muted">画像出典: {getProductImageSourceLabel(candidate.imageSource)}</p>
                    </div>
                  ) : (
                    <div className="grid h-28 w-28 place-items-center rounded-lg border border-dashed border-line bg-surface text-xs text-muted">画像なし</div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{merchant?.name ?? candidate.provider}</Badge>
                      <Badge>{candidate.inStock === null ? "在庫不明" : candidate.inStock ? "在庫あり" : "在庫なし"}</Badge>
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-bold text-ink">{candidate.title}</h3>
                    <p className="mt-1 text-sm text-muted">{candidate.shopName ?? "店舗名不明"}</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                      <PriceTerm label="価格" value={formatCurrency(candidate.price, candidate.currency)} />
                      <PriceTerm label="送料" value={formatCurrency(candidate.shippingFee, candidate.currency, "-")} />
                      <PriceTerm label="付与ポイント" value={candidate.points === null ? "-" : `${candidate.points.toLocaleString("ja-JP")} pt`} />
                      <PriceTerm label="実質価格" value={formatCurrency(candidate.effectivePrice, candidate.currency)} strong />
                    </dl>
                    {candidate.currency !== "JPY" ? (
                      <p className="mt-2 text-sm font-semibold text-ink">
                        JPY参考: {candidate.effectivePriceJpy === null ? "換算未取得" : formatCurrency(candidate.effectivePriceJpy, "JPY")}
                        {candidate.exchangeRateToJpy ? (
                          <span className="ml-2 text-xs font-normal text-muted">
                            1 {candidate.currency} = {candidate.exchangeRateToJpy.toLocaleString("ja-JP", { maximumFractionDigits: 4 })} JPY
                            {candidate.exchangeRateDate ? ` (${candidate.exchangeRateDate})` : ""}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">取得時点の参考値です。表示条件は購入前にリンク先で確認してください。</p>
                  </div>
                  <div className="flex flex-col gap-2 md:min-w-40">
                    <a className={secondaryLinkClass} href={candidate.affiliateUrl ?? candidate.itemUrl} target="_blank" rel="noreferrer">
                      商品を見る
                    </a>
                    <Link className={primaryLinkClass} href={wishlistHref(candidate)}>
                      欲しいものに追加
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PriceTerm({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={strong ? "font-bold text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}

function formatCurrency(value: number | null, currency: string, empty = "未取得"): string {
  if (value === null) {
    return empty;
  }
  if (currency === "JPY") {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
  }
  return `${currency} ${value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}`;
}

function wishlistHref(candidate: { title: string; provider: string; itemUrl: string; affiliateUrl: string | null; price: number | null; shippingFee: number | null; points: number | null; imageSource: string; imageUrl: string | null; currency: string; priceJpy?: number | null; shippingFeeJpy?: number | null; exchangeRateToJpy?: number | null; exchangeRateDate?: string | null }) {
  const params = new URLSearchParams({
    title: candidate.title,
    merchantId: candidate.provider,
    productUrl: candidate.affiliateUrl ?? candidate.itemUrl,
    source: "compare",
    currency: candidate.currency
  });
  if (candidate.currency === "JPY") {
    if (candidate.price !== null) params.set("productPrice", String(candidate.price));
    if (candidate.shippingFee !== null) params.set("shippingFee", String(candidate.shippingFee));
    if (candidate.points !== null) params.set("grantedPoints", String(candidate.points));
  } else {
    if (candidate.priceJpy !== null && candidate.priceJpy !== undefined) params.set("productPrice", String(candidate.priceJpy));
    if (candidate.shippingFeeJpy !== null && candidate.shippingFeeJpy !== undefined) params.set("shippingFee", String(candidate.shippingFeeJpy));
    params.set(
      "actualPriceMemo",
      `元通貨価格: ${formatCurrency(candidate.price, candidate.currency)} / 送料: ${formatCurrency(candidate.shippingFee, candidate.currency, "-")}。JPYは為替APIによる取得時点の参考換算です。${candidate.exchangeRateToJpy ? ` 1 ${candidate.currency} = ${candidate.exchangeRateToJpy} JPY${candidate.exchangeRateDate ? ` (${candidate.exchangeRateDate})` : ""}` : ""}`
    );
  }
  if (candidate.imageSource !== "placeholder" && candidate.imageUrl) {
    params.set("imageSource", candidate.imageSource);
    params.set("imageUrl", candidate.imageUrl);
  }
  return `/wishlist/new?${params.toString()}`;
}

const primaryLinkClass = "inline-flex min-h-10 items-center justify-center rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark";
const secondaryLinkClass = "inline-flex min-h-10 items-center justify-center rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface";
