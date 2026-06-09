import { describe, expect, it } from "vitest";
import {
  isAllowedEbayImageUrl,
  isAllowedYahooImageUrl,
  sanitizeEbayImageUrl,
  sanitizeYahooImageUrl
} from "@/lib/utils/product-image";

describe("official API image allowlists", () => {
  it("Yahoo!ショッピングAPIの画像ホストだけを許可する", () => {
    expect(isAllowedYahooImageUrl("https://item-shopping.c.yimg.jp/i/g/store_item")).toBe(true);
    expect(isAllowedYahooImageUrl("https://sub.item-shopping.c.yimg.jp/i/g/store_item")).toBe(true);
    expect(sanitizeYahooImageUrl("https://item-shopping.c.yimg.jp/i/g/store_item")).toBe("https://item-shopping.c.yimg.jp/i/g/store_item");
  });

  it("eBay APIの画像ホストだけを許可する", () => {
    expect(isAllowedEbayImageUrl("https://i.ebayimg.com/images/g/example/s-l500.jpg")).toBe(true);
    expect(isAllowedEbayImageUrl("https://thumbs.ebaystatic.com/images/g/example/s-l225.jpg")).toBe(true);
    expect(sanitizeEbayImageUrl("https://i.ebayimg.com/images/g/example/s-l500.jpg")).toBe("https://i.ebayimg.com/images/g/example/s-l500.jpg");
  });

  it("許可外ホストや不正値は拒否する", () => {
    expect(isAllowedYahooImageUrl("https://example.com/item.jpg")).toBe(false);
    expect(isAllowedYahooImageUrl("https://item-shopping.c.yimg.jp.evil.com/item.jpg")).toBe(false);
    expect(sanitizeEbayImageUrl("javascript:alert(1)")).toBeNull();
  });
});
