import { afterEach, describe, expect, it, vi } from "vitest";
import { YahooShoppingProductSearchProvider } from "@/lib/product-search/yahoo";

describe("YahooShoppingProductSearchProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("APIキー未設定時はモック候補を返す", async () => {
    const result = await new YahooShoppingProductSearchProvider(undefined).search({ query: "掃除機" });
    expect(result.configured).toBe(false);
    expect(result.candidates[0]).toMatchObject({ provider: "yahoo-shopping", imageSource: "placeholder" });
  });

  it("Yahoo!ショッピングAPIレスポンスを候補へ変換する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: [{
          code: "store_item",
          name: "Yahoo商品",
          url: "https://store.shopping.yahoo.co.jp/store/item.html",
          inStock: true,
          image: { medium: "https://item-shopping.c.yimg.jp/i/g/store_item" },
          price: 12000,
          point: { lyLimitedBonusAmount: 120 },
          shipping: { code: 2 },
          seller: { name: "Yahoo店舗" }
        }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new YahooShoppingProductSearchProvider("appid", "vc123").search({ query: "掃除機" });

    expect(result.configured).toBe(true);
    expect(result.candidates[0]).toMatchObject({
      title: "Yahoo商品",
      imageSource: "yahoo_api",
      price: 12000,
      shippingFee: 0,
      points: 120,
      currency: "JPY",
      inStock: true,
      shopName: "Yahoo店舗"
    });
    expect(result.candidates[0].affiliateUrl).toContain("vc=vc123");
  });

  it("許可外画像ホストは表示候補から除外する", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hits: [{ name: "Yahoo商品", url: "https://store.shopping.yahoo.co.jp/store/item.html", image: { medium: "https://example.com/item.jpg" } }] })
    }));

    const result = await new YahooShoppingProductSearchProvider("appid").search({ query: "掃除機" });
    expect(result.candidates[0]).toMatchObject({ imageSource: "placeholder", imageUrl: null });
  });

  it("API失敗時は例外を投げずメッセージを返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await new YahooShoppingProductSearchProvider("appid").search({ query: "掃除機" });
    expect(result.candidates).toEqual([]);
    expect(result.message).toContain("Yahoo!ショッピングAPI");
  });
});
