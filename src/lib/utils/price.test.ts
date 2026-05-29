import { describe, expect, it } from "vitest";
import { calculateEffectivePrice, pickEffectivePriceDiff } from "@/lib/utils/price";

describe("calculateEffectivePrice", () => {
  it("割引とポイント相当額を差し引く土台計算を行う", () => {
    expect(calculateEffectivePrice(10000, 1000, 500)).toBe(8500);
    expect(calculateEffectivePrice(1000, 1200, 0)).toBe(0);
  });

  it("5項目の内訳から実質価格を計算する", () => {
    expect(calculateEffectivePrice({
      productPrice: 10000,
      shippingFee: 500,
      couponDiscount: 1000,
      grantedPoints: 800,
      pointRate: 1
    })).toBe(8700);
  });

  it("小数を含む内訳はMath.roundで丸める", () => {
    expect(calculateEffectivePrice({
      productPrice: 1000.4,
      shippingFee: 0,
      couponDiscount: 0,
      grantedPoints: 101,
      pointRate: 0.5
    })).toBe(950);
  });

  it("内訳経由でも計算結果を0未満にしない", () => {
    expect(calculateEffectivePrice({
      productPrice: 1000,
      shippingFee: 0,
      couponDiscount: 600,
      grantedPoints: 1000,
      pointRate: 1
    })).toBe(0);
  });

  it("商品価格が空なら未計算としてnullを返す", () => {
    expect(calculateEffectivePrice({
      productPrice: null,
      shippingFee: 500,
      couponDiscount: 1000,
      grantedPoints: 800,
      pointRate: 1
    })).toBeNull();
  });

  it("負数や不正数値を拒否する", () => {
    expect(() => calculateEffectivePrice({
      productPrice: 1000,
      shippingFee: -1,
      couponDiscount: 0,
      grantedPoints: 0,
      pointRate: 1
    })).toThrow("0以上");
  });

  it("比較可能な候補だけで差額を返す", () => {
    const diff = pickEffectivePriceDiff([
      {
        merchantId: "amazon",
        originalUrl: "https://example.com/a",
        affiliateUrl: null,
        breakdown: { productPrice: 12000, shippingFee: 0, couponDiscount: 0, grantedPoints: 0, pointRate: 1 },
        priceMemo: null,
        lastCheckedAt: null,
        imageSource: "placeholder"
      },
      {
        merchantId: "rakuten",
        originalUrl: "https://item.rakuten.co.jp/shop/item",
        affiliateUrl: null,
        breakdown: { productPrice: 13000, shippingFee: 0, couponDiscount: 1000, grantedPoints: 1500, pointRate: 1 },
        priceMemo: null,
        lastCheckedAt: null,
        imageSource: "placeholder"
      }
    ]);

    expect(diff).toEqual({ lowerMerchantId: "rakuten", higherMerchantId: "amazon", amount: 1500 });
  });
});
