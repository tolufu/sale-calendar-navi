import { afterEach, describe, expect, it, vi } from "vitest";
import { clearEbayTokenCacheForTest, EbayBrowseProductSearchProvider } from "@/lib/product-search/ebay";

describe("EbayBrowseProductSearchProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearEbayTokenCacheForTest();
  });

  it("APIキー未設定時はモック候補を返す", async () => {
    const result = await new EbayBrowseProductSearchProvider(undefined, undefined).search({ query: "camera" });
    expect(result.configured).toBe(false);
    expect(result.candidates[0]).toMatchObject({ provider: "ebay", imageSource: "placeholder" });
  });

  it("OAuthトークンを取得してBrowse APIレスポンスを候補へ変換する", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "token", expires_in: 7200 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          itemSummaries: [{
            itemId: "v1|1|0",
            title: "eBay商品",
            itemWebUrl: "https://www.ebay.com/itm/1",
            price: { value: "99.5", currency: "USD" },
            image: { imageUrl: "https://i.ebayimg.com/images/g/example/s-l500.jpg" },
            seller: { username: "seller" },
            shippingOptions: [{ shippingCost: { value: "12.3", currency: "USD" } }],
            estimatedAvailabilities: [{ estimatedAvailabilityStatus: "IN_STOCK" }]
          }]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new EbayBrowseProductSearchProvider("client", "secret", "EBAY_US").search({ query: "camera" });

    expect(result.configured).toBe(true);
    expect(result.candidates[0]).toMatchObject({
      title: "eBay商品",
      imageSource: "ebay_api",
      price: 99.5,
      shippingFee: 12.3,
      currency: "USD",
      inStock: true,
      shopName: "seller"
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("許可外画像ホストは表示候補から除外する", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "token", expires_in: 7200 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ itemSummaries: [{ title: "商品", itemWebUrl: "https://www.ebay.com/itm/1", image: { imageUrl: "https://example.com/item.jpg" } }] }) }));

    const result = await new EbayBrowseProductSearchProvider("client", "secret").search({ query: "camera" });
    expect(result.candidates[0]).toMatchObject({ imageSource: "placeholder", imageUrl: null });
  });

  it("トークン取得失敗時は例外を投げずメッセージを返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await new EbayBrowseProductSearchProvider("client", "secret").search({ query: "camera" });
    expect(result.candidates).toEqual([]);
    expect(result.message).toContain("アクセストークン");
  });
});
