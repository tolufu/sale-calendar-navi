import { describe, expect, it } from "vitest";
import { buildCompareShareText, buildSaleShareText } from "@/lib/utils/share";

describe("share text", () => {
  it("セール共有文面を生成する", () => {
    const text = buildSaleShareText({ title: "楽天スーパーSALE メモ", startAt: "2026-06-04T20:00:00+09:00" });
    expect(text).toContain("楽天スーパーSALE メモ");
    expect(text).toContain("#セールカレンダー比較ナビ");
  });

  it("比較共有文面に保存URL、匿名ID、非公開メモを含めない", () => {
    const text = buildCompareShareText(
      {
        title: "商品 https://private.example/wish/secret user_anon_123 非公開メモ",
        desiredPrice: 5000
      },
      4800
    );

    expect(text).not.toContain("https://private.example");
    expect(text).not.toContain("user_anon_123");
    expect(text).not.toContain("非公開メモ");
    expect(text).toContain("5,000円");
    expect(text).toContain("※手入力値・最新は各サイトで確認");
  });
});
