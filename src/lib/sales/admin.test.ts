import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import {
  buildSaleEvent,
  createSaleEventId,
  parseJstDateTime,
  validateSaleForm
} from "@/lib/sales/admin";

describe("sale admin utilities", () => {
  it("JST日時をISO化し、拡張時刻を翌日へ繰り上げる", () => {
    expect(parseJstDateTime("2026-06-10 25:59")).toBe("2026-06-10T16:59:00.000Z");
    expect(parseJstDateTime("2026-02-30 10:00")).toBeNull();
  });

  it("EC、日時順序、https URLを検証する", () => {
    const errors = validateSaleForm({
      merchantId: "missing",
      title: "",
      saleType: "",
      startAt: "2026-06-10T20:00",
      endAt: "2026-06-09T20:00",
      confidence: "confirmed",
      sourceUrl: "http://example.com",
      description: "",
      strategyMemo: "",
      confidenceNote: ""
    }, merchants);

    expect(errors.merchantId).toBeTruthy();
    expect(errors.title).toBeTruthy();
    expect(errors.saleType).toBeTruthy();
    expect(errors.endAt).toBeTruthy();
    expect(errors.sourceUrl).toBeTruthy();
  });

  it("安定IDを生成してフォーム値をイベントへ変換する", () => {
    const event = buildSaleEvent({
      merchantId: "rakuten",
      title: "楽天スーパーSALE",
      saleType: "super-sale",
      startAt: "2026-06-04T20:00",
      endAt: "2026-06-11T01:59",
      confidence: "estimated",
      sourceUrl: "https://example.com/sale",
      description: "説明",
      strategyMemo: "",
      confidenceNote: "予測根拠"
    });

    expect(event.id).toBe("rakuten-super-sale-20260604");
    expect(createSaleEventId("rakuten", "大型セール", event.startAt)).toBe("rakuten-sale-20260604");
    expect(event.confidenceNote).toBe("予測根拠");
  });
});
