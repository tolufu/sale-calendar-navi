import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { assertMerchantSupportsAutoFetch } from "@/lib/providers/types";

describe("assertMerchantSupportsAutoFetch", () => {
  it("未対応ECの自動取得を拒否する", () => {
    const merchant = merchants.find((item) => item.merchantId === "yahoo-shopping");
    expect(merchant).toBeDefined();
    expect(() => assertMerchantSupportsAutoFetch(merchant!)).toThrow("価格や画像の自動取得は行いません");
  });

  it("許可済みECは自動取得を利用できる", () => {
    const merchant = merchants.find((item) => item.merchantId === "rakuten");
    expect(merchant).toBeDefined();
    expect(() => assertMerchantSupportsAutoFetch(merchant!)).not.toThrow();
  });
});
