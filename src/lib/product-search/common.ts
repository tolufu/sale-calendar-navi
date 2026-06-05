import type { ProductSearchCandidate } from "@/lib/product-search/types";

export const DEFAULT_SEARCH_LIMIT = 5;
export const SEARCH_TIMEOUT_MS = 8000;

export function clampSearchLimit(limit: number | undefined, max = 10): number {
  return Math.min(Math.max(limit ?? DEFAULT_SEARCH_LIMIT, 1), max);
}

export function createSearchFailureResult(message: string) {
  return {
    configured: true,
    candidates: [],
    message
  };
}

export function numericOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function withTimeout(): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId)
  };
}

export function createMockCandidate(provider: string, query: string, itemUrl: string): ProductSearchCandidate {
  const keyword = query.trim() || "検索キーワード";
  return {
    provider,
    itemCode: `mock-${provider}-${encodeURIComponent(keyword)}`,
    title: `${keyword}（モック候補）`,
    itemUrl,
    affiliateUrl: null,
    imageUrl: null,
    imageSource: "placeholder",
    price: null,
    shippingFee: null,
    points: null,
    currency: "JPY",
    priceJpy: null,
    shippingFeeJpy: null,
    exchangeRateToJpy: null,
    exchangeRateDate: null,
    inStock: null,
    shopName: `${provider} API未設定`
  };
}
