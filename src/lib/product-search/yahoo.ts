import type { ProductSearchCandidate, ProductSearchInput, ProductSearchResult } from "@/lib/product-search/types";
import { clampSearchLimit, createMockCandidate, createSearchFailureResult, numericOrNull, withTimeout } from "@/lib/product-search/common";
import { sanitizeYahooImageUrl } from "@/lib/utils/product-image";

const YAHOO_SEARCH_ENDPOINT = "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";
const SEARCH_FAILURE_MESSAGE = "Yahoo!ショッピングAPIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。";

type YahooApiItem = {
  code?: string;
  name?: string;
  url?: string;
  inStock?: boolean;
  image?: {
    small?: string;
    medium?: string;
  };
  price?: number;
  point?: {
    amount?: number;
    lyLimitedBonusAmount?: number;
    premiumAmount?: number;
    lyLimitedPremiumBonusAmount?: number;
  };
  shipping?: {
    code?: number;
  };
  seller?: {
    name?: string;
  };
};

type YahooApiResponse = {
  hits?: YahooApiItem[];
};

export function extractYahooKeyword(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(pathParts[pathParts.length - 1]?.replace(/\.html$/, "") ?? parsed.hostname);
  } catch {
    return trimmed;
  }
}

function buildAffiliateUrl(itemUrl: string, vc: string | undefined): string | null {
  if (!vc) {
    return null;
  }
  try {
    const parsed = new URL(itemUrl);
    parsed.searchParams.set("vc", vc);
    return parsed.toString();
  } catch {
    return null;
  }
}

function pointAmount(item: YahooApiItem): number | null {
  const values = [
    item.point?.amount,
    item.point?.lyLimitedBonusAmount,
    item.point?.premiumAmount,
    item.point?.lyLimitedPremiumBonusAmount
  ].map(numericOrNull);
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return total > 0 ? total : null;
}

function toCandidate(item: YahooApiItem, vc: string | undefined): ProductSearchCandidate | null {
  if (!item.name || !item.url) {
    return null;
  }

  const imageUrl = sanitizeYahooImageUrl(item.image?.medium ?? item.image?.small);

  return {
    provider: "yahoo-shopping",
    itemCode: item.code ?? item.url,
    title: item.name,
    itemUrl: item.url,
    affiliateUrl: buildAffiliateUrl(item.url, vc),
    imageUrl,
    imageSource: imageUrl ? "yahoo_api" : "placeholder",
    price: numericOrNull(item.price),
    shippingFee: item.shipping?.code === 2 ? 0 : null,
    points: pointAmount(item),
    currency: "JPY",
    inStock: typeof item.inStock === "boolean" ? item.inStock : null,
    shopName: item.seller?.name ?? null
  };
}

function mockSearch(input: ProductSearchInput): ProductSearchResult {
  const keyword = extractYahooKeyword(input.query);
  if (!keyword) {
    return {
      configured: false,
      candidates: [],
      message: "Yahoo!ショッピングAPIキーが未設定です。キーワードを入れるとモック候補を表示できます。"
    };
  }

  return {
    configured: false,
    candidates: [createMockCandidate("yahoo-shopping", keyword, "https://store.shopping.yahoo.co.jp/example/mock-item.html")],
    message: "Yahoo!ショッピングAPIキーが未設定のため、プレースホルダー候補を表示しています。手入力のまま保存できます。"
  };
}

export class YahooShoppingProductSearchProvider {
  readonly merchantId = "yahoo-shopping";

  constructor(
    private readonly appId = process.env.YAHOO_SHOPPING_APP_ID,
    private readonly vc = process.env.YAHOO_VC
  ) {}

  async search(input: ProductSearchInput): Promise<ProductSearchResult> {
    const keyword = extractYahooKeyword(input.query);
    if (!this.appId) {
      return mockSearch(input);
    }
    if (!keyword) {
      return { configured: true, candidates: [], message: "Yahoo!ショッピングの商品URLまたはキーワードを入力してください。" };
    }

    const url = new URL(YAHOO_SEARCH_ENDPOINT);
    url.searchParams.set("appid", this.appId);
    url.searchParams.set("query", keyword);
    url.searchParams.set("results", String(clampSearchLimit(input.limit, 20)));
    url.searchParams.set("image_size", "300");

    const timeout = withTimeout();
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        next: { revalidate: 1800 },
        signal: timeout.signal
      });
      if (!response.ok) {
        return createSearchFailureResult(SEARCH_FAILURE_MESSAGE);
      }

      const body = (await response.json()) as YahooApiResponse;
      const candidates = (body.hits ?? [])
        .map((item) => toCandidate(item, this.vc))
        .filter((item): item is ProductSearchCandidate => item !== null);

      return {
        configured: true,
        candidates,
        message: candidates.length ? null : "候補が見つかりませんでした。手入力で続けられます。"
      };
    } catch {
      return createSearchFailureResult(SEARCH_FAILURE_MESSAGE);
    } finally {
      timeout.clear();
    }
  }
}

export function createYahooShoppingProductSearchProvider() {
  return new YahooShoppingProductSearchProvider();
}
