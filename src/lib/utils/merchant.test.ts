import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { detectMerchantIdFromUrl, extractAmazonAsin } from "@/lib/utils/merchant";

describe("detectMerchantIdFromUrl", () => {
  it("URLドメインからmerchantIdを判定する", () => {
    expect(detectMerchantIdFromUrl("https://www.amazon.co.jp/dp/B012345678", merchants)).toBe("amazon");
    expect(detectMerchantIdFromUrl("https://item.rakuten.co.jp/shop/item", merchants)).toBe("rakuten");
    expect(detectMerchantIdFromUrl("https://example.com/item", merchants)).toBeNull();
  });
});

describe("extractAmazonAsin", () => {
  it("Amazon URLからASINを抽出する", () => {
    expect(extractAmazonAsin("https://www.amazon.co.jp/example/dp/B0ABCDEFGH/?tag=test")).toBe("B0ABCDEFGH");
    expect(extractAmazonAsin("https://www.amazon.co.jp/gp/product/ABCDEFGHIJ")).toBe("ABCDEFGHIJ");
    expect(extractAmazonAsin("https://item.rakuten.co.jp/shop/item")).toBeNull();
  });
});
