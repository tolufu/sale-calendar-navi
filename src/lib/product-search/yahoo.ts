import type { ProductSearchCandidate, ProductSearchInput, ProductSearchResult } from "@/lib/product-search/types";
import { buildMockSearchResult, clampSearchLimit, createSearchFailureResult, extractSearchKeyword, numericOrNull, withTimeout } from "@/lib/product-search/common";
import { sanitizeYahooImageUrl } from "@/lib/utils/product-image";

const MERCHANT_ID = "yahoo-shopping";
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
  // amountは全ユーザー共通の付与ポイント。premium/期間限定ボーナスは会員条件付きで二重計上の恐れもあるため、
  // 中立な実質価格比較では基本ポイント(amount)のみを採用する。
  const amount = numericOrNull(item.point?.amount);
  return amount && amount > 0 ? amount : null;
}

function toCandidate(item: YahooApiItem, vc: string | undefined): ProductSearchCandidate | null {
  if (!item.name || !item.url) {
    return null;
  }

  const imageUrl = sanitizeYahooImageUrl(item.image?.medium ?? item.image?.small);

  return {
    provider: MERCHANT_ID,
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
  return buildMockSearchResult({
    provider: MERCHANT_ID,
    keyword: extractSearchKeyword(input.query, { stripHtmlSuffix: true }),
    exampleUrl: "https://store.shopping.yahoo.co.jp/example/mock-item.html",
    emptyMessage: "Yahoo!ショッピングAPIキーが未設定です。キーワードを入れるとモック候補を表示できます。",
    configuredMessage: "Yahoo!ショッピングAPIキーが未設定のため、プレースホルダー候補を表示しています。手入力のまま保存できます。"
  });
}

export class YahooShoppingProductSearchProvider {
  readonly merchantId = MERCHANT_ID;

  constructor(
    private readonly appId = process.env.YAHOO_SHOPPING_APP_ID,
    private readonly vc = process.env.YAHOO_VC
  ) {}

  async search(input: ProductSearchInput): Promise<ProductSearchResult> {
    const keyword = extractSearchKeyword(input.query, { stripHtmlSuffix: true });
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
