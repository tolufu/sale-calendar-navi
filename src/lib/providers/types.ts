import type { ProductSearchInput, ProductSearchResult } from "@/lib/product-search/types";
import type { Merchant, SaleEvent } from "@/lib/repositories/types";

export type ProviderResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not-supported" | "not-configured" | "invalid-input" | "upstream-error" };

export interface ProductSearchProvider {
  readonly merchantId: string;
  search(input: ProductSearchInput): Promise<ProductSearchResult>;
}

export interface AffiliateLinkProvider {
  readonly providerId: string;
  buildUrl(url: string): string | null;
}

export interface SaleCalendarProvider {
  readonly merchantId: string;
  listSales(): Promise<ProviderResult<SaleEvent[]>>;
}

export type ProductFeedItem = {
  providerId: string;
  merchantId: string;
  externalId: string;
  title: string;
  productUrl: string;
  affiliateUrl: string | null;
  imageUrl: string | null;
  priceMemo: string | null;
};

export interface ProductFeedProvider {
  readonly providerId: string;
  readonly merchantId: string;
  loadFeed(): Promise<ProviderResult<ProductFeedItem[]>>;
}

export function assertMerchantSupportsAutoFetch(merchant: Merchant): void {
  if (!merchant.supportsApi || !merchant.supportsPriceAutoFetch) {
    throw new Error(`${merchant.name}は手動リンク保存のみ対応しています。価格や画像の自動取得は行いません。`);
  }
}
