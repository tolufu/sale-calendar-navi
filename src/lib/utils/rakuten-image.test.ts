import { describe, expect, it } from "vitest";
import { isAllowedRakutenImageUrl, sanitizeRakutenImageUrl } from "@/lib/utils/rakuten-image";

describe("isAllowedRakutenImageUrl", () => {
  it("楽天公式画像ホストを許可する", () => {
    expect(isAllowedRakutenImageUrl("https://image.rakuten.co.jp/shop/item.jpg")).toBe(true);
    expect(isAllowedRakutenImageUrl("https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg")).toBe(true);
  });

  it("許可外ホストや不正な値を拒否する", () => {
    expect(isAllowedRakutenImageUrl("https://example.com/item.jpg")).toBe(false);
    expect(isAllowedRakutenImageUrl("https://image.rakuten.co.jp.evil.com/item.jpg")).toBe(false);
    expect(isAllowedRakutenImageUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedRakutenImageUrl("")).toBe(false);
    expect(isAllowedRakutenImageUrl(null)).toBe(false);
    expect(isAllowedRakutenImageUrl(undefined)).toBe(false);
  });
});

describe("sanitizeRakutenImageUrl", () => {
  it("許可ホストのURLを正規化して返す", () => {
    expect(sanitizeRakutenImageUrl("https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg")).toBe(
      "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg"
    );
  });

  it("許可外URLは null を返す", () => {
    expect(sanitizeRakutenImageUrl("https://example.com/item.jpg")).toBeNull();
    expect(sanitizeRakutenImageUrl("https://image.rakuten.co.jp.evil.com/x.jpg")).toBeNull();
    expect(sanitizeRakutenImageUrl(null)).toBeNull();
  });
});
