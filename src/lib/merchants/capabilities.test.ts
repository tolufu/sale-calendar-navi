import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { getMerchantCapabilities, getMerchantIntegrationLabel } from "@/lib/merchants/capabilities";

describe("merchant capabilities", () => {
  it("Amazonは価格候補取得を許可しない", () => {
    const merchant = merchants.find((item) => item.merchantId === "amazon");
    expect(merchant).toBeDefined();
    expect(getMerchantCapabilities(merchant!)).toEqual(new Set(["manual-link-save", "sale-calendar"]));
    expect(getMerchantIntegrationLabel(merchant!)).toBe("手動リンク保存のみ");
  });

  it("supportsApiだけでは価格自動取得を許可しない", () => {
    const merchant = {
      ...merchants[0],
      supportsApi: true,
      supportsPriceAutoFetch: false
    };
    expect(getMerchantCapabilities(merchant).has("api")).toBe(true);
    expect(getMerchantCapabilities(merchant).has("price-auto-fetch")).toBe(false);
  });

  it("楽天は設定済みの能力だけを公開する", () => {
    const merchant = merchants.find((item) => item.merchantId === "rakuten");
    expect(merchant).toBeDefined();
    expect(getMerchantCapabilities(merchant!)).toEqual(
      new Set(["manual-link-save", "affiliate", "api", "price-auto-fetch", "sale-calendar"])
    );
  });

  it("Yahoo!ショッピングとeBayは価格候補取得を許可する", () => {
    for (const merchantId of ["yahoo-shopping", "ebay"]) {
      const merchant = merchants.find((item) => item.merchantId === merchantId);
      expect(merchant).toBeDefined();
      expect(getMerchantCapabilities(merchant!)).toEqual(
        new Set(["manual-link-save", "api", "price-auto-fetch"])
      );
      expect(getMerchantIntegrationLabel(merchant!)).toBeNull();
    }
  });
});
