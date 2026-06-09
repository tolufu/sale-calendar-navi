import type { ProductSearchCandidate, ProductSearchResult } from "@/lib/product-search/types";

export const DEFAULT_SEARCH_LIMIT = 5;
export const SEARCH_TIMEOUT_MS = 8000;

export function clampSearchLimit(limit: number | undefined, max = 10): number {
  const value = typeof limit === "number" && Number.isFinite(limit) ? limit : DEFAULT_SEARCH_LIMIT;
  return Math.min(Math.max(value, 1), max);
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

// 商品URLが渡された場合は末尾パスをキーワードとして抽出する。Yahooのみ末尾の.htmlを除去する。
export function extractSearchKeyword(value: string, options?: { stripHtmlSuffix?: boolean }): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    const cleaned = options?.stripHtmlSuffix ? last?.replace(/\.html$/, "") : last;
    return decodeURIComponent(cleaned ?? parsed.hostname);
  } catch {
    return trimmed;
  }
}

// API未設定時のプレースホルダー応答。providerごとの文言差分のみを引数で受ける。
export function buildMockSearchResult(params: {
  provider: string;
  keyword: string;
  exampleUrl: string;
  emptyMessage: string;
  configuredMessage: string;
}): ProductSearchResult {
  if (!params.keyword) {
    return { configured: false, candidates: [], message: params.emptyMessage };
  }
  return {
    configured: false,
    candidates: [createMockCandidate(params.provider, params.keyword, params.exampleUrl)],
    message: params.configuredMessage
  };
}
