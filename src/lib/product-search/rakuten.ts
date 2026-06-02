import type {
  ProductSearchCandidate,
  ProductSearchInput,
  ProductSearchResult,
  RakutenProductSearchProvider
} from "@/lib/product-search/types";
import { sanitizeRakutenImageUrl } from "@/lib/utils/rakuten-image";

// 楽天ウェブサービス刷新後の Ichiba Item Search エンドポイント。applicationId と accessKey の両方が必須。
// 2026-06 にライブ検証済み（実APIの挙動）:
//   - 旧 app.rakuten.co.jp/.../20170706 は現役だが applicationId（数値）のみで accessKey 非対応。
//   - 本エンドポイントは applicationId(UUID) + accessKey 必須。欠落時 400、accessKey不正時 403 を返す。
//   - 不正パスは 404 "Resource not found" を返すため、本パスが正規リソースであることを確認済み。
// この事実に反する「旧エンドポイントへの差し戻し」をしないこと。
const RAKUTEN_SEARCH_ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";
const DEFAULT_LIMIT = 5;
const SEARCH_TIMEOUT_MS = 8000;
const SEARCH_FAILURE_MESSAGE = "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。";
// 認証系（applicationId / accessKey の誤り）は設定ミスのため、障害と区別したメッセージを返す。
const SEARCH_AUTH_FAILURE_MESSAGE =
  "楽天APIの認証に失敗しました。サーバーの RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY の設定をご確認ください。";

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

// 新ゲートウェイがレスポンスを平坦化した場合に備え、Item ラッパー有無の両方を受け付ける。
type RakutenApiResponse = {
  Items?: Array<{ Item?: RakutenApiItem } & RakutenApiItem>;
};

// 楽天の上流エラー本文（新旧で形が異なる）からメッセージだけを安全に取り出す。
function extractUpstreamErrorMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as {
      errors?: { errorMessage?: string };
      error?: string;
      error_description?: string;
    };
    return (
      parsed.errors?.errorMessage ??
      parsed.error_description ??
      parsed.error ??
      null
    );
  } catch {
    return null;
  }
}

function firstImageUrl(item: RakutenApiItem): string | null {
  const imageUrl = item.mediumImageUrls?.[0]?.imageUrl ?? item.smallImageUrls?.[0]?.imageUrl ?? null;
  return sanitizeRakutenImageUrl(imageUrl);
}

function searchFailureResult(message: string = SEARCH_FAILURE_MESSAGE): ProductSearchResult {
  return {
    configured: true,
    candidates: [],
    message
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
        // 失敗を握りつぶすと「設定ミス」か「障害」か切り分けられないため、状況をサーバーログへ残す。
        const errorBody = await response.text().catch(() => "");
        const upstreamMessage = extractUpstreamErrorMessage(errorBody);
        console.error(
          `[rakuten-search] upstream error: status=${response.status} message=${upstreamMessage ?? "(none)"}`
        );
        // 401/403 は applicationId / accessKey の設定ミスなので、専用メッセージで案内する。
        if (response.status === 401 || response.status === 403) {
          return searchFailureResult(SEARCH_AUTH_FAILURE_MESSAGE);
        }
        return searchFailureResult();
      }

      const body = (await response.json()) as RakutenApiResponse;
      const candidates = (body.Items ?? [])
        // 新ゲートウェイが Item ラッパー無しで返す可能性に備え、ラッパーが無ければ要素自体を商品とみなす。
        .map((entry) => entry.Item ?? entry)
        .filter((item): item is RakutenApiItem => Boolean(item))
        .map(toCandidate)
        .filter((item): item is ProductSearchCandidate => item !== null);

      if (!candidates.length && (body.Items?.length ?? 0) === 0) {
        // 200 だが Items が空＝レスポンス構造のズレを疑えるよう、トップレベルキーを記録する。
        console.warn(`[rakuten-search] empty result. response keys=${Object.keys(body ?? {}).join(",")}`);
      }

      return {
        configured: true,
        candidates,
        message: candidates.length ? null : "候補が見つかりませんでした。手入力で続けられます。"
      };
    } catch (error) {
      console.error("[rakuten-search] request failed:", error);
      return searchFailureResult();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function createRakutenProductSearchProvider(): RakutenProductSearchProvider {
  return new RakutenIchibaProductSearchProvider();
}
