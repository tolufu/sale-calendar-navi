import { describe, expect, it } from "vitest";
import { convertRakutenAffiliateUrl } from "@/lib/utils/affiliate";

describe("convertRakutenAffiliateUrl", () => {
  it("楽天URLとaffiliateIdがある場合だけ変換する", () => {
    const result = convertRakutenAffiliateUrl("https://item.rakuten.co.jp/shop/item", "test-id");
    expect(result).toContain("hb.afl.rakuten.co.jp");
    expect(result).toContain("test-id");
  });

  it("affiliateIdがない場合は元URLを返す", () => {
    const url = "https://item.rakuten.co.jp/shop/item";
    expect(convertRakutenAffiliateUrl(url)).toBe(url);
  });

  it("楽天以外のURLは元URLを返す", () => {
    const url = "https://example.com/item";
    expect(convertRakutenAffiliateUrl(url, "test-id")).toBe(url);
  });
});
