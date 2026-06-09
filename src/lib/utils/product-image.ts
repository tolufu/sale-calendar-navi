import type { ProductImageSource } from "@/lib/product-search/types";

const allowedImageHosts: Record<Exclude<ProductImageSource, "placeholder">, string[]> = {
  rakuten_api: ["image.rakuten.co.jp"],
  yahoo_api: ["item-shopping.c.yimg.jp", "shopping.c.yimg.jp"],
  ebay_api: ["i.ebayimg.com", "thumbs.ebaystatic.com"]
};

const sourceLabels: Record<ProductImageSource, string> = {
  placeholder: "プレースホルダー",
  rakuten_api: "楽天API",
  yahoo_api: "Yahoo!ショッピングAPI",
  ebay_api: "eBay Browse API"
};

export function getProductImageSourceLabel(source: ProductImageSource): string {
  return sourceLabels[source];
}

export function isAllowedProductImageUrl(source: ProductImageSource, value: string | null | undefined): boolean {
  if (source === "placeholder" || !value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return allowedImageHosts[source].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function sanitizeProductImageUrl(source: ProductImageSource, value: string | null | undefined): string | null {
  if (!isAllowedProductImageUrl(source, value)) {
    return null;
  }

  try {
    return new URL(value as string).toString();
  } catch {
    return null;
  }
}

export function isAllowedYahooImageUrl(value: string | null | undefined): boolean {
  return isAllowedProductImageUrl("yahoo_api", value);
}

export function sanitizeYahooImageUrl(value: string | null | undefined): string | null {
  return sanitizeProductImageUrl("yahoo_api", value);
}

export function isAllowedEbayImageUrl(value: string | null | undefined): boolean {
  return isAllowedProductImageUrl("ebay_api", value);
}

export function sanitizeEbayImageUrl(value: string | null | undefined): string | null {
  return sanitizeProductImageUrl("ebay_api", value);
}
