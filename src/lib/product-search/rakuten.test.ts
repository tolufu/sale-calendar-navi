import { describe, expect, it, vi } from "vitest";
import { RakutenIchibaProductSearchProvider } from "@/lib/product-search/rakuten";

describe("RakutenIchibaProductSearchProvider", () => {
  it("APIキー未設定時はモック候補を返し、手入力継続メッセージを返す", async () => {
    const provider = new RakutenIchibaProductSearchProvider(undefined, undefined);

    const result = await provider.search({ query: "掃除機" });

    expect(result.configured).toBe(false);
    expect(result.candidates[0]).toMatchObject({
      title: "掃除機（モック候補）",
      imageSource: "placeholder",
      imageUrl: null,
      price: null
    });
    expect(result.message).toContain("手入力");
  });

  it("楽天APIレスポンスの許可画像とaffiliateUrlを候補へ変換する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Items: [
          {
            Item: {
              itemCode: "shop:item",
              itemName: "テスト商品",
              itemUrl: "https://item.rakuten.co.jp/shop/item/",
              affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/example",
              itemPrice: 1980,
              shopName: "テスト店舗",
              mediumImageUrls: [{ imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg" }]
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new RakutenIchibaProductSearchProvider("app-id", "affiliate-id");

    const result = await provider.search({ query: "テスト" });

    expect(result.configured).toBe(true);
    expect(result.candidates[0]).toMatchObject({
      title: "テスト商品",
      affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/example",
      imageSource: "rakuten_api",
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg",
      price: 1980
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
