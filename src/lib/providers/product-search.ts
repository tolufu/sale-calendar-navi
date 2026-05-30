import type { ProductSearchInput, ProductSearchResult } from "@/lib/product-search/types";
import type { Merchant } from "@/lib/repositories/types";
import { assertMerchantSupportsAutoFetch, type ProductSearchProvider } from "@/lib/providers/types";

export async function searchMerchantProducts(
  merchant: Merchant,
  provider: ProductSearchProvider,
  input: ProductSearchInput
): Promise<ProductSearchResult> {
  assertMerchantSupportsAutoFetch(merchant);
  if (provider.merchantId !== merchant.merchantId) {
    throw new Error("merchantIdとProductSearchProviderが一致しません。");
  }
  return provider.search(input);
}
