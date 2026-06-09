import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import { validateSaleScheduleCsv, validateSaleScheduleCsvRow } from "@/lib/import/csv/sale-schedule-validate";
import type { SaleScheduleCsvRow } from "@/lib/import/csv/sale-schedule-schema";

const validRow: SaleScheduleCsvRow = {
  merchantId: "rakuten",
  title: "楽天スーパーSALE",
  saleType: "super-sale",
  startAt: "2026-06-04 20:00",
  endAt: "2026-06-10 25:59",
  confidence: "",
  sourceUrl: "https://example.com/sale",
  note: "手動確認"
};

describe("sale schedule CSV validation", () => {
  it("空confidenceをconfirmedとして受け付け、25:59を翌日へ繰り上げる", () => {
    const result = validateSaleScheduleCsvRow(validRow, merchants);
    expect(result).toMatchObject({
      ok: true,
      value: {
        id: "rakuten-super-sale-20260604",
        confidence: "confirmed",
        startAt: "2026-06-04T11:00:00.000Z",
        endAt: "2026-06-10T16:59:00.000Z"
      }
    });
  });

  it("BOM、コメント、空行を除外して引用符付きCSVを解析する", () => {
    const preview = validateSaleScheduleCsv(
      `\uFEFFmerchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note
# comment,,,,,,,

rakuten,"楽天スーパーSALE, 6月",super-sale,2026-06-04 20:00,2026-06-10 25:59,estimated,https://example.com/sale,"根拠, 手動確認"`,
      merchants
    );
    expect(preview.fileErrors).toEqual([]);
    expect(preview.validCount).toBe(1);
    expect(preview.rows[0].result).toMatchObject({
      ok: true,
      value: {
        title: "楽天スーパーSALE, 6月",
        confidenceNote: "根拠, 手動確認"
      }
    });
  });

  it("無効EC、逆転日時、http URLを拒否する", () => {
    const result = validateSaleScheduleCsvRow({
      ...validRow,
      merchantId: "missing",
      startAt: "2026-06-10 20:00",
      endAt: "2026-06-09 20:00",
      sourceUrl: "http://example.com"
    }, merchants);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.errors).toContain("有効なmerchantIdを指定してください。");
      expect(result.errors).toContain("endAtはstartAt以降にしてください。");
      expect(result.errors).toContain("sourceUrlはhttps URLのみ指定できます。");
    }
  });

  it("ヘッダー順序の不一致を拒否する", () => {
    const preview = validateSaleScheduleCsv("title,merchantId\nsample,rakuten", merchants);
    expect(preview.fileErrors).toHaveLength(1);
    expect(preview.validCount).toBe(0);
  });

  it("列数不一致と未閉じ引用符を拒否する", () => {
    const wrongColumns = validateSaleScheduleCsv(
      "merchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note\nrakuten,title,type,2026-06-04 20:00",
      merchants
    );
    expect(wrongColumns.rows[0].result).toMatchObject({ ok: false });

    const malformed = validateSaleScheduleCsv(
      "merchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note\nrakuten,\"title,type,2026-06-04 20:00",
      merchants
    );
    expect(malformed.fileErrors).toContain("CSVの引用符が閉じられていません。");
  });

  it("既存と突き合わせて新規/更新を示し、CSV内の重複を統合する", () => {
    const existing = validateSaleScheduleCsvRow(validRow, merchants);
    if (!existing.ok) throw new Error("fixture invalid");

    const csv = [
      "merchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note",
      "rakuten,楽天スーパーSALE,super-sale,2026-06-04 20:00,2026-06-10 25:59,confirmed,https://example.com/a,既存更新",
      "rakuten,楽天スーパーSALE 重複,super-sale,2026-06-04 21:00,2026-06-10 25:59,confirmed,https://example.com/b,同日同種で重複",
      "amazon,Amazonプライムデー,prime-day,2026-07-15 09:00,2026-07-16 23:59,confirmed,https://example.com/c,新規"
    ].join("\n");

    const preview = validateSaleScheduleCsv(csv, merchants, [existing.value]);
    expect(preview.rows[0].mode).toBe("update");
    expect(preview.rows[2].mode).toBe("create");
    // 1・2行目は同一安定ID(rakuten-super-sale-20260604)へ解決され1件へ統合される。
    expect(preview.validCount).toBe(3);
    expect(preview.validEvents).toHaveLength(2);
    expect(preview.duplicateCount).toBe(1);
  });

  it("運用中のsale-schedule-input.csvを取り込める", () => {
    const content = readFileSync("docs/sale-schedule-input.csv", "utf8");
    const preview = validateSaleScheduleCsv(content, merchants, saleEvents);
    expect(preview.fileErrors).toEqual([]);
    expect(preview.skippedCount).toBe(0);
    expect(preview.validCount).toBeGreaterThan(0);
    expect(preview.validEvents[0].id).toBe(saleEvents[0].id);
    expect(preview.validEvents[0].saleType).toBe(saleEvents[0].saleType);
    expect(preview.validEvents[0].description).toBe(saleEvents[0].description);
  });
});
