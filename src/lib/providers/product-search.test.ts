import { describe, expect, it, vi } from "vitest";
import { merchants } from "@/data/merchants";
import { searchMerchantProducts } from "@/lib/providers/product-search";

describe("searchMerchantProducts", () => {
  it("未対応ECではProviderを呼ばない", async () => {
    const merchant = merchants.find((item) => item.merchantId === "amazon");
    const search = vi.fn();

    await expect(
      searchMerchantProducts(merchant!, { merchantId: "amazon", search }, { query: "sample" })
    ).rejects.toThrow("価格や画像の自動取得は行いません");
    expect(search).not.toHaveBeenCalled();
  });
});
