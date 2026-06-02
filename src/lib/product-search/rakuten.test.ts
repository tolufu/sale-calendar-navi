import { afterEach, describe, expect, it, vi } from "vitest";
import { RakutenIchibaProductSearchProvider } from "@/lib/product-search/rakuten";

describe("RakutenIchibaProductSearchProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("APIキー未設定時はモック候補を返し、手入力継続メッセージを返す", async () => {
    const provider = new RakutenIchibaProductSearchProvider(undefined, undefined, undefined);

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

  it("applicationIdのみでaccessKey未設定ならモック候補を返す", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new RakutenIchibaProductSearchProvider("app-id", undefined);

    const result = await provider.search({ query: "掃除機" });

    expect(result.configured).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("リクエストURLにapplicationIdとaccessKeyの両方を含める", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Items: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    await provider.search({ query: "テスト" });

    const requestUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestUrl.origin).toBe("https://openapi.rakuten.co.jp");
    expect(requestUrl.searchParams.get("applicationId")).toBe("app-id");
    expect(requestUrl.searchParams.get("accessKey")).toBe("access-key");
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
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key", "affiliate-id");

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
  });

  it("楽天APIがエラーを返した場合は空候補と手入力継続メッセージを返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "" })
    );
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result).toEqual({
      configured: true,
      candidates: [],
      message: "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。"
    });
  });

  it("401/403は認証エラー専用メッセージを返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ errors: { errorCode: 403, errorMessage: "Invalid Access Key" } })
      })
    );
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result.configured).toBe(true);
    expect(result.candidates).toEqual([]);
    expect(result.message).toContain("認証に失敗");
    expect(result.message).toContain("RAKUTEN_ACCESS_KEY");
  });

  it("Itemラッパー無しの平坦なレスポンスでも候補へ変換する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Items: [
            {
              itemName: "平坦商品",
              itemUrl: "https://item.rakuten.co.jp/shop/flat/",
              itemPrice: 500
            }
          ]
        })
      })
    );
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result.candidates[0]).toMatchObject({ title: "平坦商品", price: 500 });
  });

  it("楽天APIへのfetchが失敗した場合は空候補と手入力継続メッセージを返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result).toEqual({
      configured: true,
      candidates: [],
      message: "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。"
    });
  });

  it("楽天APIへのfetchがタイムアウトした場合は空候補と手入力継続メッセージを返す", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: URL, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const resultPromise = provider.search({ query: "テスト" });
    await vi.advanceTimersByTimeAsync(8000);

    await expect(resultPromise).resolves.toEqual({
      configured: true,
      candidates: [],
      message: "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。"
    });
  });

  it("楽天APIレスポンスのパースに失敗した場合は空候補と手入力継続メッセージを返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("parse error");
      }
    }));
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result).toEqual({
      configured: true,
      candidates: [],
      message: "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。"
    });
  });

  it("楽天画像ドメイン以外の画像URLはプレースホルダーへフォールバックする", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Items: [
          {
            Item: {
              itemName: "テスト商品",
              itemUrl: "https://item.rakuten.co.jp/shop/item/",
              mediumImageUrls: [{ imageUrl: "https://example.com/item.jpg" }]
            }
          }
        ]
      })
    }));
    const provider = new RakutenIchibaProductSearchProvider("app-id", "access-key");

    const result = await provider.search({ query: "テスト" });

    expect(result.candidates[0]).toMatchObject({
      imageUrl: null,
      imageSource: "placeholder"
    });
  });
});
