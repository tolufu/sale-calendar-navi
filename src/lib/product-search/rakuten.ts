import type {
  ProductSearchCandidate,
  ProductSearchInput,
  ProductSearchResult,
  RakutenProductSearchProvider
} from "@/lib/product-search/types";
import { buildMockSearchResult, clampSearchLimit, createSearchFailureResult, extractSearchKeyword, numericOrNull, withTimeout } from "@/lib/product-search/common";
import { sanitizeRakutenImageUrl } from "@/lib/utils/rakuten-image";

const MERCHANT_ID = "rakuten";
// 2026刷新後の楽天ウェブサービス。新ドメイン/新パスに移行し、applicationIdとaccessKeyの両方＋登録ドメイン一致のOrigin/Refererが必須。
const RAKUTEN_SEARCH_ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
const SEARCH_FAILURE_MESSAGE = "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。";

type RakutenImage = {
  imageUrl?: string;
};

type RakutenApiItem = {
  itemCode?: string;
  itemName?: string;
  itemUrl?: string;
  affiliateUrl?: string;
  itemPrice?: number;
  postageFlag?: number;
  pointRate?: number;
  availability?: number;
  shopName?: string;
  mediumImageUrls?: RakutenImage[];
  smallImageUrls?: RakutenImage[];
};

type RakutenApiResponse = {
  Items?: Array<{ Item?: RakutenApiItem }>;
};

function firstImageUrl(item: RakutenApiItem): string | null {
  const imageUrl = item.mediumImageUrls?.[0]?.imageUrl ?? item.smallImageUrls?.[0]?.imageUrl ?? null;
  return sanitizeRakutenImageUrl(imageUrl);
}

function searchFailureResult(): ProductSearchResult {
  return createSearchFailureResult(SEARCH_FAILURE_MESSAGE);
}

function toCandidate(item: RakutenApiItem): ProductSearchCandidate | null {
  if (!item.itemName || !item.itemUrl) {
    return null;
  }

  const imageUrl = firstImageUrl(item);
  const price = numericOrNull(item.itemPrice);
  const pointRate = numericOrNull(item.pointRate);

  return {
    provider: MERCHANT_ID,
    itemCode: item.itemCode ?? item.itemUrl,
    title: item.itemName,
    itemUrl: item.itemUrl,
    affiliateUrl: item.affiliateUrl ?? null,
    imageUrl,
    imageSource: imageUrl ? "rakuten_api" : "placeholder",
    price,
    shippingFee: item.postageFlag === 1 ? 0 : null,
    points: price !== null && pointRate !== null
      ? Math.floor(price * pointRate / 100)
      : null,
    currency: "JPY",
    inStock: typeof item.availability === "number" ? item.availability === 1 : null,
    shopName: item.shopName ?? null
  };
}

function mockSearch(input: ProductSearchInput): ProductSearchResult {
  return buildMockSearchResult({
    provider: MERCHANT_ID,
    keyword: extractSearchKeyword(input.query),
    exampleUrl: "https://item.rakuten.co.jp/example/mock-item/",
    emptyMessage: "楽天APIキーが未設定です。キーワードを入れるとモック候補を表示できます。",
    configuredMessage: "楽天APIキーが未設定のため、プレースホルダー候補を表示しています。手入力のまま保存できます。"
  });
}

export class RakutenIchibaProductSearchProvider implements RakutenProductSearchProvider {
  readonly merchantId = MERCHANT_ID;

  constructor(
    private readonly applicationId = process.env.RAKUTEN_APPLICATION_ID,
    private readonly accessKey = process.env.RAKUTEN_ACCESS_KEY,
    private readonly affiliateId = process.env.RAKUTEN_AFFILIATE_ID,
    // 刷新後の楽天APIは登録ドメイン一致のOrigin/Refererを要求する。サーバー実行ではfetchが自動付与しないため明示する。
    // 値はアプリ登録時のApplication URLと一致が必要（localhost等の汎用値は403）。
    private readonly apiReferer = process.env.RAKUTEN_API_REFERER ?? process.env.NEXT_PUBLIC_SITE_URL
  ) {}

  async search(input: ProductSearchInput): Promise<ProductSearchResult> {
    const keyword = extractSearchKeyword(input.query);
    // 刷新後の楽天APIは applicationId と accessKey の両方が必須。片方でも欠ければ未設定扱い。
    if (!this.applicationId || !this.accessKey) {
      return mockSearch(input);
    }
    if (!keyword) {
      return {
        configured: true,
        candidates: [],
        message: "楽天URLまたはキーワードを入力してください。"
      };
    }

    const limit = clampSearchLimit(input.limit);
    const url = new URL(RAKUTEN_SEARCH_ENDPOINT);
    url.searchParams.set("format", "json");
    url.searchParams.set("applicationId", this.applicationId);
    url.searchParams.set("accessKey", this.accessKey);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("hits", String(limit));
    url.searchParams.set("imageFlag", "1");
    if (this.affiliateId) {
      url.searchParams.set("affiliateId", this.affiliateId);
    }

    const headers: Record<string, string> = { accept: "application/json" };
    if (this.apiReferer) {
      const origin = this.apiReferer.replace(/\/+$/, "");
      headers.Origin = origin;
      headers.Referer = `${origin}/`;
    }

    const timeout = withTimeout();

    try {
      const response = await fetch(url, {
        headers,
        next: { revalidate: 3600 },
        signal: timeout.signal
      });

      if (!response.ok) {
        return searchFailureResult();
      }

      const body = (await response.json()) as RakutenApiResponse;
      const candidates = (body.Items ?? [])
        .map((entry) => entry.Item)
        .filter((item): item is RakutenApiItem => Boolean(item))
        .map(toCandidate)
        .filter((item): item is ProductSearchCandidate => item !== null);

      return {
        configured: true,
        candidates,
        message: candidates.length ? null : "候補が見つかりませんでした。手入力で続けられます。"
      };
    } catch {
      return searchFailureResult();
    } finally {
      timeout.clear();
    }
  }
}

export function createRakutenProductSearchProvider(): RakutenProductSearchProvider {
  return new RakutenIchibaProductSearchProvider();
}
