export type ProductImageSource = "placeholder" | "rakuten_api";

export type ProductSearchCandidate = {
  provider: "rakuten";
  itemCode: string;
  title: string;
  itemUrl: string;
  affiliateUrl: string | null;
  imageUrl: string | null;
  imageSource: ProductImageSource;
  price: number | null;
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

export interface RakutenProductSearchProvider {
  search(input: ProductSearchInput): Promise<ProductSearchResult>;
}

export interface AmazonProductSearchProvider {
  search(input: ProductSearchInput): Promise<ProductSearchResult>;
}
