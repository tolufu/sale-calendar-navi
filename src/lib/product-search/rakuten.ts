import type {
  ProductSearchCandidate,
  ProductSearchInput,
  ProductSearchResult,
  RakutenProductSearchProvider
} from "@/lib/product-search/types";
import { sanitizeRakutenImageUrl } from "@/lib/utils/rakuten-image";

// 2026-02-10の楽天ウェブサービス刷新で新ドメイン/新パスに移行。applicationIdとaccessKeyの両方が必須。
const RAKUTEN_SEARCH_ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";
const DEFAULT_LIMIT = 5;
const SEARCH_TIMEOUT_MS = 8000;
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
  return {
    configured: true,
    candidates: [],
    message: SEARCH_FAILURE_MESSAGE
  };
}

function toCandidate(item: RakutenApiItem): ProductSearchCandidate | null {
  if (!item.itemName || !item.itemUrl) {
    return null;
  }

  const imageUrl = firstImageUrl(item);

  return {
    provider: "rakuten",
    itemCode: item.itemCode ?? item.itemUrl,
    title: item.itemName,
    itemUrl: item.itemUrl,
    affiliateUrl: item.affiliateUrl ?? null,
    imageUrl,
    imageSource: imageUrl ? "rakuten_api" : "placeholder",
    price: typeof item.itemPrice === "number" && Number.isFinite(item.itemPrice) ? item.itemPrice : null,
    shopName: item.shopName ?? null
  };
}

export function extractRakutenKeyword(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(pathParts[pathParts.length - 1] ?? parsed.hostname);
  } catch {
    return trimmed;
  }
}

function mockSearch(input: ProductSearchInput): ProductSearchResult {
  const keyword = extractRakutenKeyword(input.query);
  if (!keyword) {
    return {
      configured: false,
      candidates: [],
      message: "楽天APIキーが未設定です。キーワードを入れるとモック候補を表示できます。"
    };
  }

  return {
    configured: false,
    candidates: [
      {
        provider: "rakuten",
        itemCode: `mock-${encodeURIComponent(keyword)}`,
        title: `${keyword}（モック候補）`,
        itemUrl: "https://item.rakuten.co.jp/example/mock-item/",
        affiliateUrl: null,
        imageUrl: null,
        imageSource: "placeholder",
        price: null,
        shopName: "楽天API未設定"
      }
    ],
    message: "楽天APIキーが未設定のため、プレースホルダー候補を表示しています。手入力のまま保存できます。"
  };
}

export class RakutenIchibaProductSearchProvider implements RakutenProductSearchProvider {
  readonly merchantId = "rakuten";

  constructor(
    private readonly applicationId = process.env.RAKUTEN_APPLICATION_ID,
    private readonly accessKey = process.env.RAKUTEN_ACCESS_KEY,
    private readonly affiliateId = process.env.RAKUTEN_AFFILIATE_ID
  ) {}

  async search(input: ProductSearchInput): Promise<ProductSearchResult> {
    const keyword = extractRakutenKeyword(input.query);
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

    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), 10);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        next: { revalidate: 3600 },
        signal: controller.signal
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
      clearTimeout(timeoutId);
    }
  }
}

export function createRakutenProductSearchProvider(): RakutenProductSearchProvider {
  return new RakutenIchibaProductSearchProvider();
}
