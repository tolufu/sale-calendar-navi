export type ProductImageSource = "placeholder" | "rakuten_api" | "yahoo_api" | "ebay_api";

export type ProductSearchCandidate = {
  provider: string;
  itemCode: string;
  title: string;
  itemUrl: string;
  affiliateUrl: string | null;
  imageUrl: string | null;
  imageSource: ProductImageSource;
  price: number | null;
  shippingFee: number | null;
  points: number | null;
  currency: string;
  priceJpy?: number | null;
  shippingFeeJpy?: number | null;
  exchangeRateToJpy?: number | null;
  exchangeRateDate?: string | null;
  inStock: boolean | null;
  shopName: string | null;
};

export type ProductSearchInput = {
  query: string;
  limit?: number;
};

export type ProductSearchResult = {
  configured: boolean;
  candidates: ProductSearchCandidate[];
  message: string | null;
};

export type ProductSearchProviderResult = ProductSearchResult & {
  merchantId: string;
};

export interface RakutenProductSearchProvider {
  readonly merchantId: "rakuten";
  search(input: ProductSearchInput): Promise<ProductSearchResult>;
}

export interface AmazonProductSearchProvider {
  readonly merchantId: "amazon";
  search(input: ProductSearchInput): Promise<ProductSearchResult>;
}
