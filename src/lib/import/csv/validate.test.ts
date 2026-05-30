import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import type { ProductFeedCsvRow } from "@/lib/import/csv/schema";
import { sanitizeCsvCell, validateProductFeedCsvRow } from "@/lib/import/csv/validate";

const validRow: ProductFeedCsvRow = {
  merchantId: "rakuten",
  externalId: "sample-001",
  title: "サンプル商品",
  productUrl: "https://item.rakuten.co.jp/example/sample-item/",
  affiliateUrl: "",
  imageUrl: "",
  priceMemo: "店舗申告の参考メモ"
};

describe("CSV product feed validation", () => {
  it("許可済みECのサンプル行を受け付ける", () => {
    expect(validateProductFeedCsvRow(validRow, merchants)).toEqual({
      ok: true,
      value: {
        merchantId: "rakuten",
        externalId: "sample-001",
        title: "サンプル商品",
        productUrl: "https://item.rakuten.co.jp/example/sample-item/",
        affiliateUrl: null,
        imageUrl: null,
        priceMemo: "店舗申告の参考メモ"
      }
    });
  });

  it("CSVインジェクションになり得るセルを無害化する", () => {
    expect(sanitizeCsvCell("=HYPERLINK(\"https://example.com\")")).toBe("'=HYPERLINK(\"https://example.com\")");
  });

  it("未連携ECの商品フィードを拒否する", () => {
    const result = validateProductFeedCsvRow({ ...validRow, merchantId: "yahoo-shopping" }, merchants);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.errors).toContain("未連携ECの商品フィードは取り込めません。");
    }
  });

  it("許可ホスト外の画像URLを拒否する", () => {
    const result = validateProductFeedCsvRow({ ...validRow, imageUrl: "https://example.com/item.jpg" }, merchants, [
      "image.rakuten.co.jp"
    ]);
    expect(result).toMatchObject({ ok: false });
  });
});
