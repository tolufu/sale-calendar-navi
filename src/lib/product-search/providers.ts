import { AmazonFutureProductSearchProvider } from "@/lib/product-search/amazon";
import { createEbayBrowseProductSearchProvider } from "@/lib/product-search/ebay";
import { createRakutenProductSearchProvider } from "@/lib/product-search/rakuten";
import { createYahooShoppingProductSearchProvider } from "@/lib/product-search/yahoo";
import type { ProductSearchProvider } from "@/lib/providers/types";

export function createProductSearchProviders(): Record<string, ProductSearchProvider> {
  const rakuten = createRakutenProductSearchProvider();
  const yahoo = createYahooShoppingProductSearchProvider();
  const ebay = createEbayBrowseProductSearchProvider();
  const amazon = new AmazonFutureProductSearchProvider();
  return {
    [rakuten.merchantId]: rakuten,
    [yahoo.merchantId]: yahoo,
    [ebay.merchantId]: ebay,
    [amazon.merchantId]: amazon
  };
}
