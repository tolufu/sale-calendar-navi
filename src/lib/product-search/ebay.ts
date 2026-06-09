import type { ProductSearchCandidate, ProductSearchInput, ProductSearchResult } from "@/lib/product-search/types";
import { buildMockSearchResult, clampSearchLimit, createSearchFailureResult, extractSearchKeyword, numericOrNull, withTimeout } from "@/lib/product-search/common";
import { sanitizeEbayImageUrl } from "@/lib/utils/product-image";

const MERCHANT_ID = "ebay";
const EBAY_SEARCH_ENDPOINT = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_TOKEN_ENDPOINT = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_FAILURE_MESSAGE = "eBay Browse APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。";
const TOKEN_FAILURE_MESSAGE = "eBay Browse APIのアクセストークンを取得できませんでした。手入力で続けてください。";

type Money = {
  value?: string;
  currency?: string;
};

type EbayApiItem = {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  price?: Money;
  image?: {
    imageUrl?: string;
  };
  seller?: {
    username?: string;
  };
  shippingOptions?: Array<{
    shippingCost?: Money;
  }>;
  estimatedAvailabilities?: Array<{
    estimatedAvailabilityStatus?: string;
    estimatedAvailableQuantity?: number;
  }>;
};

type EbaySearchResponse = {
  itemSummaries?: EbayApiItem[];
};

type EbayTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

export function clearEbayTokenCacheForTest(): void {
  cachedToken = null;
}

function parseMoney(value: Money | undefined): number | null {
  if (!value?.value) {
    return null;
  }
  const parsed = Number(value.value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function inStock(item: EbayApiItem): boolean | null {
  const availability = item.estimatedAvailabilities?.[0];
  if (!availability) {
    return null;
  }
  if (availability.estimatedAvailabilityStatus === "IN_STOCK") {
    return true;
  }
  if (availability.estimatedAvailabilityStatus === "OUT_OF_STOCK") {
    return false;
  }
  const quantity = numericOrNull(availability.estimatedAvailableQuantity);
  return quantity === null ? null : quantity > 0;
}

function toCandidate(item: EbayApiItem): ProductSearchCandidate | null {
  if (!item.title || !item.itemWebUrl) {
    return null;
  }

  const imageUrl = sanitizeEbayImageUrl(item.image?.imageUrl);
  const shippingCost = item.shippingOptions?.[0]?.shippingCost;
  const currency = item.price?.currency ?? shippingCost?.currency ?? "USD";
  // 送料が商品価格と異なる通貨で返る場合は、同一レート換算で歪むため採用しない。
  const shippingFee = shippingCost?.currency && shippingCost.currency !== currency ? null : parseMoney(shippingCost);
  // 0円出品（オプション選択待ち等のプレースホルダー）は最安誤判定を避けるため未取得扱いにする。
  const rawPrice = parseMoney(item.price);
  const price = rawPrice === 0 ? null : rawPrice;

  return {
    provider: MERCHANT_ID,
    itemCode: item.itemId ?? item.itemWebUrl,
    title: item.title,
    itemUrl: item.itemWebUrl,
    affiliateUrl: null,
    imageUrl,
    imageSource: imageUrl ? "ebay_api" : "placeholder",
    price,
    shippingFee,
    points: null,
    currency,
    inStock: inStock(item),
    shopName: item.seller?.username ?? null
  };
}

function mockSearch(input: ProductSearchInput): ProductSearchResult {
  return buildMockSearchResult({
    provider: MERCHANT_ID,
    keyword: extractSearchKeyword(input.query),
    exampleUrl: "https://www.ebay.com/itm/mock-item",
    emptyMessage: "eBay Browse APIキーが未設定です。キーワードを入れるとモック候補を表示できます。",
    configuredMessage: "eBay Browse APIキーが未設定のため、プレースホルダー候補を表示しています。手入力のまま保存できます。"
  });
}

export class EbayBrowseProductSearchProvider {
  readonly merchantId = MERCHANT_ID;

  constructor(
    private readonly clientId = process.env.EBAY_CLIENT_ID,
    private readonly clientSecret = process.env.EBAY_CLIENT_SECRET,
    private readonly marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_US"
  ) {}

  private async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
      return cachedToken.token;
    }

    const timeout = withTimeout();
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope"
      });
      const response = await fetch(EBAY_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded"
        },
        body,
        signal: timeout.signal
      });
      if (!response.ok) {
        return null;
      }

      const token = (await response.json()) as EbayTokenResponse;
      if (!token.access_token) {
        return null;
      }
      cachedToken = {
        token: token.access_token,
        expiresAt: Date.now() + Math.max((token.expires_in ?? 300) - 60, 60) * 1000
      };
      return cachedToken.token;
    } catch {
      return null;
    } finally {
      timeout.clear();
    }
  }

  async search(input: ProductSearchInput): Promise<ProductSearchResult> {
    if (!this.clientId || !this.clientSecret) {
      return mockSearch(input);
    }
    const query = extractSearchKeyword(input.query);
    if (!query) {
      return { configured: true, candidates: [], message: "eBayの商品URLまたはキーワードを入力してください。" };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return createSearchFailureResult(TOKEN_FAILURE_MESSAGE);
    }

    const url = new URL(EBAY_SEARCH_ENDPOINT);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(clampSearchLimit(input.limit, 20)));

    const timeout = withTimeout();
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
          "x-ebay-c-marketplace-id": this.marketplaceId
        },
        next: { revalidate: 1800 },
        signal: timeout.signal
      });
      if (!response.ok) {
        return createSearchFailureResult(SEARCH_FAILURE_MESSAGE);
      }

      const body = (await response.json()) as EbaySearchResponse;
      const candidates = (body.itemSummaries ?? [])
        .map(toCandidate)
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

export function createEbayBrowseProductSearchProvider() {
  return new EbayBrowseProductSearchProvider();
}
