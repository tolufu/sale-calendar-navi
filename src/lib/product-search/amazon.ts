import type { AmazonProductSearchProvider, ProductSearchResult } from "@/lib/product-search/types";

export class AmazonFutureProductSearchProvider implements AmazonProductSearchProvider {
  async search(): Promise<ProductSearchResult> {
    return {
      configured: false,
      candidates: [],
      message: "Amazon連携はアソシエイト/PA-APIの利用条件確認後に実装します。現時点では手入力で続けてください。"
    };
  }
}
