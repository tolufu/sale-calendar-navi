import { describe, expect, it } from "vitest";
import { buildAffiliateUrl, convertRakutenAffiliate, convertRakutenAffiliateUrl } from "@/lib/utils/affiliate";

describe("convertRakutenAffiliate", () => {
  it("楽天URLだけにダミーscidを付与する", () => {
    expect(convertRakutenAffiliate("https://item.rakuten.co.jp/shop/item")).toBe(
      "https://item.rakuten.co.jp/shop/item?scid=af_link_dummy"
    );
  });

  it("楽天以外URLは変換しない", () => {
    const url = "https://example.com/item";
    expect(convertRakutenAffiliate(url)).toBe(url);
  });

  it("既存クエリを保持してscidを追加する", () => {
    const result = convertRakutenAffiliate("https://item.rakuten.co.jp/shop/item?variant=red");
    expect(result).toContain("variant=red");
    expect(result).toContain("scid=af_link_dummy");
  });

  it("merchants設定が楽天有効の場合だけaffiliateUrlを返す", () => {
    expect(buildAffiliateUrl("https://item.rakuten.co.jp/shop/item", { provider: "rakuten", enabled: true })).toContain(
      "scid=af_link_dummy"
    );
    expect(buildAffiliateUrl("https://example.com/item", { provider: "rakuten", enabled: true })).toBeNull();
    expect(buildAffiliateUrl("https://item.rakuten.co.jp/shop/item", null)).toBeNull();
  });
});

describe("convertRakutenAffiliateUrl", () => {
  it("楽天URLとaffiliateIdがある場合だけ変換する", () => {
    const result = convertRakutenAffiliateUrl("https://item.rakuten.co.jp/shop/item", "test-id");
    expect(result).toContain("hb.afl.rakuten.co.jp");
    expect(result).toContain("test-id");
  });

  it("affiliateIdがない場合は元URLを返す", () => {
    const url = "https://item.rakuten.co.jp/shop/item";
    expect(convertRakutenAffiliateUrl(url)).toBe("https://item.rakuten.co.jp/shop/item?scid=af_link_dummy");
  });

  it("楽天以外のURLは元URLを返す", () => {
    const url = "https://example.com/item";
    expect(convertRakutenAffiliateUrl(url, "test-id")).toBe(url);
  });
});
