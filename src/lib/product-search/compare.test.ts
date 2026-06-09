import { describe, expect, it } from "vitest";
import { sortCandidatesByEffectivePrice } from "@/lib/product-search/compare";
import type { ProductSearchCandidate } from "@/lib/product-search/types";

describe("sortCandidatesByEffectivePrice", () => {
  it("実質価格が安い順に並べ、価格未取得は末尾に置く", () => {
    const candidates: ProductSearchCandidate[] = [
      createCandidate({ title: "未取得", price: null }),
      createCandidate({ title: "高い", price: 12000, shippingFee: 500, points: 0 }),
      createCandidate({ title: "安い", price: 11000, shippingFee: 0, points: 1000 })
    ];

    expect(sortCandidatesByEffectivePrice(candidates).map((candidate) => candidate.title)).toEqual(["安い", "高い", "未取得"]);
  });

  it("外貨候補はJPY換算済み価格で並べる", () => {
    const candidates: ProductSearchCandidate[] = [
      createCandidate({ title: "USD候補", provider: "ebay", currency: "USD", price: 100, shippingFee: 0, priceJpy: 15000, shippingFeeJpy: 0 }),
      createCandidate({ title: "JPY候補", price: 16000, shippingFee: 0 })
    ];

    expect(sortCandidatesByEffectivePrice(candidates).map((candidate) => candidate.title)).toEqual(["USD候補", "JPY候補"]);
    expect(sortCandidatesByEffectivePrice(candidates)[0].effectivePriceJpy).toBe(15000);
  });
});

function createCandidate(patch: Partial<ProductSearchCandidate>): ProductSearchCandidate {
  return {
    provider: "rakuten",
    itemCode: "item",
    title: "商品",
    itemUrl: "https://example.com/item",
    affiliateUrl: null,
    imageUrl: null,
    imageSource: "placeholder",
    price: 1000,
    shippingFee: null,
    points: null,
    currency: "JPY",
    inStock: null,
    shopName: null,
    ...patch
  };
}
