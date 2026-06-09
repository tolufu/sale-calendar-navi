import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import type { ProductFeedCsvRow } from "@/lib/import/csv/schema";
import { sanitizeCsvCell, validateProductFeedCsv, validateProductFeedCsvRow } from "@/lib/import/csv/validate";

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
    const result = validateProductFeedCsvRow({ ...validRow, merchantId: "amazon" }, merchants);
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

  it("商品フィードCSVをドライランし、BOM・コメント・引用符・重複を扱う", () => {
    const preview = validateProductFeedCsv(
      `\uFEFFmerchantId,externalId,title,productUrl,affiliateUrl,imageUrl,priceMemo
# comment,,,,,,

rakuten,sample-001,"サンプル商品, 改訂",https://item.rakuten.co.jp/example/sample-item/,,,手動確認
rakuten,sample-001,更新商品,https://item.rakuten.co.jp/example/sample-item/,,,更新`,
      merchants
    );
    expect(preview.fileErrors).toEqual([]);
    expect(preview.validCount).toBe(2);
    expect(preview.validRows).toHaveLength(1);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.validRows[0]).toMatchObject({ title: "更新商品", priceMemo: "更新" });
  });

  it("商品フィードCSVの不正ヘッダーと未閉じ引用符を拒否する", () => {
    expect(validateProductFeedCsv("title,merchantId\n商品,rakuten", merchants).fileErrors).toHaveLength(1);
    expect(validateProductFeedCsv(
      "merchantId,externalId,title,productUrl,affiliateUrl,imageUrl,priceMemo\nrakuten,id,\"商品",
      merchants
    ).fileErrors).toContain("CSVの引用符が閉じられていません。");
  });
});
