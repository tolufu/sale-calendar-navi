import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { getMerchantCapabilities, getMerchantIntegrationLabel } from "@/lib/merchants/capabilities";

describe("merchant capabilities", () => {
  it("未連携ECは手動リンク保存だけを許可する", () => {
    const merchant = merchants.find((item) => item.merchantId === "yahoo-shopping");
    expect(merchant).toBeDefined();
    expect([...getMerchantCapabilities(merchant!)]).toEqual(["manual-link-save"]);
    expect(getMerchantIntegrationLabel(merchant!)).toBe("今後対応予定（手動リンク保存のみ）");
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
});
